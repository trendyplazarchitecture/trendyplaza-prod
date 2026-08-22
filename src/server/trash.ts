import "server-only";

import { and, eq, isNotNull, lt, sql } from "drizzle-orm";
import { db } from "@/db";
import type { Executor } from "@/db";
import {
  academicYears,
  contactMessages,
  lmsPackages,
  modules,
  orderItems,
  orders,
  packageContents,
  productColors,
  productImages,
  productOffers,
  products,
  productSpecs,
  promoCodeProducts,
  promoCodes,
  resources,
  semesters,
  testimonials,
  universities,
} from "@/db/schema";
import type { Permission } from "@/lib/permissions";
import { logActivity } from "./activity";

/**
 * The unified trash: one shared mechanism over every table that already
 * carries `archivedAt`, rather than a bespoke restore/purge pair written
 * per entity. See `NextPhase/12-trash-and-soft-delete-system/PLAN.md` and
 * `_AI_CONTEXT/04_DATA.md`'s Deletion policy footnote — this is the one
 * place in the codebase a real `DELETE` runs, and only ever on a row that
 * is already archived.
 *
 * `access_codes`, `access_requests` and `entitlements` are deliberately not
 * here: they are audit/compliance records with their own lifecycle
 * (`voided_at`), not "trash" — see the plan's audit table before adding one.
 */

export const TRASH_ENTITIES = [
  "order",
  "contact_message",
  "content_university",
  "content_year",
  "content_semester",
  "content_module",
  "content_resource",
  "product",
  "package",
  "testimonial",
  "promo_code",
] as const;

export type TrashEntity = (typeof TRASH_ENTITIES)[number];

const CONTENT_SCOPE: Partial<Record<TrashEntity, "university" | "year" | "semester" | "module">> = {
  content_university: "university",
  content_year: "year",
  content_semester: "semester",
  content_module: "module",
};

/** Table, permission, activity-log entity name and a title column, per trash entity. */
const REGISTRY = {
  order: {
    table: orders,
    permission: "orders.delete" as Permission,
    activityEntity: "order",
    title: (r: typeof orders.$inferSelect) => `${r.reference} — ${r.customerName}`,
  },
  contact_message: {
    table: contactMessages,
    permission: "messages.reply" as Permission,
    activityEntity: "contact_message",
    title: (r: typeof contactMessages.$inferSelect) => `${r.name}: ${r.subject ?? r.body.slice(0, 60)}`,
  },
  content_university: {
    table: universities,
    permission: "content.manage" as Permission,
    activityEntity: "university",
    title: (r: typeof universities.$inferSelect) => r.nameEn,
  },
  content_year: {
    table: academicYears,
    permission: "content.manage" as Permission,
    activityEntity: "year",
    title: (r: typeof academicYears.$inferSelect) => r.nameEn,
  },
  content_semester: {
    table: semesters,
    permission: "content.manage" as Permission,
    activityEntity: "semester",
    title: (r: typeof semesters.$inferSelect) => r.labelEn,
  },
  content_module: {
    table: modules,
    permission: "content.manage" as Permission,
    activityEntity: "module",
    title: (r: typeof modules.$inferSelect) => r.nameEn,
  },
  content_resource: {
    table: resources,
    permission: "content.manage" as Permission,
    activityEntity: "resource",
    title: (r: typeof resources.$inferSelect) => r.titleEn,
  },
  product: {
    table: products,
    permission: "products.manage" as Permission,
    activityEntity: "product",
    title: (r: typeof products.$inferSelect) => r.titleEn,
  },
  package: {
    table: lmsPackages,
    permission: "packages.manage" as Permission,
    activityEntity: "package",
    title: (r: typeof lmsPackages.$inferSelect) => r.titleEn,
  },
  testimonial: {
    table: testimonials,
    permission: "testimonials.manage" as Permission,
    activityEntity: "testimonial",
    title: () => "Screenshot",
  },
  promo_code: {
    table: promoCodes,
    permission: "promoCodes.manage" as Permission,
    activityEntity: "promo_code",
    title: (r: typeof promoCodes.$inferSelect) => r.code,
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- heterogeneous tables, narrowed by entity key at every call site below
} satisfies Record<TrashEntity, { table: any; permission: Permission; activityEntity: string; title: (row: any) => string }>;

const PURGE_AFTER_DAYS = 30;

/** The permission that gates every trash action on this entity — same one that already governs it live. */
export function entityPermission(entity: TrashEntity): Permission {
  return REGISTRY[entity].permission;
}

export type TrashRow = {
  entity: TrashEntity;
  id: string;
  title: string;
  archivedAt: Date;
  daysRemaining: number;
};

function daysRemaining(archivedAt: Date): number {
  const purgeAt = archivedAt.getTime() + PURGE_AFTER_DAYS * 24 * 60 * 60 * 1000;
  return Math.max(0, Math.ceil((purgeAt - Date.now()) / (24 * 60 * 60 * 1000)));
}

/** Every archived row across the entities the caller holds permission for. */
export async function listTrash(allowed: TrashEntity[]): Promise<TrashRow[]> {
  const out: TrashRow[] = [];

  for (const entity of allowed) {
    const spec = REGISTRY[entity];
    const table = spec.table as typeof orders;
    const rows = await db
      .select()
      .from(table)
      .where(isNotNull(table.archivedAt));

    for (const row of rows as (typeof orders.$inferSelect)[]) {
      const archivedAt = row.archivedAt as Date;
      out.push({
        entity,
        id: row.id,
        title: spec.title(row as never),
        archivedAt,
        daysRemaining: daysRemaining(archivedAt),
      });
    }
  }

  return out.sort((a, b) => a.archivedAt.getTime() - b.archivedAt.getTime());
}

export type RestoreResult = { ok: true } | { ok: false; message: string };

export async function restoreFromTrash(
  entity: TrashEntity,
  id: string,
  actorId: string,
): Promise<RestoreResult> {
  const spec = REGISTRY[entity];
  const table = spec.table as typeof orders;

  const [row] = await db
    .update(table)
    .set({ archivedAt: null })
    .where(and(eq(table.id, id), isNotNull(table.archivedAt)))
    .returning({ id: table.id });
  if (!row) return { ok: false, message: "That row is not in the trash." };

  await logActivity({
    actorId,
    action: `${spec.activityEntity}.restored`,
    entity: spec.activityEntity,
    entityId: id,
  });

  return { ok: true };
}

export type PurgeResult = { ok: true } | { ok: false; message: string };

/** A row still granting access through a package cannot be purged silently — see 04_DATA.md. */
async function blockedByPackageContents(entity: TrashEntity, id: string): Promise<boolean> {
  const scopeType = CONTENT_SCOPE[entity];
  if (!scopeType) return false;

  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(packageContents)
    .where(and(eq(packageContents.scopeType, scopeType), eq(packageContents.scopeId, id)));
  return (row?.n ?? 0) > 0;
}

/**
 * Named, not generic. `deleteChildren` clears every child row a product
 * doesn't need blocking it, but `order_items.productId` and a promo directly
 * scoped to this product are deliberately left standing — checked here first
 * so the admin sees which order or promo to deal with, instead of a bare
 * "something references this" that gives no next step.
 */
async function productPurgeBlocker(id: string): Promise<string | null> {
  const [orderRow] = await db
    .select({ reference: orders.reference })
    .from(orderItems)
    .innerJoin(orders, eq(orders.id, orderItems.orderId))
    .where(eq(orderItems.productId, id))
    .limit(1);
  if (orderRow) {
    return `Still ordered — order ${orderRow.reference} has this product on it. That order has to be dealt with first.`;
  }

  const [promoRow] = await db
    .select({ code: promoCodes.code })
    .from(promoCodes)
    .where(eq(promoCodes.productId, id))
    .limit(1);
  if (promoRow) {
    return `Promo code "${promoRow.code}" is scoped directly to this product. Remove that scope first.`;
  }

  return null;
}

/**
 * Child rows with no independent life of their own — deleted in the same
 * transaction as the parent, so the parent's own `RESTRICT` foreign key
 * never blocks a purge on rows that only exist to describe it.
 *
 * An order's line items describe the order, not anything else. A product's
 * images, specs, offers and colors describe the product the same way, plus
 * its rows in the `promo_code_products` join table (cleanup of a many-to-
 * many link, not a delete of the promo itself). `order_items.productId` and
 * a promo directly scoped to this product (`promo_codes.productId`) are
 * deliberately left alone — a product with real order history, or one a
 * promo still targets, should keep failing to purge until that's dealt
 * with, the same way an archived university with real years underneath it
 * is correctly refused by `package_contents`.
 */
async function deleteChildren(entity: TrashEntity, id: string, tx: Executor) {
  if (entity === "order") {
    // eslint-disable-next-line no-restricted-syntax -- child rows of the order being purged in the same transaction, see the doc comment above.
    await tx.delete(orderItems).where(eq(orderItems.orderId, id));
  }
  if (entity === "product") {
    // eslint-disable-next-line no-restricted-syntax -- child rows of the product being purged in the same transaction, see the doc comment above.
    await tx.delete(productImages).where(eq(productImages.productId, id));
    // eslint-disable-next-line no-restricted-syntax -- child rows of the product being purged in the same transaction, see the doc comment above.
    await tx.delete(productSpecs).where(eq(productSpecs.productId, id));
    // eslint-disable-next-line no-restricted-syntax -- child rows of the product being purged in the same transaction, see the doc comment above.
    await tx.delete(productOffers).where(eq(productOffers.productId, id));
    // eslint-disable-next-line no-restricted-syntax -- child rows of the product being purged in the same transaction, see the doc comment above.
    await tx.delete(productColors).where(eq(productColors.productId, id));
    // eslint-disable-next-line no-restricted-syntax -- join-table cleanup, not a delete of the promo code itself, see the doc comment above.
    await tx.delete(promoCodeProducts).where(eq(promoCodeProducts.productId, id));
  }
}

/**
 * The one real `DELETE` in this module. Only ever reaches a row whose
 * `archivedAt` is already set (the `isNotNull` guard below, mirroring
 * `purgeRosterMemberAction`, the one existing precedent for this shape).
 * Every other `RESTRICT` foreign key still backstops this at the database:
 * a caught `23503` becomes a friendly message instead of a raw constraint
 * error, exactly as strict as the schema already is for every table this
 * plan does not touch.
 */
export async function purgeFromTrash(
  entity: TrashEntity,
  id: string,
  actorId: string,
): Promise<PurgeResult> {
  const spec = REGISTRY[entity];
  const table = spec.table as typeof orders;

  const [row] = await db
    .select()
    .from(table)
    .where(and(eq(table.id, id), isNotNull(table.archivedAt)));
  if (!row) return { ok: false, message: "That row is not in the trash." };

  if (await blockedByPackageContents(entity, id)) {
    return {
      ok: false,
      message: "A package still grants access through this. Remove it from that package first.",
    };
  }

  if (entity === "product") {
    const blocker = await productPurgeBlocker(id);
    if (blocker) return { ok: false, message: blocker };
  }

  try {
    await db.transaction(async (tx) => {
      await deleteChildren(entity, id, tx);
      // eslint-disable-next-line no-restricted-syntax -- the guarded trash-purge path, see the doc comment above.
      await tx.delete(table).where(and(eq(table.id, id), isNotNull(table.archivedAt)));
    });
  } catch (error) {
    const cause =
      error instanceof Error ? (error.cause as { code?: string } | undefined) : undefined;
    if (cause?.code === "23503") {
      return {
        ok: false,
        message: "Something else still references this. It can't be deleted yet.",
      };
    }
    throw error;
  }

  await logActivity({
    actorId,
    action: `${spec.activityEntity}.purged`,
    entity: spec.activityEntity,
    entityId: id,
    before: { title: spec.title(row as never) },
  });

  return { ok: true };
}

/**
 * Lazy purge: called whenever `/admin/trash` loads, per the plan's option A
 * (no scheduler, no cron in the app container). "30 days" becomes "30 days,
 * or the next time anyone opens the trash after that" — see the plan for
 * why that's an acceptable trade for an admin screen checked regularly.
 *
 * Best-effort: a row a real `RESTRICT` (or `package_contents`) still guards
 * is quietly left in the trash rather than failing the whole sweep — it
 * purges on a later visit, once whatever references it is gone.
 */
export async function purgeExpiredTrash(actorId: string | null): Promise<number> {
  const cutoff = new Date(Date.now() - PURGE_AFTER_DAYS * 24 * 60 * 60 * 1000);
  let purged = 0;

  for (const entity of TRASH_ENTITIES) {
    const spec = REGISTRY[entity];
    const table = spec.table as typeof orders;

    const expired = await db
      .select({ id: table.id })
      .from(table)
      .where(and(isNotNull(table.archivedAt), lt(table.archivedAt, cutoff)));

    for (const { id } of expired) {
      if (await blockedByPackageContents(entity, id)) continue;
      try {
        const deleted = await db.transaction(async (tx) => {
          await deleteChildren(entity, id, tx);
          // eslint-disable-next-line no-restricted-syntax -- the guarded trash-purge path, see purgeFromTrash's doc comment above.
          return tx
            .delete(table)
            .where(and(eq(table.id, id), isNotNull(table.archivedAt)))
            .returning({ id: table.id });
        });
        if (deleted.length > 0) {
          purged += 1;
          await logActivity({
            actorId,
            action: `${spec.activityEntity}.purged`,
            entity: spec.activityEntity,
            entityId: id,
            before: { auto: true },
          });
        }
      } catch {
        // Still referenced somewhere real (RESTRICT) — leave it, try again
        // on the next visit to this screen.
      }
    }
  }

  return purged;
}
