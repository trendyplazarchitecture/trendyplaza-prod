import {
  boolean,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import {
  deliveryType,
  fulfillmentStatus,
  offerKind,
  orderStatus,
  productType,
  promoKind,
  promoScopeType,
} from "./enums";
import { RESTRICT, archivedAt, createdAt, tsz, updatedAt } from "./_shared";
import { communes, wilayas } from "./geo";
import { lmsPackages } from "./content";
import { users } from "./identity";

/* --------------------------------------------------------------------------
 * All money is DZD centimes in `integer`. 900 DA is 90000. `numeric` returns
 * a string from the driver and `float` cannot hold a price.
 * ----------------------------------------------------------------------- */

/**
 * The rayons the shop is organised into. A fixed enum until this table: the
 * client asked to add and rename these without a developer, same reasoning
 * as `resourceTypes` on the LMS side.
 */
export const productCategories = pgTable("product_categories", {
  id: uuid().primaryKey().defaultRandom(),
  key: text().notNull().unique(),
  labelEn: text().notNull(),
  labelFr: text(),
  labelAr: text(),
  position: integer().notNull().default(0),
  archivedAt: archivedAt(),
});

export const products = pgTable(
  "products",
  {
    id: uuid().primaryKey().defaultRandom(),
    slug: text().notNull().unique(),
    titleEn: text().notNull(),
    titleFr: text(),
    titleAr: text(),
    descriptionEn: text(),
    descriptionFr: text(),
    descriptionAr: text(),
    priceDzd: integer().notNull(),
    compareAtDzd: integer(),
    categoryId: uuid()
      .notNull()
      .references(() => productCategories.id, RESTRICT),
    type: productType().notNull().default("physical"),
    stockCount: integer().notNull().default(0),
    /** A printed gift card sits in the box. This is how a sale becomes access. */
    containsAccessCode: boolean().notNull().default(false),
    accessPackageId: uuid().references(() => lmsPackages.id, RESTRICT),
    /**
     * Chosen for the landing page. Distinct from `is_visible`, which is
     * whether the shop lists it at all, and from `position`, which orders the
     * catalogue. The home page used to show the first six by position, which
     * meant the client could only feature something by reordering the whole
     * shop.
     */
    isFeatured: boolean().notNull().default(false),
    /** The client's own reference, printed on a picking slip. Not a key. */
    sku: text(),
    isVisible: boolean().notNull().default(true),
    position: integer().notNull().default(0),
    archivedAt: archivedAt(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("products_visible_idx").on(t.isVisible, t.position),
    index("products_category_idx").on(t.categoryId, t.position),
  ],
);

export const productImages = pgTable(
  "product_images",
  {
    id: uuid().primaryKey().defaultRandom(),
    productId: uuid()
      .notNull()
      .references(() => products.id, RESTRICT),
    path: text().notNull(),
    position: integer().notNull().default(0),
    altEn: text(),
    altFr: text(),
    altAr: text(),
  },
  (t) => [index("product_images_product_idx").on(t.productId, t.position)],
);

/**
 * The spec table on a product page: material, size, weight, what is in the box.
 *
 * A table rather than jsonb, because the client edits these by hand in the
 * admin. jsonb means no per-row validation, no ordering without rewriting the
 * whole blob, and no way to translate one row without touching the others.
 */
export const productSpecs = pgTable(
  "product_specs",
  {
    id: uuid().primaryKey().defaultRandom(),
    productId: uuid()
      .notNull()
      .references(() => products.id, RESTRICT),
    labelEn: text().notNull(),
    labelFr: text(),
    labelAr: text(),
    valueEn: text().notNull(),
    valueFr: text(),
    valueAr: text(),
    position: integer().notNull().default(0),
    archivedAt: archivedAt(),
  },
  (t) => [index("product_specs_product_idx").on(t.productId, t.position)],
);

/**
 * Quantity offers: buy two, buy three, buy the class set.
 *
 * `minQuantity` is a threshold, not an exact count. Three tiers at 2, 3 and 5
 * mean someone buying four gets the 3+ tier, which is what a customer expects
 * and what a shopkeeper would do. Resolution picks the single best applicable
 * tier and is a pure function in `src/lib/offers.ts`, so the checkout, the
 * cart and the product page cannot disagree about the price.
 */
export const productOffers = pgTable(
  "product_offers",
  {
    id: uuid().primaryKey().defaultRandom(),
    productId: uuid()
      .notNull()
      .references(() => products.id, RESTRICT),
    /** Applies at this quantity and above. Always 2 or more. */
    minQuantity: integer().notNull(),
    kind: offerKind().notNull(),
    /** Percent as whole points (10 = 10%), unit price as DZD centimes. */
    value: integer().notNull(),
    labelEn: text(),
    labelFr: text(),
    labelAr: text(),
    isActive: boolean().notNull().default(true),
    position: integer().notNull().default(0),
    archivedAt: archivedAt(),
    createdAt: createdAt(),
  },
  (t) => [
    index("product_offers_product_idx").on(t.productId, t.minQuantity),
    unique("product_offers_product_qty_key").on(t.productId, t.minQuantity),
  ],
);

/**
 * Per-product color options. Colors only, not a general variant-axis system —
 * the client asked for colors specifically, and a second axis (size, say)
 * would be a similar sibling table rather than a rework of this one.
 *
 * `hex` is nullable: a swatch is a UI nicety, not every "color" is a literal
 * one ("Natural wood"), and the label is what a buyer actually reads.
 */
export const productColors = pgTable(
  "product_colors",
  {
    id: uuid().primaryKey().defaultRandom(),
    productId: uuid()
      .notNull()
      .references(() => products.id, RESTRICT),
    nameEn: text().notNull(),
    nameFr: text(),
    nameAr: text(),
    hex: text(),
    stockCount: integer().notNull().default(0),
    isVisible: boolean().notNull().default(true),
    position: integer().notNull().default(0),
    archivedAt: archivedAt(),
    createdAt: createdAt(),
  },
  (t) => [
    index("product_colors_product_idx").on(t.productId, t.position),
    unique("product_colors_product_name_key").on(t.productId, t.nameEn),
  ],
);

export const promoCodes = pgTable("promo_codes", {
  id: uuid().primaryKey().defaultRandom(),
  code: text().notNull().unique(),
  kind: promoKind().notNull(),
  /** Percent as whole points (10 = 10%), amount as DZD centimes. */
  value: integer().notNull(),
  /** What the discount applies to. Drives which of the fields below is read. */
  scopeType: promoScopeType().notNull().default("cart"),
  categoryId: uuid().references(() => productCategories.id, RESTRICT),
  /** Null unless `scopeType = 'product'`. The multi-product case uses `promo_code_products` instead. */
  productId: uuid().references(() => products.id, RESTRICT),
  startsAt: tsz("starts_at"),
  endsAt: tsz("ends_at"),
  maxUses: integer(),
  usedCount: integer().notNull().default(0),
  isActive: boolean().notNull().default(true),
  archivedAt: archivedAt(),
  createdAt: createdAt(),
});

/** `scopeType = 'products'` (plural): the set of products one promo discounts. */
export const promoCodeProducts = pgTable(
  "promo_code_products",
  {
    promoCodeId: uuid()
      .notNull()
      .references(() => promoCodes.id, RESTRICT),
    productId: uuid()
      .notNull()
      .references(() => products.id, RESTRICT),
  },
  (t) => [primaryKey({ columns: [t.promoCodeId, t.productId] })],
);

/**
 * Cash on delivery. There is deliberately no payment status column: the money
 * arrives when the courier hands over the box.
 */
export const orders = pgTable(
  "orders",
  {
    id: uuid().primaryKey().defaultRandom(),
    /** Human-readable, quoted on the phone. Unique. */
    reference: text().notNull().unique(),
    customerName: text().notNull(),
    /** Stored canonical as 0XXXXXXXXX after normalisation. */
    phone: text().notNull(),
    email: text(),
    wilayaCode: integer()
      .notNull()
      .references(() => wilayas.code, RESTRICT),
    communeId: integer()
      .notNull()
      .references(() => communes.id, RESTRICT),
    deliveryType: deliveryType().notNull(),
    address: text(),
    /** Free text from the customer at checkout. Not staff-authored — see internalNote. */
    customerNote: text(),
    subtotalDzd: integer().notNull(),
    shippingDzd: integer().notNull(),
    discountDzd: integer().notNull().default(0),
    totalDzd: integer().notNull(),
    promoCodeId: uuid().references(() => promoCodes.id, RESTRICT),
    status: orderStatus().notNull().default("pending"),
    confirmedAt: tsz("confirmed_at"),
    cancelReasonEn: text(),
    cancelReasonFr: text(),
    cancelReasonAr: text(),
    internalNote: text(),
    /** Set when an admin takes the order by phone or DM. */
    createdByAdminId: text().references(() => users.id, RESTRICT),
    /**
     * Trash, not deletion — the 30-day-purge system, `src/server/trash.ts`.
     * A trashed order drops out of `listOrders`, `getSheetFigures` and
     * `getOrderTrend` immediately; the sale itself is never rewritten by
     * this column, only whether the record currently shows up anywhere.
     */
    archivedAt: archivedAt(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("orders_status_created_idx").on(t.status, t.createdAt),
    index("orders_phone_idx").on(t.phone),
    index("orders_archived_idx").on(t.archivedAt),
  ],
);

export const orderItems = pgTable(
  "order_items",
  {
    id: uuid().primaryKey().defaultRandom(),
    orderId: uuid()
      .notNull()
      .references(() => orders.id, RESTRICT),
    productId: uuid()
      .notNull()
      .references(() => products.id, RESTRICT),
    /** Null for a colorless product. Frozen alongside the name — see below. */
    productColorId: uuid().references(() => productColors.id, RESTRICT),
    quantity: integer().notNull(),
    /**
     * Frozen at placement. Rendering a past order never reads
     * `products.price_dzd`, or last month's receipts change when the client
     * edits a price.
     */
    priceAtPurchaseDzd: integer().notNull(),
    /**
     * The undiscounted unit price, when a quantity offer moved it. Null means
     * no offer applied and `price_at_purchase` was the list price.
     *
     * Kept so a receipt can say "3 × 2500, offer applied, 1800 each" rather
     * than quietly showing a price the customer never saw advertised.
     */
    listPriceDzd: integer(),
    titleAtPurchaseEn: text().notNull(),
    titleAtPurchaseFr: text(),
    titleAtPurchaseAr: text(),
    /** Frozen the same way the title is, so a later-archived color still reads correctly. */
    colorNameAtPurchaseEn: text(),
    fulfillmentStatus: fulfillmentStatus().notNull().default("pending"),
  },
  (t) => [index("order_items_order_idx").on(t.orderId)],
);
