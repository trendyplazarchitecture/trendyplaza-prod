import "server-only";

import { cache } from "react";
import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  academicYears,
  moduleProgress,
  modules,
  resourceViews,
  resources,
  semesters,
  universities,
} from "@/db/schema";
import type { Locale } from "@/lib/i18n-content";
import { pick } from "@/lib/i18n-content";
import { getEntitledModuleIds } from "./entitlements";

/**
 * Reading progress. Decision D1, reversed on the record.
 *
 * The write is one statement on the read path of every resource, so it has to
 * be cheap and it has to be unable to break a read. The reads are for the
 * student's dashboard, and every one of them is filtered by what the student
 * is still entitled to: a module that was in last year's pack must not sit on
 * the dashboard offering a link that 403s.
 */

/**
 * Records one open.
 *
 * Never awaited by the streaming route. If this throws, the student loses a
 * view and keeps their file, which is the right way round. The caller catches;
 * this function does not swallow, so a failure is still visible in the log.
 */
export async function recordView(userId: string, resourceId: string, moduleId: string) {
  await db.transaction(async (tx) => {
    await tx.insert(resourceViews).values({ userId, resourceId });

    /*
     * "Complete" is recomputed rather than incremented: every visible resource
     * in the module has at least one view from this user. Counting up would
     * mean a module that gains a resource stays wrongly complete, and the
     * client adds resources to live modules constantly.
     */
    const completed = sql<Date | null>`
      case when not exists (
        select 1 from ${resources} r
         where r.module_id = ${moduleId}
           and r.is_visible = true
           and r.archived_at is null
           and not exists (
             select 1 from ${resourceViews} v
              where v.resource_id = r.id and v.user_id = ${userId}
           )
      ) then now() else null end
    `;

    await tx
      .insert(moduleProgress)
      .values({
        userId,
        moduleId,
        viewedCount: 1,
        lastResourceId: resourceId,
        completedAt: completed,
      })
      .onConflictDoUpdate({
        target: [moduleProgress.userId, moduleProgress.moduleId],
        set: {
          viewedCount: sql`${moduleProgress.viewedCount} + 1`,
          lastViewedAt: sql`now()`,
          lastResourceId: resourceId,
          // Recomputed on every view, so it can go back to null.
          completedAt: completed,
        },
      });
  });
}

export type ProgressModule = {
  moduleId: string;
  moduleName: string;
  universitySlug: string;
  universityName: string;
  level: string;
  total: number;
  seen: number;
  lastViewedAt: Date;
  completedAt: Date | null;
  lastResourceId: string | null;
};

/**
 * Every module this student has opened and can still open, newest first.
 *
 * The entitlement filter is the point: progress outlives an entitlement, and
 * the dashboard must not offer a way back into content the student no longer
 * holds. `getEntitledModuleIds` is the same function the streaming route uses,
 * so the two cannot disagree.
 */
export const listMyProgress = cache(
  async (userId: string, locale: Locale): Promise<ProgressModule[]> => {
    const entitled = await getEntitledModuleIds(userId);
    if (entitled.size === 0) return [];

    const rows = await db
      .select({
        moduleId: moduleProgress.moduleId,
        lastViewedAt: moduleProgress.lastViewedAt,
        completedAt: moduleProgress.completedAt,
        lastResourceId: moduleProgress.lastResourceId,
        nameEn: modules.nameEn,
        nameFr: modules.nameFr,
        nameAr: modules.nameAr,
        yearNameEn: academicYears.nameEn,
        yearNameFr: academicYears.nameFr,
        yearNameAr: academicYears.nameAr,
        universitySlug: universities.slug,
        uniEn: universities.nameEn,
        uniFr: universities.nameFr,
        uniAr: universities.nameAr,
        total: sql<number>`(
          select count(*)::int from ${resources} r
           where r.module_id = ${moduleProgress.moduleId}
             and r.is_visible = true and r.archived_at is null
        )`,
        seen: sql<number>`(
          select count(distinct v.resource_id)::int
            from ${resourceViews} v
            join ${resources} r on r.id = v.resource_id
           where v.user_id = ${userId}
             and r.module_id = ${moduleProgress.moduleId}
             and r.is_visible = true and r.archived_at is null
        )`,
      })
      .from(moduleProgress)
      .innerJoin(modules, eq(modules.id, moduleProgress.moduleId))
      .innerJoin(semesters, eq(semesters.id, modules.semesterId))
      .innerJoin(academicYears, eq(academicYears.id, semesters.academicYearId))
      .innerJoin(universities, eq(universities.id, academicYears.universityId))
      .where(
        and(
          eq(moduleProgress.userId, userId),
          isNull(modules.archivedAt),
          isNull(semesters.archivedAt),
          isNull(academicYears.archivedAt),
        ),
      )
      .orderBy(desc(moduleProgress.lastViewedAt));

    return rows
      .filter((r) => entitled.has(r.moduleId))
      .map((r) => ({
        moduleId: r.moduleId,
        moduleName: pick(locale, { en: r.nameEn, ar: r.nameAr, fr: r.nameFr }),
        universitySlug: r.universitySlug,
        universityName: pick(locale, { en: r.uniEn, ar: r.uniAr, fr: r.uniFr }),
        level: pick(locale, { en: r.yearNameEn, ar: r.yearNameAr, fr: r.yearNameFr }),
        total: r.total,
        seen: r.seen,
        lastViewedAt: r.lastViewedAt,
        completedAt: r.completedAt,
        lastResourceId: r.lastResourceId,
      }));
  },
);

export type CarryOn = {
  resourceId: string;
  resourceTitle: string;
  moduleId: string;
  moduleName: string;
  universitySlug: string;
  viewedAt: Date;
};

/**
 * The single most recent resource, for the one control the dashboard leads
 * with. A student comes back to carry on, not to read a report.
 */
export const getCarryOn = cache(
  async (userId: string, locale: Locale): Promise<CarryOn | null> => {
    const entitled = await getEntitledModuleIds(userId);
    if (entitled.size === 0) return null;

    const rows = await db
      .select({
        resourceId: resources.id,
        titleEn: resources.titleEn,
        titleFr: resources.titleFr,
        titleAr: resources.titleAr,
        moduleId: modules.id,
        nameEn: modules.nameEn,
        nameFr: modules.nameFr,
        nameAr: modules.nameAr,
        universitySlug: universities.slug,
        viewedAt: resourceViews.viewedAt,
      })
      .from(resourceViews)
      .innerJoin(resources, eq(resources.id, resourceViews.resourceId))
      .innerJoin(modules, eq(modules.id, resources.moduleId))
      .innerJoin(semesters, eq(semesters.id, modules.semesterId))
      .innerJoin(academicYears, eq(academicYears.id, semesters.academicYearId))
      .innerJoin(universities, eq(universities.id, academicYears.universityId))
      .where(
        and(
          eq(resourceViews.userId, userId),
          eq(resources.isVisible, true),
          isNull(resources.archivedAt),
          isNull(modules.archivedAt),
        ),
      )
      .orderBy(desc(resourceViews.viewedAt))
      // Several, because the most recent may be in a module the student no
      // longer holds and the filter below cannot run in SQL.
      .limit(20);

    const row = rows.find((r) => entitled.has(r.moduleId));
    if (!row) return null;

    return {
      resourceId: row.resourceId,
      resourceTitle: pick(locale, { en: row.titleEn, ar: row.titleAr, fr: row.titleFr }),
      moduleId: row.moduleId,
      moduleName: pick(locale, { en: row.nameEn, ar: row.nameAr, fr: row.nameFr }),
      universitySlug: row.universitySlug,
      viewedAt: row.viewedAt,
    };
  },
);

/**
 * What the admin wants and the student does not: which modules are being read.
 *
 * It tells the client where to invest next. On a student's own dashboard it
 * only tells them what they already know, which is why it lives here and is
 * rendered on the admin overview.
 */
export async function getMostViewedModules(limit = 5) {
  return db
    .select({
      moduleId: modules.id,
      titleEn: modules.nameEn,
      titleFr: modules.nameFr,
      views: sql<number>`count(*)::int`,
      readers: sql<number>`count(distinct ${resourceViews.userId})::int`,
    })
    .from(resourceViews)
    .innerJoin(resources, eq(resources.id, resourceViews.resourceId))
    .innerJoin(modules, eq(modules.id, resources.moduleId))
    .where(isNull(modules.archivedAt))
    .groupBy(modules.id, modules.nameEn, modules.nameFr)
    .orderBy(desc(sql`count(*)`))
    .limit(limit);
}
