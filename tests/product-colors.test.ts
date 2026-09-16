import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { close, db, prepareDatabase, schema, seedStore } from "./helpers/db";
import { cancelOrder, confirmOrder, placeOrder } from "@/server/orders";
import {
  addToCart,
  parseCart,
  serialiseCart,
  setCartQuantity,
  type CartItem,
} from "@/lib/cart";

/**
 * Task 10, NextPhase/10-product-variants/PLAN.md — the two things flagged
 * as the real risk: the cart wire-format change (shared by every product,
 * not just colored ones) and the stock branch (color row vs. product row)
 * at confirmation and cancellation.
 */

let store: Awaited<ReturnType<typeof seedStore>>;
let admin: { id: string };

async function addColor(productId: string, overrides: { stockCount?: number; nameEn?: string } = {}) {
  const [color] = await db
    .insert(schema.productColors)
    .values({
      productId,
      nameEn: overrides.nameEn ?? "Forest Green",
      stockCount: overrides.stockCount ?? 5,
    })
    .returning();
  return color;
}

async function colorStockOf(colorId: string) {
  const [row] = await db
    .select({ stockCount: schema.productColors.stockCount })
    .from(schema.productColors)
    .where(eq(schema.productColors.id, colorId));
  return row.stockCount;
}

async function productStockOf(productId: string) {
  const [row] = await db
    .select({ stockCount: schema.products.stockCount })
    .from(schema.products)
    .where(eq(schema.products.id, productId));
  return row.stockCount;
}

function checkout(
  overrides: Partial<Parameters<typeof placeOrder>[0]> = {},
): Parameters<typeof placeOrder>[0] {
  return {
    customerName: "Yasmine B.",
    phone: "0555123456",
    wilayaCode: store.wilayaCode,
    communeId: store.commune.id,
    deliveryType: "home",
    address: "Cité 1200 logements",
    items: [{ productId: store.product.id, quantity: 1 }],
    ...overrides,
  };
}

beforeEach(async () => {
  await prepareDatabase();
  store = await seedStore();
  const [row] = await db
    .insert(schema.users)
    .values({
      id: crypto.randomUUID(),
      name: "Admin",
      email: `admin-${crypto.randomUUID()}@tp-architecture.dz`,
    })
    .returning();
  admin = row;
});

afterAll(async () => {
  await close();
});

/* --------------------------------------------------------------------------
 * The cart wire format. Every product's cart line goes through this, not
 * just colored ones, so a regression here is a regression for everyone.
 * -------------------------------------------------------------------- */

describe("cart wire format", () => {
  const productId = "11111111-1111-1111-1111-111111111111";
  const colorId = "22222222-2222-2222-2222-222222222222";

  it("round-trips a colorless line the same as before this change", () => {
    const items: CartItem[] = [{ productId, colorId: null, quantity: 3 }];
    const wire = serialiseCart(items);
    expect(wire).toBe(`${productId}:3`);
    expect(parseCart(wire)).toEqual(items);
  });

  it("round-trips a colored line as productId:colorId:qty", () => {
    const items: CartItem[] = [{ productId, colorId, quantity: 2 }];
    const wire = serialiseCart(items);
    expect(wire).toBe(`${productId}:${colorId}:2`);
    expect(parseCart(wire)).toEqual(items);
  });

  it("still parses a two-field cookie set before this feature shipped", () => {
    // Exactly the old wire format, unprefixed. A cart cookie already sitting
    // in a visitor's browser at deploy time must not be silently dropped.
    expect(parseCart(`${productId}:4`)).toEqual([
      { productId, colorId: null, quantity: 4 },
    ]);
  });

  it("drops a malformed line instead of throwing", () => {
    expect(parseCart(`${productId}:${colorId}:notanumber`)).toEqual([]);
    expect(parseCart(`not-a-uuid:3`)).toEqual([]);
    expect(parseCart(`${productId}:not-a-uuid:3`)).toEqual([]);
  });

  it("treats two colors of the same product as two distinct lines", () => {
    const colorId2 = "33333333-3333-3333-3333-333333333333";
    let items: CartItem[] = [];
    items = addToCart(items, productId, 1, colorId);
    items = addToCart(items, productId, 1, colorId2);
    expect(items).toHaveLength(2);

    // Adding the same product/color pair again raises quantity, not a new line.
    items = addToCart(items, productId, 2, colorId);
    expect(items).toHaveLength(2);
    expect(items.find((i) => i.colorId === colorId)?.quantity).toBe(3);
  });

  it("removes only the matching color's line at quantity zero", () => {
    const colorId2 = "33333333-3333-3333-3333-333333333333";
    let items: CartItem[] = [
      { productId, colorId, quantity: 1 },
      { productId, colorId: colorId2, quantity: 1 },
    ];
    items = setCartQuantity(items, productId, 0, colorId);
    expect(items).toEqual([{ productId, colorId: colorId2, quantity: 1 }]);
  });
});

/* --------------------------------------------------------------------------
 * Placement: a product with visible colors requires one; a colorless
 * product is untouched by any of this.
 * -------------------------------------------------------------------- */

describe("placing a colored order", () => {
  it("refuses a colored product's line with no color posted", async () => {
    await addColor(store.product.id);
    const result = await placeOrder(checkout({ items: [{ productId: store.product.id, quantity: 1 }] }));
    expect(result).toEqual({ ok: false, error: "product_unavailable" });
  });

  it("refuses a color id that belongs to a different product", async () => {
    const other = await seedStore();
    const color = await addColor(other.product.id);
    const result = await placeOrder(
      checkout({ items: [{ productId: store.product.id, colorId: color.id, quantity: 1 }] }),
    );
    expect(result).toEqual({ ok: false, error: "product_unavailable" });
  });

  it("accepts and freezes a valid color on the order item", async () => {
    const color = await addColor(store.product.id, { nameEn: "Forest Green" });
    const result = await placeOrder(
      checkout({ items: [{ productId: store.product.id, colorId: color.id, quantity: 1 }] }),
    );
    if (!result.ok) throw new Error("placement failed");

    const [item] = await db
      .select()
      .from(schema.orderItems)
      .where(eq(schema.orderItems.orderId, result.orderId));
    expect(item.productColorId).toBe(color.id);
    expect(item.colorNameAtPurchaseEn).toBe("Forest Green");
  });

  it("leaves a colorless product's checkout exactly as before", async () => {
    // No color row exists for store.product at all.
    const result = await placeOrder(checkout());
    expect(result.ok).toBe(true);
  });
});

/* --------------------------------------------------------------------------
 * Stock: decrement and restock happen against the color row, not the
 * product row, once a line carries a color. A colorless product's stock
 * path must be completely unaffected.
 * -------------------------------------------------------------------- */

describe("stock, colored vs. colorless", () => {
  it("decrements the color's stock on confirmation, not the product's", async () => {
    const color = await addColor(store.product.id, { stockCount: 5 });
    const productBefore = await productStockOf(store.product.id);

    const placed = await placeOrder(
      checkout({ items: [{ productId: store.product.id, colorId: color.id, quantity: 2 }] }),
    );
    if (!placed.ok) throw new Error("placement failed");

    expect(await confirmOrder(placed.orderId, admin.id)).toEqual({ ok: true });
    expect(await colorStockOf(color.id)).toBe(3);
    // The product's own counter is not authoritative once it has a color and
    // must not silently move alongside it.
    expect(await productStockOf(store.product.id)).toBe(productBefore);
  });

  it("refuses confirmation when the color is short on stock, same guard as a product", async () => {
    const color = await addColor(store.product.id, { stockCount: 1 });
    const placed = await placeOrder(
      checkout({ items: [{ productId: store.product.id, colorId: color.id, quantity: 2 }] }),
    );
    if (!placed.ok) throw new Error("placement failed");

    const result = await confirmOrder(placed.orderId, admin.id);
    expect(result).toEqual({ ok: false, error: "insufficient_stock", productId: store.product.id });
    expect(await colorStockOf(color.id)).toBe(1);
  });

  it("returns stock to the color row on cancellation after confirmation", async () => {
    const color = await addColor(store.product.id, { stockCount: 5 });
    const placed = await placeOrder(
      checkout({ items: [{ productId: store.product.id, colorId: color.id, quantity: 2 }] }),
    );
    if (!placed.ok) throw new Error("placement failed");

    await confirmOrder(placed.orderId, admin.id);
    expect(await colorStockOf(color.id)).toBe(3);

    await cancelOrder(placed.orderId, { fr: "Annulé", ar: "ألغيت" }, admin.id);
    expect(await colorStockOf(color.id)).toBe(5);
  });

  it("still decrements the product row for a product with no colors at all", async () => {
    const placed = await placeOrder(checkout({ items: [{ productId: store.product.id, quantity: 3 }] }));
    if (!placed.ok) throw new Error("placement failed");

    expect(await confirmOrder(placed.orderId, admin.id)).toEqual({ ok: true });
    expect(await productStockOf(store.product.id)).toBe(7);
  });
});
