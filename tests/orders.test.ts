import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { close, db, prepareDatabase, schema, seedStore } from "./helpers/db";
import {
  cancelOrder,
  confirmOrder,
  getOrderDetail,
  placeOrder,
} from "@/server/orders";

/**
 * Items 6, 7 and 8 in _AI_CONTEXT/08_TESTING.md.
 *
 * Two of the three are concurrency. Both races are real in the client's own
 * working day: two people work the confirmation queue, and a promo code goes
 * out on Instagram to several thousand students at once. Neither shows up in
 * a manual test, which is the whole reason they are written down.
 */

let store: Awaited<ReturnType<typeof seedStore>>;
let admin: { id: string };

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

async function stockOf(productId: string) {
  const [row] = await db
    .select({ stockCount: schema.products.stockCount })
    .from(schema.products)
    .where(eq(schema.products.id, productId));
  return row.stockCount;
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
 * Item 6. Stock moves on the phone call, and never below zero.
 * ----------------------------------------------------------------------- */

describe("stock on confirmation", () => {
  it("does not move stock when an order is merely placed", async () => {
    const before = await stockOf(store.product.id);

    const result = await placeOrder(checkout({ items: [{ productId: store.product.id, quantity: 3 }] }));

    expect(result.ok).toBe(true);
    // A pending order is not a sale. The customer has not answered the phone.
    expect(await stockOf(store.product.id)).toBe(before);
  });

  it("decrements on confirmation", async () => {
    const placed = await placeOrder(
      checkout({ items: [{ productId: store.product.id, quantity: 3 }] }),
    );
    if (!placed.ok) throw new Error("placement failed");

    expect(await confirmOrder(placed.orderId, admin.id)).toEqual({ ok: true });
    expect(await stockOf(store.product.id)).toBe(7);
  });

  it("never goes negative when two admins confirm the last unit at once", async () => {
    store = await seedStore({ stockCount: 1 });
    const ids: string[] = [];
    for (let i = 0; i < 2; i++) {
      const placed = await placeOrder(checkout());
      if (!placed.ok) throw new Error("placement failed");
      ids.push(placed.orderId);
    }

    const results = await Promise.all(ids.map((id) => confirmOrder(id, admin.id)));

    expect(results.filter((r) => r.ok)).toHaveLength(1);
    expect(results.filter((r) => !r.ok)).toEqual([
      { ok: false, error: "insufficient_stock", productId: store.product.id },
    ]);
    expect(await stockOf(store.product.id)).toBe(0);
  });

  it("never goes negative under eight simultaneous confirmations of three units", async () => {
    store = await seedStore({ stockCount: 10 });
    const ids: string[] = [];
    for (let i = 0; i < 8; i++) {
      const placed = await placeOrder(
        checkout({ items: [{ productId: store.product.id, quantity: 3 }] }),
      );
      if (!placed.ok) throw new Error("placement failed");
      ids.push(placed.orderId);
    }

    const results = await Promise.all(ids.map((id) => confirmOrder(id, admin.id)));

    // Ten units, three per order: three orders can be served and five cannot.
    expect(results.filter((r) => r.ok)).toHaveLength(3);
    expect(await stockOf(store.product.id)).toBe(1);
    expect(await stockOf(store.product.id)).toBeGreaterThanOrEqual(0);
  });

  it("leaves the order pending when it is refused for stock", async () => {
    store = await seedStore({ stockCount: 0 });
    const placed = await placeOrder(checkout());
    if (!placed.ok) throw new Error("placement failed");

    const result = await confirmOrder(placed.orderId, admin.id);

    expect(result.ok).toBe(false);
    // The transaction rolled back, so the header did not advance either. An
    // order stuck at `confirmed` with no stock taken is worse than a refusal.
    const detail = await getOrderDetail(placed.orderId);
    expect(detail!.status).toBe("pending");
    expect(detail!.confirmedAt).toBeNull();
  });

  it("refuses a second confirmation rather than taking stock twice", async () => {
    const placed = await placeOrder(checkout());
    if (!placed.ok) throw new Error("placement failed");

    await confirmOrder(placed.orderId, admin.id);
    const again = await confirmOrder(placed.orderId, admin.id);

    expect(again).toEqual({ ok: false, error: "not_pending" });
    expect(await stockOf(store.product.id)).toBe(9);
  });

  it("does not draw down stock for a gift-card product", async () => {
    // A printed card comes from a batch, not off a shelf.
    const [card] = await db
      .insert(schema.products)
      .values({
        slug: `card-${crypto.randomUUID().slice(0, 8)}`,
        titleEn: "Access card",
        priceDzd: 500000,
        type: "lms_access",
        stockCount: 0,
        containsAccessCode: true,
        categoryId: store.product.categoryId,
      })
      .returning();

    const placed = await placeOrder(
      checkout({ items: [{ productId: card.id, quantity: 2 }] }),
    );
    if (!placed.ok) throw new Error("placement failed");

    expect(await confirmOrder(placed.orderId, admin.id)).toEqual({ ok: true });
    expect(await stockOf(card.id)).toBe(0);
  });

  it("returns stock on cancellation only after it had been taken", async () => {
    const pending = await placeOrder(checkout());
    const confirmed = await placeOrder(checkout());
    if (!pending.ok || !confirmed.ok) throw new Error("placement failed");
    await confirmOrder(confirmed.orderId, admin.id);
    expect(await stockOf(store.product.id)).toBe(9);

    await cancelOrder(pending.orderId, { fr: "Injoignable", ar: "لا يرد" }, admin.id);
    expect(await stockOf(store.product.id)).toBe(9);

    await cancelOrder(confirmed.orderId, { fr: "Refusée", ar: "مرفوضة" }, admin.id);
    expect(await stockOf(store.product.id)).toBe(10);
  });
});

/* --------------------------------------------------------------------------
 * The reference, which the customer is quoted on the phone and types into the
 * guest lookup. It is unique, and it is built by counting rows.
 * ----------------------------------------------------------------------- */

describe("order reference", () => {
  it("gives every order its own reference when eight carts submit at once", async () => {
    store = await seedStore({ stockCount: 100 });

    // Not `Promise.all`: a rejection there hides how many of the eight failed,
    // and the number is the point. Before the advisory lock in
    // `nextReference`, one of these succeeded and seven threw a duplicate key
    // error at the customer.
    const settled = await Promise.allSettled(
      Array.from({ length: 8 }, () => placeOrder(checkout())),
    );

    expect(settled.filter((r) => r.status === "rejected")).toEqual([]);
    const references = settled.map((r) =>
      r.status === "fulfilled" && r.value.ok ? r.value.reference : null,
    );
    expect(new Set(references).size).toBe(8);
  });

  it("numbers references sequentially from one", async () => {
    const first = await placeOrder(checkout());
    const second = await placeOrder(checkout());

    if (!first.ok || !second.ok) throw new Error("placement failed");
    expect(first.reference).toMatch(/^TP-\d{4}-0001$/);
    expect(second.reference).toMatch(/^TP-\d{4}-0002$/);
  });
});

/* --------------------------------------------------------------------------
 * Item 7. A capped promo code against a cart everyone opens at once.
 * ----------------------------------------------------------------------- */

describe("promo code usage cap", () => {
  async function seedPromo(
    overrides: Partial<typeof schema.promoCodes.$inferInsert> = {},
  ) {
    // Mirrors savePromoCodeAction and the 0020 migration's backfill: a
    // productId with no explicit scopeType must not silently default to
    // 'cart' (the column default), or it applies everywhere instead of to
    // the one product it names.
    const scopeType = overrides.scopeType ?? (overrides.productId ? "product" : "cart");
    const [row] = await db
      .insert(schema.promoCodes)
      .values({ code: "RENTREE", kind: "percent", value: 20, scopeType, ...overrides })
      .returning();
    return row;
  }

  it("applies the discount when the code is live", async () => {
    await seedPromo();

    const result = await placeOrder(checkout({ promoCode: "RENTREE" }));

    if (!result.ok) throw new Error("placement failed");
    // 2500 DA, less 20%, plus 600 DA home delivery.
    expect(result.totalDzd).toBe(250000 - 50000 + 60000);
  });

  it("never exceeds max_uses when six carts submit at the same moment", async () => {
    const promo = await seedPromo({ maxUses: 2 });

    const results = await Promise.all(
      Array.from({ length: 6 }, () => placeOrder(checkout({ promoCode: "RENTREE" }))),
    );

    // Every order goes through. The code is what runs out, not the checkout.
    expect(results.every((r) => r.ok)).toBe(true);

    const [after] = await db
      .select()
      .from(schema.promoCodes)
      .where(eq(schema.promoCodes.id, promo.id));
    expect(after.usedCount).toBe(2);
    expect(after.usedCount).toBeLessThanOrEqual(after.maxUses!);

    const discounted = await db
      .select()
      .from(schema.orders)
      .where(eq(schema.orders.promoCodeId, promo.id));
    expect(discounted).toHaveLength(2);
    for (const order of discounted) expect(order.discountDzd).toBe(50000);
  });

  it("charges full price rather than failing when the code runs out mid-checkout", async () => {
    const promo = await seedPromo({ maxUses: 1 });
    await placeOrder(checkout({ promoCode: "RENTREE" }));

    const second = await placeOrder(checkout({ promoCode: "RENTREE" }));

    if (!second.ok) throw new Error("placement failed");
    expect(second.totalDzd).toBe(250000 + 60000);
    const detail = await getOrderDetail(second.orderId);
    expect(detail!.discountDzd).toBe(0);
    expect(detail!.promoCodeId).toBeNull();
  });

  it("ignores a code that is inactive, unstarted, finished or for another product", async () => {
    const [other] = await db
      .insert(schema.products)
      .values({
        slug: `other-${crypto.randomUUID().slice(0, 8)}`,
        titleEn: "Ruler",
        priceDzd: 100000,
        categoryId: store.product.categoryId,
      })
      .returning();

    const cases: [string, Partial<typeof schema.promoCodes.$inferInsert>][] = [
      ["INACTIVE", { isActive: false }],
      ["EARLY", { startsAt: new Date(Date.now() + 86_400_000) }],
      ["OVER", { endsAt: new Date(Date.now() - 86_400_000) }],
      ["SPENT", { maxUses: 1, usedCount: 1 }],
      ["OTHERPRODUCT", { productId: other.id }],
    ];

    for (const [code, overrides] of cases) {
      await seedPromo({ code, ...overrides });
      const result = await placeOrder(checkout({ promoCode: code }));
      if (!result.ok) throw new Error(`placement failed for ${code}`);
      expect(result.totalDzd, code).toBe(250000 + 60000);
    }
  });

  it("caps a fixed-amount discount at the subtotal, so shipping is still owed", async () => {
    await seedPromo({ code: "BIG", kind: "amount", value: 900000 });

    const result = await placeOrder(checkout({ promoCode: "BIG" }));

    if (!result.ok) throw new Error("placement failed");
    expect(result.totalDzd).toBe(60000);
  });
});

/* --------------------------------------------------------------------------
 * Quantity offers reaching the order total. `tests/offers.test.ts` covers the
 * arithmetic; this covers the wiring, which is the part that lets a customer
 * be charged a price they were never shown.
 * ----------------------------------------------------------------------- */

describe("quantity offers", () => {
  async function seedOffer(
    minQuantity: number,
    kind: "percent" | "unit_price",
    value: number,
  ) {
    await db
      .insert(schema.productOffers)
      .values({ productId: store.product.id, minQuantity, kind, value });
  }

  it("charges the list price below the threshold", async () => {
    await seedOffer(3, "unit_price", 180000);

    const result = await placeOrder(
      checkout({ items: [{ productId: store.product.id, quantity: 2 }] }),
    );

    if (!result.ok) throw new Error("placement failed");
    expect(result.totalDzd).toBe(500000 + store.homeDzd);
  });

  it("applies the tier at the threshold and freezes the unit price", async () => {
    await seedOffer(3, "unit_price", 180000);

    const result = await placeOrder(
      checkout({ items: [{ productId: store.product.id, quantity: 3 }] }),
    );
    if (!result.ok) throw new Error("placement failed");

    expect(result.totalDzd).toBe(540000 + store.homeDzd);

    const detail = await getOrderDetail(result.orderId);
    expect(detail!.subtotalDzd).toBe(540000);
    expect(detail!.items[0].priceAtPurchaseDzd).toBe(180000);
    // The list price is kept so a receipt can say what the offer saved,
    // instead of showing a number the customer never saw advertised.
    expect(detail!.items[0].listPriceDzd).toBe(250000);
  });

  it("leaves list_price null when no offer applied", async () => {
    const result = await placeOrder(checkout());

    if (!result.ok) throw new Error("placement failed");
    const detail = await getOrderDetail(result.orderId);
    expect(detail!.items[0].listPriceDzd).toBeNull();
  });

  it("does not re-price a past order when the offer changes", async () => {
    await seedOffer(3, "unit_price", 180000);
    const placed = await placeOrder(
      checkout({ items: [{ productId: store.product.id, quantity: 3 }] }),
    );
    if (!placed.ok) throw new Error("placement failed");

    // The client makes the deal worse in October. September's order is not
    // theirs to rewrite, exactly as with a bare price change.
    await db
      .update(schema.productOffers)
      .set({ value: 240000 })
      .where(eq(schema.productOffers.productId, store.product.id));

    const detail = await getOrderDetail(placed.orderId);
    expect(detail!.items[0].priceAtPurchaseDzd).toBe(180000);
    expect(detail!.totalDzd).toBe(540000 + store.homeDzd);
  });

  it("ignores an offer the admin switched off", async () => {
    await seedOffer(3, "unit_price", 180000);
    await db
      .update(schema.productOffers)
      .set({ isActive: false })
      .where(eq(schema.productOffers.productId, store.product.id));

    const result = await placeOrder(
      checkout({ items: [{ productId: store.product.id, quantity: 3 }] }),
    );

    if (!result.ok) throw new Error("placement failed");
    expect(result.totalDzd).toBe(750000 + store.homeDzd);
  });

  it("ignores an archived offer", async () => {
    await seedOffer(3, "unit_price", 180000);
    await db
      .update(schema.productOffers)
      .set({ archivedAt: new Date() })
      .where(eq(schema.productOffers.productId, store.product.id));

    const result = await placeOrder(
      checkout({ items: [{ productId: store.product.id, quantity: 3 }] }),
    );

    if (!result.ok) throw new Error("placement failed");
    expect(result.totalDzd).toBe(750000 + store.homeDzd);
  });

  it("stacks under a promo code rather than instead of it", async () => {
    await seedOffer(3, "unit_price", 180000);
    await db
      .insert(schema.promoCodes)
      .values({ code: "RENTREE", kind: "percent", value: 10 });

    const result = await placeOrder(
      checkout({
        promoCode: "RENTREE",
        items: [{ productId: store.product.id, quantity: 3 }],
      }),
    );

    if (!result.ok) throw new Error("placement failed");
    // The promo takes 10% of the already-offered subtotal, not of the list
    // price. Discounting a discount off the higher number is how a shop gives
    // away more than it meant to.
    expect(result.totalDzd).toBe(540000 - 54000 + store.homeDzd);
  });
});

/* --------------------------------------------------------------------------
 * Item 8. The total is arithmetic, and it is frozen.
 * ----------------------------------------------------------------------- */

describe("order total", () => {
  it("equals items plus shipping minus discount", async () => {
    await db
      .insert(schema.promoCodes)
      .values({ code: "DIX", kind: "percent", value: 10 });

    const result = await placeOrder(
      checkout({
        promoCode: "DIX",
        items: [{ productId: store.product.id, quantity: 2 }],
      }),
    );
    if (!result.ok) throw new Error("placement failed");

    const detail = await getOrderDetail(result.orderId);
    expect(detail!.subtotalDzd).toBe(500000);
    expect(detail!.shippingDzd).toBe(store.homeDzd);
    expect(detail!.discountDzd).toBe(50000);
    expect(detail!.totalDzd).toBe(500000 + store.homeDzd - 50000);
    expect(detail!.totalDzd).toBe(result.totalDzd);
  });

  it("charges the desk rate for a stop-desk delivery", async () => {
    const result = await placeOrder(checkout({ deliveryType: "desk" }));

    if (!result.ok) throw new Error("placement failed");
    expect(result.totalDzd).toBe(250000 + store.deskDzd);
  });

  it("does not move when the product price changes afterwards", async () => {
    const placed = await placeOrder(
      checkout({ items: [{ productId: store.product.id, quantity: 2 }] }),
    );
    if (!placed.ok) throw new Error("placement failed");

    // The client puts the price up in October. September's receipt is not
    // theirs to rewrite.
    await db
      .update(schema.products)
      .set({ priceDzd: 400000, titleFr: "Tube à dessin renforcé" })
      .where(eq(schema.products.id, store.product.id));

    const detail = await getOrderDetail(placed.orderId);

    expect(detail!.items[0].priceAtPurchaseDzd).toBe(250000);
    expect(detail!.items[0].titleAtPurchaseFr).toBe("Tube à dessin");
    expect(detail!.subtotalDzd).toBe(500000);
    expect(detail!.totalDzd).toBe(500000 + store.homeDzd);
  });

  it("survives the product being archived", async () => {
    const placed = await placeOrder(checkout());
    if (!placed.ok) throw new Error("placement failed");

    // Soft delete, never a row removal: an order must not resolve to a
    // missing product.
    await db
      .update(schema.products)
      .set({ archivedAt: new Date(), isVisible: false })
      .where(eq(schema.products.id, store.product.id));

    const detail = await getOrderDetail(placed.orderId);

    expect(detail!.items).toHaveLength(1);
    expect(detail!.items[0].titleAtPurchaseEn).toBe("Drawing tube");
    expect(detail!.totalDzd).toBe(250000 + store.homeDzd);
  });

  it("prices from the database, never from the posted cart", async () => {
    // A server action is a public endpoint. Anything the browser sends about
    // money is a suggestion.
    const result = await placeOrder({
      ...checkout(),
      items: [{ productId: store.product.id, quantity: 1, priceDzd: 1 }],
    } as never);

    if (!result.ok) throw new Error("placement failed");
    expect(result.totalDzd).toBe(250000 + store.homeDzd);
  });

  it("refuses a commune that does not sit in the posted wilaya", async () => {
    await db
      .insert(schema.wilayas)
      .values({ code: 31, nameFr: "Oran", nameAr: "وهران" })
      .onConflictDoNothing();

    const result = await placeOrder(checkout({ wilayaCode: 31 }));

    expect(result).toEqual({ ok: false, error: "commune_mismatch" });
  });

  it("refuses a wilaya with no shipping rate rather than shipping free", async () => {
    await db
      .update(schema.shippingRates)
      .set({ isAvailable: false })
      .where(eq(schema.shippingRates.wilayaCode, store.wilayaCode));

    const result = await placeOrder(checkout());

    expect(result).toEqual({ ok: false, error: "wilaya_unavailable" });
  });

  it("refuses an archived or hidden product", async () => {
    await db
      .update(schema.products)
      .set({ isVisible: false })
      .where(eq(schema.products.id, store.product.id));

    expect(await placeOrder(checkout())).toEqual({
      ok: false,
      error: "product_unavailable",
    });
  });

  it("refuses a landline before it writes anything", async () => {
    expect(await placeOrder(checkout({ phone: "021123456" }))).toEqual({
      ok: false,
      error: "phone_invalid",
    });

    const rows = await db.select().from(schema.orders);
    expect(rows).toHaveLength(0);
  });

  it("stores the phone in canonical form whichever way it was typed", async () => {
    const result = await placeOrder(checkout({ phone: "+213 555 12 34 56" }));

    if (!result.ok) throw new Error("placement failed");
    expect((await getOrderDetail(result.orderId))!.phone).toBe("0555123456");
  });
});
