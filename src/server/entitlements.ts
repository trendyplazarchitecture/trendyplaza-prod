import "server-only";

import { cache } from "react";
import { and, desc, eq, inArray, isNull, or, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  academicYears,
  entitlements,
  lmsPackages,
  modules,
  packageContents,
  resources,
  semesters,
} from "@/db/schema";
import type { Locale } from "@/lib/i18n-content";
import { pick } from "@/lib/i18n-content";
import { logActivity } from "./activity";

/**
 * Expiry is computed here, at read time, against `expires_at`. There is no
 * cron job flipping rows to `expired`, because the one night a job fails to
 * run is the night everyone reads for free.
 */
function activeClause(userId: string) {
  return and(
    eq(entitlements.userId, userId),
    eq(entitlements.status, "active"),
    or(isNull(entitlements.expiresAt), sql`${entitlements.expiresAt} > now()`),
  );
}

export const getActiveEntitlements = cache(async (userId: string) => {
  return db.select().from(entitlements).where(activeClause(userId));
});

export const hasAnyAccess = cache(async (userId: string): Promise<boolean> => {
  const rows = await getActiveEntitlements(userId);
  return rows.length > 0;
});

/**
 * The set of modules a user can read, resolved down the scope tree.
 *
 * A package grants scopes at four levels. A grant on a university reaches
 * every module beneath it; a grant on a module reaches only that one. The
 * negative case is the one that matters: an L2 grant must not reach an L3
 * module, and that is tested explicitly.
 */
export const getEntitledModuleIds = cache(
  async (userId: string): Promise<Set<string>> => {
    const active = await getActiveEntitlements(userId);
    if (active.length === 0) return new Set();

    const scopes = await db
      .select()
      .from(packageContents)
      .where(
        inArray(
          packageContents.packageId,
          active.map((e) => e.packageId),
        ),
      );
    if (scopes.length === 0) return new Set();

    const byType = (type: (typeof scopes)[number]["scopeType"]) =>
      scopes.filter((s) => s.scopeType === type).map((s) => s.scopeId);

    const universityIds = byType("university");
    const yearIds = byType("year");
    const semesterIds = byType("semester");
    const moduleIds = byType("module");

    const conditions = [];
    if (universityIds.length)
      conditions.push(inArray(academicYears.universityId, universityIds));
    if (yearIds.length) conditions.push(inArray(academicYears.id, yearIds));
    if (semesterIds.length) conditions.push(inArray(semesters.id, semesterIds));
    if (moduleIds.length) conditions.push(inArray(modules.id, moduleIds));
    if (conditions.length === 0) return new Set();

    const rows = await db
      .select({ id: modules.id })
      .from(modules)
      .innerJoin(semesters, eq(semesters.id, modules.semesterId))
      .innerJoin(academicYears, eq(academicYears.id, semesters.academicYearId))
      .where(
        and(
          or(...conditions),
          // An archived branch anywhere on the chain removes the module from
          // reach without deleting anything.
          isNull(modules.archivedAt),
          isNull(semesters.archivedAt),
          isNull(academicYears.archivedAt),
        ),
      );

    return new Set(rows.map((r) => r.id));
  },
);

export async function canReadModule(userId: string, moduleId: string) {
  return (await getEntitledModuleIds(userId)).has(moduleId);
}

/**
 * What the student sees on their own account screen: every entitlement they
 * hold, live or not, with the package it opens.
 *
 * Paused, expired and revoked rows are included on purpose. A student whose
 * access stopped needs to see that it stopped and when, rather than an empty
 * page that looks like the account was lost.
 */
export const listMyEntitlements = cache(
  async (userId: string, locale: Locale) => {
    const rows = await db
      .select({
        id: entitlements.id,
        status: entitlements.status,
        grantedAt: entitlements.grantedAt,
        expiresAt: entitlements.expiresAt,
        source: entitlements.source,
        packageId: lmsPackages.id,
        titleEn: lmsPackages.titleEn,
        titleFr: lmsPackages.titleFr,
        titleAr: lmsPackages.titleAr,
      })
      .from(entitlements)
      .innerJoin(lmsPackages, eq(lmsPackages.id, entitlements.packageId))
      .where(eq(entitlements.userId, userId))
      .orderBy(desc(entitlements.grantedAt));

    return rows.map((row) => ({
      id: row.id,
      packageId: row.packageId,
      title: pick(locale, { en: row.titleEn, ar: row.titleAr, fr: row.titleFr }),
      source: row.source,
      grantedAt: row.grantedAt,
      expiresAt: row.expiresAt,
      // Expiry is a comparison, not a stored state, for the same reason the
      // query above computes it: a cron job that fails to run must not be the
      // thing standing between a student and content they paid for.
      status:
        row.status === "active" &&
        row.expiresAt !== null &&
        row.expiresAt.getTime() <= Date.now()
          ? ("expired" as const)
          : row.status,
    }));
  },
);

/**
 * The check the streaming route makes before a single byte moves. Returns the
 * resource only when the user is entitled to the module holding it.
 */
export async function getReadableResource(userId: string, resourceId: string) {
  const resolved = await resolveResourceAccess(userId, resourceId);
  return resolved.status === "ok" ? resolved.resource : null;
}

export type ResourceAccess =
  | { status: "ok"; resource: typeof resources.$inferSelect }
  | { status: "not_found" }
  | { status: "forbidden" };

/**
 * The same check, but it distinguishes "there is no such resource" from "there
 * is, and you cannot read it", because the streaming route answers them with
 * different status codes: 404 and 403.
 *
 * Telling an authenticated student that a resource exists but is outside their
 * package is the honest answer and the one that sells them the next pack. The
 * id is a v4 UUID, so knowing one exists is not knowing where to find it.
 */
export async function resolveResourceAccess(
  userId: string,
  resourceId: string,
): Promise<ResourceAccess> {
  const [row] = await db
    .select()
    .from(resources)
    .where(and(eq(resources.id, resourceId), isNull(resources.archivedAt)))
    .limit(1);

  // An archived or hidden resource is gone as far as a student is concerned.
  // Soft delete keeps the row so an entitlement never dangles; it does not
  // keep the resource readable.
  if (!row || !row.isVisible) return { status: "not_found" };
  if (!(await canReadModule(userId, row.moduleId))) return { status: "forbidden" };
  return { status: "ok", resource: row };
}

export async function grantEntitlement(
  input: {
    userId: string;
    packageId: string;
    source: "code" | "request" | "admin";
    sourceId?: string | null;
    durationDays?: number | null;
    note?: string;
  },
  actorId: string,
) {
  const expiresAt = input.durationDays
    ? new Date(Date.now() + input.durationDays * 24 * 60 * 60 * 1000)
    : null;

  const [row] = await db
    .insert(entitlements)
    .values({
      userId: input.userId,
      packageId: input.packageId,
      source: input.source,
      sourceId: input.sourceId ?? null,
      expiresAt,
      note: input.note,
      status: "active",
    })
    .returning();

  await logActivity({
    actorId,
    action: "entitlements.granted",
    entity: "entitlement",
    entityId: row.id,
    after: { userId: input.userId, packageId: input.packageId, expiresAt },
  });

  return row;
}

/**
 * Pause and revoke take effect on the next page load, because every LMS page
 * re-checks rather than trusting a session claim. Revocation is the only real
 * answer to a shared account; there is no DRM here and we do not pretend
 * otherwise.
 */
export async function setEntitlementStatus(
  entitlementId: string,
  status: "active" | "paused" | "revoked",
  actorId: string,
) {
  const [row] = await db
    .update(entitlements)
    .set({ status })
    .where(eq(entitlements.id, entitlementId))
    .returning();

  await logActivity({
    actorId,
    action: `entitlements.${status}`,
    entity: "entitlement",
    entityId: entitlementId,
    after: { status },
  });

  return row;
}

/** Extends from the later of now and the current expiry, so a pause is not a penalty. */
export async function extendEntitlement(
  entitlementId: string,
  days: number,
  actorId: string,
) {
  const [row] = await db
    .update(entitlements)
    .set({
      expiresAt: sql`greatest(coalesce(${entitlements.expiresAt}, now()), now()) + make_interval(days => ${days})`,
    })
    .where(eq(entitlements.id, entitlementId))
    .returning();

  await logActivity({
    actorId,
    action: "entitlements.extended",
    entity: "entitlement",
    entityId: entitlementId,
    after: { days, expiresAt: row?.expiresAt },
  });

  return row;
}
