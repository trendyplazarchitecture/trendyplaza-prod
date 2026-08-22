import "server-only";

import { and, count, desc, eq, gte, ilike, inArray, isNull, lte, or, sql, type SQL } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import type { Executor } from "@/db";
import {
  accessCodes,
  communes,
  orderItems,
  orders,
  productColors,
  products,
  promoCodeProducts,
  promoCodes,
  wilayas,
} from "@/db/schema";
import { normalisePhone } from "@/lib/phone";
import { paged, resolveList, type ListQuery, type Sortable } from "./_list";
import { applyDiscount } from "@/lib/money";
import { priceLine } from "@/lib/offers";
import { activeOffersFor } from "./catalogue";
import { communeBelongsToWilaya, getShippingCost } from "./geo";
import { logActivity } from "./activity";
import { limitByIp } from "./rate-limit";

/**
 * A server action is a public HTTP endpoint. Whatever the checkout form
 * validated in the browser proves nothing about what arrives here, so every
 * field is parsed and every price is recomputed from the database.
 */
export const checkoutInput = z.object({
  customerName: z.string().trim().min(2).max(120),
  phone: z
    .string()
    .transform((v) => normalisePhone(v))
    .refine((v): v is string => v !== null, {
      message: "phone_invalid",
    }),
  email: z.string().email().max(200).optional().or(z.literal("")),
  wilayaCode: z.coerce.number().int().min(1),
  communeId: z.coerce.number().int().positive(),
  deliveryType: z.enum(["home", "desk"]),
  address: z.string().trim().max(300).optional(),
  customerNote: z.string().trim().max(500).optional(),
  promoCode: z.string().trim().max(40).optional(),
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        /** Set when the product has visible colors; validated against them below. */
        colorId: z.string().uuid().nullable().optional(),
        quantity: z.coerce.number().int().min(1).max(20),
      }),
    )
    .min(1)
    .max(20),
});

export type CheckoutInput = z.input<typeof checkoutInput>;

export type CheckoutResult =
  | { ok: true; reference: string; orderId: string; totalDzd: number }
  | {
      ok: false;
      error:
        | "phone_invalid"
        | "commune_mismatch"
        | "wilaya_unavailable"
        | "product_unavailable"
        | "empty_cart";
    };

/**
 * Cash on delivery. No payment state, no receipt, no account. Stock is not
 * touched here: it decrements when an admin confirms the order by phone,
 * because a pending order is not yet a sale.
 */
export async function placeOrder(
  raw: CheckoutInput,
  options: { createdByAdminId?: string } = {},
): Promise<CheckoutResult> {
  const parsed = checkoutInput.safeParse(raw);
  if (!parsed.success) {
    const isPhone = parsed.error.issues.some((i) => i.message === "phone_invalid");
    return { ok: false, error: isPhone ? "phone_invalid" : "empty_cart" };
  }
  const input = parsed.data;

  if (!(await communeBelongsToWilaya(input.communeId, input.wilayaCode))) {
    return { ok: false, error: "commune_mismatch" };
  }

  const shippingDzd = await getShippingCost(input.wilayaCode, input.deliveryType);
  if (shippingDzd === null) return { ok: false, error: "wilaya_unavailable" };

  const rows = await db
    .select()
    .from(products)
    .where(
      and(
        inArray(
          products.id,
          input.items.map((i) => i.productId),
        ),
        eq(products.isVisible, true),
        sql`${products.archivedAt} is null`,
      ),
    );

  const byId = new Map(rows.map((p) => [p.id, p]));
  if (byId.size !== new Set(input.items.map((i) => i.productId)).size) {
    return { ok: false, error: "product_unavailable" };
  }

  // A product with any visible color sells by color, never as a whole — the
  // same rule the storefront picker enforces, checked again here because the
  // posted cart proves nothing. Colorless products are unaffected.
  const colorRows = await db
    .select()
    .from(productColors)
    .where(
      and(
        inArray(productColors.productId, rows.map((p) => p.id)),
        eq(productColors.isVisible, true),
        sql`${productColors.archivedAt} is null`,
      ),
    );
  const colorsByProduct = new Map<string, typeof colorRows>();
  for (const c of colorRows) {
    const list = colorsByProduct.get(c.productId) ?? [];
    list.push(c);
    colorsByProduct.set(c.productId, list);
  }

  const colorById = new Map(colorRows.map((c) => [c.id, c]));
  for (const item of input.items) {
    const required = colorsByProduct.get(item.productId);
    if (!required || required.length === 0) {
      // Colorless product: a posted colorId here is not a real selection,
      // just data that does not belong to this line — reject rather than
      // silently drop it, the same way a mismatched productId is rejected.
      if (item.colorId) return { ok: false, error: "product_unavailable" };
      continue;
    }
    const color = item.colorId ? colorById.get(item.colorId) : undefined;
    if (!color || color.productId !== item.productId) {
      return { ok: false, error: "product_unavailable" };
    }
  }

  // Prices come from the database, never from the posted cart. Quantity
  // offers are resolved here too, with the same function the product page and
  // the cart preview use, so a customer is charged the price they were shown
  // and a posted "I qualify for the 3-pack rate" is worth nothing.
  const offers = await activeOffersFor(rows.map((p) => p.id));

  const lines = input.items.map((item) => {
    const product = byId.get(item.productId)!;
    const color = item.colorId ? colorById.get(item.colorId) : undefined;
    const priced = priceLine(
      product.priceDzd,
      item.quantity,
      offers.get(product.id) ?? [],
    );
    return {
      product,
      color: color ?? null,
      quantity: item.quantity,
      unitDzd: priced.unitDzd,
      listUnitDzd: priced.listUnitDzd,
      lineTotal: priced.totalDzd,
    };
  });
  const subtotalDzd = lines.reduce((sum, l) => sum + l.lineTotal, 0);

  const promo = input.promoCode
    ? await resolvePromo(
        input.promoCode,
        lines.map((l) => ({ productId: l.product.id, categoryId: l.product.categoryId })),
      )
    : null;
  const discountDzd = promo
    ? applyDiscount(subtotalDzd, promo.kind, promo.value)
    : 0;

  return db.transaction(async (tx) => {
    if (promo) {
      // Same guard shape as stock: a conditional UPDATE, so two carts cannot
      // both take the last use of a capped promo code.
      const claimed = await tx
        .update(promoCodes)
        .set({ usedCount: sql`${promoCodes.usedCount} + 1` })
        .where(
          and(
            eq(promoCodes.id, promo.id),
            eq(promoCodes.isActive, true),
            or(
              sql`${promoCodes.maxUses} is null`,
              sql`${promoCodes.usedCount} < ${promoCodes.maxUses}`,
            ),
          ),
        )
        .returning({ id: promoCodes.id });

      if (claimed.length === 0) {
        // Exhausted between validation and here. The order still goes through,
        // at full price, rather than failing at the last step.
        promo.exhausted = true;
      }
    }

    const effectiveDiscount = promo?.exhausted ? 0 : discountDzd;
    const totalDzd = subtotalDzd + shippingDzd - effectiveDiscount;

    const [order] = await tx
      .insert(orders)
      .values({
        reference: await nextReference(tx),
        customerName: input.customerName,
        phone: input.phone,
        email: input.email || null,
        wilayaCode: input.wilayaCode,
        communeId: input.communeId,
        deliveryType: input.deliveryType,
        address: input.address || null,
        customerNote: input.customerNote || null,
        subtotalDzd,
        shippingDzd,
        discountDzd: effectiveDiscount,
        totalDzd,
        promoCodeId: promo && !promo.exhausted ? promo.id : null,
        createdByAdminId: options.createdByAdminId ?? null,
      })
      .returning();

    await tx.insert(orderItems).values(
      lines.map((l) => ({
        orderId: order.id,
        productId: l.product.id,
        productColorId: l.color?.id ?? null,
        quantity: l.quantity,
        // Frozen here. Rendering this order next year must not read the
        // product's current price, and must not re-resolve an offer the
        // client has since changed or switched off.
        priceAtPurchaseDzd: l.unitDzd,
        listPriceDzd: l.unitDzd === l.listUnitDzd ? null : l.listUnitDzd,
        titleAtPurchaseEn: l.product.titleEn,
        titleAtPurchaseFr: l.product.titleFr,
        titleAtPurchaseAr: l.product.titleAr,
        colorNameAtPurchaseEn: l.color?.nameEn ?? null,
      })),
    );

    await logActivity({
      actorId: options.createdByAdminId ?? null,
      action: options.createdByAdminId ? "orders.created_manually" : "orders.placed",
      entity: "order",
      entityId: order.id,
      after: { reference: order.reference, totalDzd },
      tx,
    });

    return {
      ok: true as const,
      reference: order.reference,
      orderId: order.id,
      totalDzd,
    };
  });
}

/**
 * `TP-YYMM-NNNN`, sequential within the month, quoted to the customer on the
 * phone.
 *
 * Counting rows and adding one is a read-then-write, and `reference` is
 * unique. Two carts submitted in the same second both read the same count,
 * both build the same reference, and the second one dies on the index. The
 * advisory lock is held to the end of the transaction, so the count cannot
 * move between reading it and inserting against it.
 *
 * It is taken on the month, not on the orders table, and it is the only lock
 * a placement takes that another placement contends on. A sequence would not
 * do: this number restarts at 0001 every month, which is what makes it worth
 * reading down a phone.
 */
async function nextReference(tx: Executor): Promise<string> {
  const now = new Date();
  const stamp = `${String(now.getFullYear()).slice(2)}${String(now.getMonth() + 1).padStart(2, "0")}`;

  await tx.execute(
    sql`select pg_advisory_xact_lock(hashtext('orders_reference'), hashtext(${stamp}))`,
  );

  const [row] = await tx
    .select({ count: sql<number>`count(*)::int` })
    .from(orders)
    .where(ilike(orders.reference, `TP-${stamp}-%`));

  return `TP-${stamp}-${String((row?.count ?? 0) + 1).padStart(4, "0")}`;
}

/**
 * A script trying codes one after another against the live checkout is a
 * different threat than `maxUses` (which caps legitimate total redemptions,
 * not attack attempts), so it gets its own limit, checked here rather than
 * only at the checkout form's call site — that way it applies wherever this
 * function is ever called from.
 */
async function resolvePromo(
  code: string,
  cartLines: { productId: string; categoryId: string }[],
) {
  // `limitByIp` reads request headers, which only exist inside a real HTTP
  // request. `placeOrder` is unit-tested by calling it directly, with no
  // request to read from, and an admin-side call (`options.createdByAdminId`)
  // is still itself a server action, so it is never truly headerless in
  // production. Skipping the check outside that context is correct, not a
  // workaround: there is no IP to throttle when there was no request.
  try {
    const allowed = await limitByIp("promo-code", { limit: 10, windowSeconds: 60 * 60 });
    if (!allowed.ok) return null;
  } catch {
    // no request scope — proceed unthrottled
  }

  const [row] = await db
    .select()
    .from(promoCodes)
    .where(
      and(
        eq(promoCodes.code, code.trim().toUpperCase()),
        eq(promoCodes.isActive, true),
        sql`${promoCodes.archivedAt} is null`,
      ),
    )
    .limit(1);

  if (!row) return null;
  const now = Date.now();
  if (row.startsAt && row.startsAt.getTime() > now) return null;
  if (row.endsAt && row.endsAt.getTime() < now) return null;
  if (row.maxUses !== null && row.usedCount >= row.maxUses) return null;

  const productIds = cartLines.map((l) => l.productId);
  const categoryIds = cartLines.map((l) => l.categoryId);

  if (row.scopeType === "product") {
    if (!row.productId || !productIds.includes(row.productId)) return null;
  } else if (row.scopeType === "category") {
    if (!row.categoryId || !categoryIds.includes(row.categoryId)) return null;
  } else if (row.scopeType === "products") {
    const scoped = await db
      .select({ productId: promoCodeProducts.productId })
      .from(promoCodeProducts)
      .where(eq(promoCodeProducts.promoCodeId, row.id));
    if (!scoped.some((s) => productIds.includes(s.productId))) return null;
  }
  // scopeType === "cart": applies to whatever is in the cart, no further check.

  return { ...row, exhausted: false };
}

export type ConfirmResult =
  | { ok: true }
  | { ok: false; error: "not_pending" | "insufficient_stock"; productId?: string };

/**
 * The phone call. The admin rings the customer, then confirms, and only then
 * does stock move.
 *
 * Two admins confirming the last unit at the same moment is a real race in a
 * queue two people work. The guard is a conditional UPDATE with the quantity
 * in the WHERE clause, so the second one matches zero rows.
 */
export async function confirmOrder(
  orderId: string,
  actorId: string,
): Promise<ConfirmResult> {
  return db
    .transaction(async (tx) => {
      const advanced = await tx
        .update(orders)
        .set({ status: "confirmed", confirmedAt: new Date() })
        .where(and(eq(orders.id, orderId), eq(orders.status, "pending")))
        .returning({ id: orders.id });

      if (advanced.length === 0) {
        return { ok: false as const, error: "not_pending" as const };
      }

      const items = await tx
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, orderId));

      for (const item of items) {
        const [product] = await tx
          .select({ type: products.type })
          .from(products)
          .where(eq(products.id, item.productId))
          .limit(1);

        // A gift-card product is a printed card from a batch, not a counted
        // shelf item, so it does not draw down stock.
        if (product?.type === "lms_access") continue;

        // A product sells as a whole or by color, never both: once it has a
        // color on this line, that color row is what's authoritative, and
        // products.stock_count is left untouched.
        if (item.productColorId) {
          const decremented = await tx
            .update(productColors)
            .set({ stockCount: sql`${productColors.stockCount} - ${item.quantity}` })
            .where(
              and(
                eq(productColors.id, item.productColorId),
                gte(productColors.stockCount, item.quantity),
              ),
            )
            .returning({ stockCount: productColors.stockCount });

          if (decremented.length === 0) {
            throw new StockShortfall(item.productId);
          }
          continue;
        }

        const decremented = await tx
          .update(products)
          .set({ stockCount: sql`${products.stockCount} - ${item.quantity}` })
          .where(
            and(
              eq(products.id, item.productId),
              gte(products.stockCount, item.quantity),
            ),
          )
          .returning({ stockCount: products.stockCount });

        if (decremented.length === 0) {
          throw new StockShortfall(item.productId);
        }
      }

      await tx
        .update(orderItems)
        .set({ fulfillmentStatus: "confirmed" })
        .where(eq(orderItems.orderId, orderId));

      await logActivity({
        actorId,
        action: "orders.confirmed",
        entity: "order",
        entityId: orderId,
        tx,
      });

      return { ok: true as const };
    })
    .catch((error): ConfirmResult => {
      if (error instanceof StockShortfall) {
        return { ok: false, error: "insufficient_stock", productId: error.productId };
      }
      throw error;
    });
}

class StockShortfall extends Error {
  constructor(readonly productId: string) {
    super("insufficient_stock");
    this.name = "StockShortfall";
  }
}

/**
 * Advancing the whole order. Lines follow the header here; an order that ships
 * in two parts is edited line by line in the admin instead.
 */
export async function setOrderStatus(
  orderId: string,
  status: "packed" | "shipped" | "delivered" | "returned",
  actorId: string,
) {
  return db.transaction(async (tx) => {
    const [row] = await tx
      .update(orders)
      .set({ status })
      .where(eq(orders.id, orderId))
      .returning();

    await tx
      .update(orderItems)
      .set({ fulfillmentStatus: status })
      .where(eq(orderItems.orderId, orderId));

    await logActivity({
      actorId,
      action: `orders.${status}`,
      entity: "order",
      entityId: orderId,
      after: { status },
      tx,
    });

    return row;
  });
}

/**
 * Cancellation returns stock only if the order had been confirmed, because
 * that is the only point at which stock left.
 */
export async function cancelOrder(
  orderId: string,
  reason: { fr: string; ar: string },
  actorId: string,
) {
  return db.transaction(async (tx) => {
    const [order] = await tx
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);
    if (!order || order.status === "cancelled") return null;

    const shouldRestock = order.confirmedAt !== null;

    const [updated] = await tx
      .update(orders)
      .set({
        status: "cancelled",
        cancelReasonFr: reason.fr,
        cancelReasonAr: reason.ar,
      })
      .where(eq(orders.id, orderId))
      .returning();

    if (shouldRestock) {
      const items = await tx
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, orderId));

      for (const item of items) {
        if (item.productColorId) {
          await tx
            .update(productColors)
            .set({ stockCount: sql`${productColors.stockCount} + ${item.quantity}` })
            .where(eq(productColors.id, item.productColorId));
          continue;
        }
        await tx
          .update(products)
          .set({ stockCount: sql`${products.stockCount} + ${item.quantity}` })
          .where(eq(products.id, item.productId));
      }
    }

    await tx
      .update(orderItems)
      .set({ fulfillmentStatus: "cancelled" })
      .where(eq(orderItems.orderId, orderId));

    await logActivity({
      actorId,
      action: "orders.cancelled",
      entity: "order",
      entityId: orderId,
      before: { status: order.status },
      after: { reason: reason.fr, restocked: shouldRestock },
      tx,
    });

    return updated;
  });
}

export type OrderFilters = {
  status?: (typeof orders.status.enumValues)[number][];
  wilayaCode?: number;
  search?: string;
  from?: Date;
  to?: Date;
  limit?: number;
  offset?: number;
};

/**
 * The columns the orders queue may be sorted by.
 *
 * An allow-list, not a string: `sort` arrives from the query string, and
 * interpolating it into an ORDER BY is the classic way this becomes an
 * injection. Anything not a key here falls back to the default.
 */
export const ORDER_SORT = {
  createdAt: orders.createdAt,
  reference: orders.reference,
  customerName: orders.customerName,
  status: orders.status,
  totalDzd: orders.totalDzd,
  wilaya: orders.wilayaCode,
} satisfies Sortable;

export async function listOrders(filters: OrderFilters = {}) {
  // A trashed order is not part of any queue, report or export — the
  // dedicated trash view (`src/server/trash.ts`) reads the table directly.
  const where: (SQL<unknown> | undefined)[] = [isNull(orders.archivedAt)];
  if (filters.status?.length) where.push(inArray(orders.status, filters.status));
  if (filters.wilayaCode) where.push(eq(orders.wilayaCode, filters.wilayaCode));
  if (filters.from) where.push(gte(orders.createdAt, filters.from));
  if (filters.to) where.push(lte(orders.createdAt, filters.to));
  if (filters.search?.trim()) {
    const q = `%${filters.search.trim()}%`;
    where.push(
      or(
        ilike(orders.customerName, q),
        ilike(orders.phone, q),
        ilike(orders.reference, q),
      ),
    );
  }

  return db
    .select({
      id: orders.id,
      reference: orders.reference,
      customerName: orders.customerName,
      phone: orders.phone,
      status: orders.status,
      totalDzd: orders.totalDzd,
      deliveryType: orders.deliveryType,
      createdAt: orders.createdAt,
      wilayaNameFr: wilayas.nameFr,
      wilayaNameAr: wilayas.nameAr,
      communeNameFr: communes.nameFr,
      communeNameAr: communes.nameAr,
      itemCount: sql<number>`(
        select coalesce(sum(${orderItems.quantity}), 0)::int
        from ${orderItems} where ${orderItems.orderId} = ${orders.id}
      )`,
    })
    .from(orders)
    .innerJoin(wilayas, eq(wilayas.code, orders.wilayaCode))
    .innerJoin(communes, eq(communes.id, orders.communeId))
    .where(where.length ? and(...where) : undefined)
    .orderBy(desc(orders.createdAt))
    .limit(filters.limit ?? 50)
    .offset(filters.offset ?? 0);
}

/**
 * One order, with everything the person on the phone to the customer needs on
 * screen at once: where it goes, what is in it, what it cost, and any access
 * card issued against it.
 *
 * Line titles and prices come from the order row, never from `products`. An
 * order placed in September must not be rewritten by a rename in October.
 */
export async function getOrderDetail(orderId: string) {
  const [order] = await db
    .select({
      order: orders,
      wilayaNameFr: wilayas.nameFr,
      wilayaNameAr: wilayas.nameAr,
      communeNameFr: communes.nameFr,
      communeNameAr: communes.nameAr,
      promoCode: promoCodes.code,
    })
    .from(orders)
    .innerJoin(wilayas, eq(wilayas.code, orders.wilayaCode))
    .innerJoin(communes, eq(communes.id, orders.communeId))
    .leftJoin(promoCodes, eq(promoCodes.id, orders.promoCodeId))
    .where(eq(orders.id, orderId))
    .limit(1);
  if (!order) return null;

  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, orderId));

  // A code from a printed batch has no order. These are the ones issued
  // against this order specifically, which is a support path, not the norm.
  const codes = await db
    .select({
      id: accessCodes.id,
      code: accessCodes.code,
      isRedeemed: accessCodes.isRedeemed,
      redeemedAt: accessCodes.redeemedAt,
      voidedAt: accessCodes.voidedAt,
    })
    .from(accessCodes)
    .where(eq(accessCodes.orderId, orderId));

  return {
    ...order.order,
    wilayaNameFr: order.wilayaNameFr,
    wilayaNameAr: order.wilayaNameAr,
    communeNameFr: order.communeNameFr,
    communeNameAr: order.communeNameAr,
    promoCode: order.promoCode,
    items,
    codes,
  };
}

export async function getOrder(orderId: string) {
  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);
  if (!order) return null;

  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, orderId));

  return { ...order, items };
}

/**
 * Guest lookup: reference plus phone, both required, one generic failure.
 * Reference alone would let anyone walk the sequence and read a stranger's
 * name, phone and address.
 */
export async function lookupOrder(reference: string, phone: string) {
  const normalised = normalisePhone(phone);
  if (!normalised) return null;

  const [order] = await db
    .select()
    .from(orders)
    .where(
      and(
        eq(orders.reference, reference.trim().toUpperCase()),
        eq(orders.phone, normalised),
      ),
    )
    .limit(1);
  if (!order) return null;

  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, order.id));

  return { ...order, items };
}

/**
 * The queue, sorted and paged.
 *
 * `listOrders` stays for the overview panel, which wants five rows and no
 * furniture. This is the same query with a total beside it.
 */
export async function listOrdersPaged(
  filters: OrderFilters = {},
  query: ListQuery = {},
) {
  const resolved = resolveList(query, ORDER_SORT, { sort: "createdAt" });

  const where: (SQL<unknown> | undefined)[] = [isNull(orders.archivedAt)];
  if (filters.status?.length) where.push(inArray(orders.status, filters.status));
  if (filters.wilayaCode) where.push(eq(orders.wilayaCode, filters.wilayaCode));
  if (filters.from) where.push(gte(orders.createdAt, filters.from));
  if (filters.to) where.push(lte(orders.createdAt, filters.to));

  const search = resolved.search ?? filters.search;
  if (search?.trim()) {
    const q = `%${search.trim()}%`;
    where.push(
      or(
        ilike(orders.customerName, q),
        ilike(orders.phone, q),
        ilike(orders.reference, q),
      ),
    );
  }
  const filter = where.length ? and(...where) : undefined;

  const rows = await db
    .select({
      id: orders.id,
      reference: orders.reference,
      customerName: orders.customerName,
      phone: orders.phone,
      status: orders.status,
      totalDzd: orders.totalDzd,
      deliveryType: orders.deliveryType,
      createdAt: orders.createdAt,
      wilayaNameFr: wilayas.nameFr,
      wilayaNameAr: wilayas.nameAr,
      communeNameFr: communes.nameFr,
      communeNameAr: communes.nameAr,
      hasCustomerNote: sql<boolean>`${orders.customerNote} is not null`,
      itemCount: sql<number>`(
        select coalesce(sum(${orderItems.quantity}), 0)::int
        from ${orderItems} where ${orderItems.orderId} = ${orders.id}
      )`,
    })
    .from(orders)
    .innerJoin(wilayas, eq(wilayas.code, orders.wilayaCode))
    .innerJoin(communes, eq(communes.id, orders.communeId))
    .where(filter)
    .orderBy(resolved.orderBy)
    .limit(resolved.limit)
    .offset(resolved.offset);

  const [counted] = await db
    .select({ n: count() })
    .from(orders)
    .where(filter);

  return paged(rows, counted?.n ?? 0, resolved);
}
