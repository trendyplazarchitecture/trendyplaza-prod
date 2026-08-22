import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  uuid,
} from "drizzle-orm/pg-core";
import {
  accessRequestStatus,
  entitlementSource,
  entitlementStatus,
} from "./enums";
import { RESTRICT, createdAt, tsz } from "./_shared";
import { lmsPackages } from "./content";
import { orders } from "./catalogue";
import { users } from "./identity";

/**
 * A batch is printed. Quantity, duration and prefix are fixed when it is
 * created, the codes are exported to CSV, and the cards go to the printer.
 * None of this touches an order.
 */
export const codeBatches = pgTable("code_batches", {
  id: uuid().primaryKey().defaultRandom(),
  label: text().notNull(),
  packageId: uuid()
    .notNull()
    .references(() => lmsPackages.id, RESTRICT),
  prefix: text().notNull(),
  quantity: integer().notNull(),
  durationDays: integer(),
  /** Null means the batch never expires before redemption. */
  expiresAt: tsz("expires_at"),
  createdBy: text().references(() => users.id, RESTRICT),
  createdAt: createdAt(),
  exportedAt: tsz("exported_at"),
});

/**
 * `orderId` is nullable and usually null. Codes are pre-generated and printed
 * before any order exists. Generating one at order approval makes the primary
 * flow impossible. Any query joining codes to orders must handle the null.
 */
export const accessCodes = pgTable(
  "access_codes",
  {
    id: uuid().primaryKey().defaultRandom(),
    /** Stored uppercase, no separators. Input is normalised before matching. */
    code: text().notNull().unique(),
    batchId: uuid().references(() => codeBatches.id, RESTRICT),
    packageId: uuid()
      .notNull()
      .references(() => lmsPackages.id, RESTRICT),
    orderId: uuid().references(() => orders.id, RESTRICT),
    durationDays: integer(),
    isRedeemed: boolean().notNull().default(false),
    redeemedByUserId: text().references(() => users.id, RESTRICT),
    redeemedAt: tsz("redeemed_at"),
    voidedAt: tsz("voided_at"),
    voidReason: text(),
    createdAt: createdAt(),
  },
  (t) => [
    index("access_codes_batch_idx").on(t.batchId),
    index("access_codes_order_idx").on(t.orderId),
  ],
);

/** Path B. Signed up, no code, paid by Baridimob, waiting on an admin. */
export const accessRequests = pgTable(
  "access_requests",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: text()
      .notNull()
      .references(() => users.id, RESTRICT),
    packageId: uuid()
      .notNull()
      .references(() => lmsPackages.id, RESTRICT),
    /** Relative to STORAGE_ROOT, random filename. Kept until an admin purges. */
    receiptPath: text().notNull(),
    receiptMime: text(),
    amountClaimedDzd: integer(),
    status: accessRequestStatus().notNull().default("pending"),
    reviewedBy: text().references(() => users.id, RESTRICT),
    reviewedAt: tsz("reviewed_at"),
    rejectionReasonEn: text(),
    rejectionReasonFr: text(),
    rejectionReasonAr: text(),
    createdAt: createdAt(),
  },
  (t) => [index("access_requests_status_idx").on(t.status, t.createdAt)],
);

/**
 * Expiry is computed at read time against `expiresAt`. There is no cron job
 * flipping rows to `expired`, because a job that does not run on the one night
 * it matters hands out free access.
 */
export const entitlements = pgTable(
  "entitlements",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: text()
      .notNull()
      .references(() => users.id, RESTRICT),
    packageId: uuid()
      .notNull()
      .references(() => lmsPackages.id, RESTRICT),
    source: entitlementSource().notNull(),
    /** The code, request or admin user this grant came from. */
    sourceId: text(),
    grantedAt: createdAt(),
    /** Null means unlimited. */
    expiresAt: tsz("expires_at"),
    status: entitlementStatus().notNull().default("active"),
    note: text(),
  },
  (t) => [index("entitlements_user_status_idx").on(t.userId, t.status)],
);
