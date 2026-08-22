import { pgEnum } from "drizzle-orm/pg-core";

/** Physical goods ship. LMS access is redeemed. They never share a checkout. */
export const productType = pgEnum("product_type", ["physical", "lms_access"]);

export const deliveryType = pgEnum("delivery_type", ["home", "desk"]);

/**
 * `confirmed` is the phone call. The client confirms every order by phone
 * before it moves, and stock decrements at that step, not at placement.
 */
export const orderStatus = pgEnum("order_status", [
  "pending",
  "confirmed",
  "packed",
  "shipped",
  "delivered",
  "cancelled",
  "returned",
]);

/** Mirrors order status per line, because an order can be partly shipped. */
export const fulfillmentStatus = pgEnum("fulfillment_status", [
  "pending",
  "confirmed",
  "packed",
  "shipped",
  "delivered",
  "cancelled",
  "returned",
]);

export const promoKind = pgEnum("promo_kind", ["percent", "amount"]);

/**
 * What a promo code discounts. `product` (singular, the existing
 * `promo_codes.product_id` column) and `products` (plural, the
 * `promo_code_products` join table) are deliberately separate: a
 * single-product promo is the common case and keeps using the plain column,
 * so the existing resolution logic for it needs no join at all.
 */
export const promoScopeType = pgEnum("promo_scope_type", [
  "cart",
  "category",
  "product",
  "products",
]);

/**
 * A quantity offer on one product: buy two, buy three, buy the class set.
 *
 * Two kinds, because these are the two a shopkeeper actually says out loud.
 * `percent` is "10% off each from three". `unit_price` is "1800 DA each from
 * three", which is how packs are quoted here and which does not drift when the
 * base price changes. A third kind, a fixed total for a bundle, was left out
 * deliberately: it stops being a per-unit price and every downstream
 * calculation, including the frozen `price_at_purchase`, has to grow a special
 * case for it.
 */
export const offerKind = pgEnum("offer_kind", ["percent", "unit_price"]);

export const academicLevel = pgEnum("academic_level", [
  "L1",
  "L2",
  "L3",
  "M1",
  "M2",
]);

export const resourceSource = pgEnum("resource_source", [
  "file",
  "youtube",
  "drive",
  "link",
]);

/** A package grants scopes. Access resolves down the tree from each one. */
export const scopeType = pgEnum("scope_type", [
  "university",
  "year",
  "semester",
  "module",
]);

export const entitlementSource = pgEnum("entitlement_source", [
  "code",
  "request",
  "admin",
]);

export const entitlementStatus = pgEnum("entitlement_status", [
  "active",
  "paused",
  "expired",
  "revoked",
]);

export const accessRequestStatus = pgEnum("access_request_status", [
  "pending",
  "approved",
  "rejected",
]);

/** `on_hold` is a signed-up student with no entitlement yet. Path B. */
export const userState = pgEnum("user_state", [
  "on_hold",
  "active",
  "suspended",
]);

export const postKind = pgEnum("post_kind", ["announcement", "event", "news"]);

export const announcementAudience = pgEnum("announcement_audience", [
  "all",
  "students",
  "on_hold",
]);

/** Alias matching domain naming */
export const postAudience = announcementAudience;

export const contactStatus = pgEnum("contact_status", [
  "new",
  "read",
  "answered",
]);

export const staffAccessRequestStatus = pgEnum("staff_access_request_status", [
  "pending",
  "approved",
  "denied",
]);
