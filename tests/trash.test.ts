import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import {
  addScope,
  close,
  db,
  prepareDatabase,
  schema,
  seedContentTree,
  seedStore,
} from "./helpers/db";
import { placeOrder, listOrders, getOrderDetail } from "@/server/orders";
import { getSheetFigures } from "@/server/admin";
import {
  listTrash,
  purgeExpiredTrash,
  purgeFromTrash,
  restoreFromTrash,
} from "@/server/trash";

/**
 * The unified trash — 12-trash-and-soft-delete-system's own verification
 * checklist: archive, appears in trash, restore, archive again, simulate
 * 31 days old, lazy purge removes it, a still-referenced row is not purged
 * even when overdue.
 */

let store: Awaited<ReturnType<typeof seedStore>>;
let admin: { id: string };

async function placedOrder() {
  const result = await placeOrder({
    customerName: "Yasmine B.",
    phone: "0555123456",
    wilayaCode: store.wilayaCode,
    communeId: store.commune.id,
    deliveryType: "home",
    address: "Cité 1200 logements",
    items: [{ productId: store.product.id, quantity: 1 }],
  });
  if (!result.ok) throw new Error("seed order failed to place");
  return result.orderId;
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

describe("orders: trashing hides immediately, everywhere", () => {
  it("drops out of listOrders once archived", async () => {
    const orderId = await placedOrder();
    expect((await listOrders()).some((o) => o.id === orderId)).toBe(true);

    await db.update(schema.orders).set({ archivedAt: new Date() }).where(eq(schema.orders.id, orderId));

    expect((await listOrders()).some((o) => o.id === orderId)).toBe(false);
  });

  it("drops out of delivered revenue once archived", async () => {
    const orderId = await placedOrder();
    await db
      .update(schema.orders)
      .set({ status: "delivered", archivedAt: null })
      .where(eq(schema.orders.id, orderId));

    const before = await getSheetFigures();
    expect(before.deliveredCount).toBeGreaterThan(0);

    await db.update(schema.orders).set({ archivedAt: new Date() }).where(eq(schema.orders.id, orderId));

    const after = await getSheetFigures();
    expect(after.deliveredCount).toBe(before.deliveredCount - 1);
    expect(after.revenueDzd).toBeLessThan(before.revenueDzd);
  });
});

describe("the trash lifecycle: archive, list, restore, purge", () => {
  it("appears in listTrash once archived, and its title names the order", async () => {
    const orderId = await placedOrder();
    const order = await getOrderDetail(orderId);
    await db.update(schema.orders).set({ archivedAt: new Date() }).where(eq(schema.orders.id, orderId));

    const rows = await listTrash(["order"]);
    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe(orderId);
    expect(rows[0].title).toContain(order!.reference);
  });

  it("restore clears archivedAt and takes it out of the trash", async () => {
    const orderId = await placedOrder();
    await db.update(schema.orders).set({ archivedAt: new Date() }).where(eq(schema.orders.id, orderId));

    const result = await restoreFromTrash("order", orderId, admin.id);
    expect(result.ok).toBe(true);

    const [row] = await db.select().from(schema.orders).where(eq(schema.orders.id, orderId));
    expect(row.archivedAt).toBeNull();
    expect(await listTrash(["order"])).toHaveLength(0);
  });

  it("restore on a row that is not archived fails, rather than silently succeeding", async () => {
    const orderId = await placedOrder();
    const result = await restoreFromTrash("order", orderId, admin.id);
    expect(result.ok).toBe(false);
  });

  it("purge refuses a row that was never archived", async () => {
    const orderId = await placedOrder();
    const result = await purgeFromTrash("order", orderId, admin.id);
    expect(result.ok).toBe(false);

    const [row] = await db.select().from(schema.orders).where(eq(schema.orders.id, orderId));
    expect(row).toBeDefined();
  });

  it("purge on an archived order really deletes the row, order_items included", async () => {
    const orderId = await placedOrder();
    await db.update(schema.orders).set({ archivedAt: new Date() }).where(eq(schema.orders.id, orderId));

    const result = await purgeFromTrash("order", orderId, admin.id);
    expect(result.ok).toBe(true);

    const [row] = await db.select().from(schema.orders).where(eq(schema.orders.id, orderId));
    expect(row).toBeUndefined();
    const items = await db
      .select()
      .from(schema.orderItems)
      .where(eq(schema.orderItems.orderId, orderId));
    expect(items).toHaveLength(0);
  });
});

describe("lazy purge: 30 days, backdated for the test rather than waited for", () => {
  it("purges an order archived 31 days ago", async () => {
    const orderId = await placedOrder();
    const thirtyOneDaysAgo = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000);
    await db
      .update(schema.orders)
      .set({ archivedAt: thirtyOneDaysAgo })
      .where(eq(schema.orders.id, orderId));

    const purged = await purgeExpiredTrash(admin.id);
    expect(purged).toBeGreaterThanOrEqual(1);

    const [row] = await db.select().from(schema.orders).where(eq(schema.orders.id, orderId));
    expect(row).toBeUndefined();
  });

  it("leaves an order archived only a day ago alone", async () => {
    const orderId = await placedOrder();
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    await db.update(schema.orders).set({ archivedAt: yesterday }).where(eq(schema.orders.id, orderId));

    await purgeExpiredTrash(admin.id);

    const [row] = await db.select().from(schema.orders).where(eq(schema.orders.id, orderId));
    expect(row).toBeDefined();
  });
});

describe("content purge respects package_contents even when RESTRICT alone would not catch it", () => {
  it("refuses to purge a module a package still grants access through", async () => {
    const tree = await seedContentTree();
    const [pkg] = await db
      .insert(schema.lmsPackages)
      .values({ titleEn: "Test package", priceDzd: 500000 })
      .returning();
    await addScope(pkg.id, "module", tree.years.L1.moduleId);

    await db
      .update(schema.modules)
      .set({ archivedAt: new Date() })
      .where(eq(schema.modules.id, tree.years.L1.moduleId));

    const result = await purgeFromTrash("content_module", tree.years.L1.moduleId, admin.id);
    expect(result.ok).toBe(false);

    const [row] = await db
      .select()
      .from(schema.modules)
      .where(eq(schema.modules.id, tree.years.L1.moduleId));
    expect(row).toBeDefined();
  });

  it("purges a resource with nothing referencing it", async () => {
    const tree = await seedContentTree();
    await db
      .update(schema.resources)
      .set({ archivedAt: new Date() })
      .where(eq(schema.resources.id, tree.years.L1.resourceId));

    const result = await purgeFromTrash("content_resource", tree.years.L1.resourceId, admin.id);
    expect(result.ok).toBe(true);

    const [row] = await db
      .select()
      .from(schema.resources)
      .where(eq(schema.resources.id, tree.years.L1.resourceId));
    expect(row).toBeUndefined();
  });
});

describe("the RESTRICT backstop: a real foreign key still refuses, translated to a friendly message", () => {
  it("refuses to purge a product an order still references, and names the order", async () => {
    const orderId = await placedOrder();
    const order = await getOrderDetail(orderId);
    await db
      .update(schema.products)
      .set({ archivedAt: new Date() })
      .where(eq(schema.products.id, store.product.id));

    const result = await purgeFromTrash("product", store.product.id, admin.id);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toContain(order!.reference);

    const [row] = await db.select().from(schema.products).where(eq(schema.products.id, store.product.id));
    expect(row).toBeDefined();
  });
});

describe("purging a product cleans up its own child rows first", () => {
  it("purges a product carrying images, specs, offers and colors, and nothing left over", async () => {
    await db.insert(schema.productImages).values({ productId: store.product.id, path: "/x.jpg" });
    await db.insert(schema.productSpecs).values({
      productId: store.product.id,
      labelEn: "Material",
      valueEn: "Aluminium",
    });
    await db.insert(schema.productOffers).values({
      productId: store.product.id,
      minQuantity: 2,
      kind: "percent",
      value: 10,
    });
    await db.insert(schema.productColors).values({ productId: store.product.id, nameEn: "Black" });

    await db
      .update(schema.products)
      .set({ archivedAt: new Date() })
      .where(eq(schema.products.id, store.product.id));

    const result = await purgeFromTrash("product", store.product.id, admin.id);
    expect(result.ok).toBe(true);

    const [row] = await db.select().from(schema.products).where(eq(schema.products.id, store.product.id));
    expect(row).toBeUndefined();
    expect(
      await db.select().from(schema.productImages).where(eq(schema.productImages.productId, store.product.id)),
    ).toHaveLength(0);
    expect(
      await db.select().from(schema.productSpecs).where(eq(schema.productSpecs.productId, store.product.id)),
    ).toHaveLength(0);
    expect(
      await db.select().from(schema.productOffers).where(eq(schema.productOffers.productId, store.product.id)),
    ).toHaveLength(0);
    expect(
      await db.select().from(schema.productColors).where(eq(schema.productColors.productId, store.product.id)),
    ).toHaveLength(0);
  });

  it("still refuses when a promo code is directly scoped to the product, and names the code", async () => {
    const code = `TEST-${crypto.randomUUID().slice(0, 6)}`;
    await db.insert(schema.promoCodes).values({
      code,
      kind: "percent",
      value: 10,
      scopeType: "product",
      productId: store.product.id,
    });

    await db
      .update(schema.products)
      .set({ archivedAt: new Date() })
      .where(eq(schema.products.id, store.product.id));

    const result = await purgeFromTrash("product", store.product.id, admin.id);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toContain(code);

    const [row] = await db.select().from(schema.products).where(eq(schema.products.id, store.product.id));
    expect(row).toBeDefined();
  });
});
