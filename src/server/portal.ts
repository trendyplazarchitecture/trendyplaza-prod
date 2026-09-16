import "server-only";

import { cache } from "react";
import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  academicYears,
  moduleProgress,
  modules,
  resourceTypes,
  resourceViews,
  resources,
  semesters,
  universities,
} from "@/db/schema";
import type { Locale } from "@/lib/i18n-content";
import { pick } from "@/lib/i18n-content";
import { getEntitledModuleIds } from "./entitlements";

/**
 * The reads behind the student dashboard.
 *
 * `progress.ts` answers "where did I get to". This file answers the questions
 * the dashboard chrome asks around that: how much is there, what did I open
 * last, what can I search. Every one of them is filtered by live entitlement
 * through `getEntitledModuleIds`, the same function the streaming route uses,
 * so the dashboard cannot offer a link that the route will answer 403 to.
 *
 * Nothing here invents a figure. There is no study timer in this product and
 * no graded work, so there is no "hours studied" and no "average score" — a
 * dashboard that reports a number nobody measured is worse than one that
 * reports four honest ones.
 */

export type DashboardFigures = {
  /** Modules opened and not yet finished. */
  open: number;
  /** Modules where every visible resource has been opened at least once. */
  finished: number;
  /** Distinct resources this student has opened, across everything they hold. */
  resourcesRead: number;
  /** Resources inside what they hold, read or not. The denominator. */
  resourcesAvailable: number;
  /** Schools with at least one reachable module. */
  schools: number;
};

export const getDashboardFigures = cache(
  async (userId: string): Promise<DashboardFigures> => {
    const entitled = await getEntitledModuleIds(userId);
    if (entitled.size === 0) {
      return { open: 0, finished: 0, resourcesRead: 0, resourcesAvailable: 0, schools: 0 };
    }

    const ids = [...entitled];

    const [progressRows, resourceRows] = await Promise.all([
      db
        .select({
          moduleId: moduleProgress.moduleId,
          completedAt: moduleProgress.completedAt,
        })
        .from(moduleProgress)
        .where(eq(moduleProgress.userId, userId)),

      db
        .select({
          resourceId: resources.id,
          moduleId: resources.moduleId,
          universityId: universities.id,
          // A left join, so a resource nobody has opened still counts towards
          // the denominator.
          seen: sql<number>`(
            select count(*)::int from ${resourceViews} v
             where v.resource_id = ${resources.id} and v.user_id = ${userId}
          )`,
        })
        .from(resources)
        .innerJoin(modules, eq(modules.id, resources.moduleId))
        .innerJoin(semesters, eq(semesters.id, modules.semesterId))
        .innerJoin(academicYears, eq(academicYears.id, semesters.academicYearId))
        .innerJoin(universities, eq(universities.id, academicYears.universityId))
        .where(
          and(
            eq(resources.isVisible, true),
            isNull(resources.archivedAt),
            isNull(modules.archivedAt),
            isNull(semesters.archivedAt),
            isNull(academicYears.archivedAt),
          ),
        ),
    ]);

    // The entitlement filter is applied in JS rather than as an `inArray`,
    // because a student holding a whole university can hold hundreds of module
    // ids and a query with hundreds of bound parameters plans badly.
    const mine = resourceRows.filter((r) => entitled.has(r.moduleId));
    const schools = new Set(mine.map((r) => r.universityId));

    const touched = progressRows.filter((p) => entitled.has(p.moduleId));

    return {
      open: touched.filter((p) => !p.completedAt).length,
      finished: touched.filter((p) => p.completedAt).length,
      resourcesRead: mine.filter((r) => r.seen > 0).length,
      resourcesAvailable: mine.length,
      schools: schools.size,
    };
  },
);

export type RecentResource = {
  id: string;
  title: string;
  typeLabel: string;
  moduleId: string;
  moduleName: string;
  universitySlug: string;
  sizeBytes: number | null;
  viewedAt: Date;
};

/**
 * The last handful of files this student opened, one row per resource.
 *
 * Distinct on the resource, because a PDF read over three evenings is one
 * thing in a student's head and three rows in `resource_views`.
 */
export const listRecentResources = cache(
  async (userId: string, locale: Locale, limit = 6): Promise<RecentResource[]> => {
    const entitled = await getEntitledModuleIds(userId);
    if (entitled.size === 0) return [];

    const rows = await db
      .select({
        id: resources.id,
        titleEn: resources.titleEn,
        titleFr: resources.titleFr,
        titleAr: resources.titleAr,
        sizeBytes: resources.sizeBytes,
        typeEn: resourceTypes.labelEn,
        typeFr: resourceTypes.labelFr,
        typeAr: resourceTypes.labelAr,
        moduleId: modules.id,
        nameEn: modules.nameEn,
        nameFr: modules.nameFr,
        nameAr: modules.nameAr,
        universitySlug: universities.slug,
        viewedAt: sql<Date>`max(${resourceViews.viewedAt})`,
      })
      .from(resourceViews)
      .innerJoin(resources, eq(resources.id, resourceViews.resourceId))
      .innerJoin(resourceTypes, eq(resourceTypes.id, resources.resourceTypeId))
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
      .groupBy(
        resources.id,
        resourceTypes.labelEn,
        resourceTypes.labelFr,
        resourceTypes.labelAr,
        modules.id,
        universities.slug,
      )
      .orderBy(desc(sql`max(${resourceViews.viewedAt})`))
      // Over-fetched, because the entitlement filter below cannot run in SQL
      // and the most recent reads may sit in a module the student has lost.
      .limit(limit * 4);

    return rows
      .filter((r) => entitled.has(r.moduleId))
      .slice(0, limit)
      .map((r) => ({
        id: r.id,
        title: pick(locale, { en: r.titleEn, ar: r.titleAr, fr: r.titleFr }),
        typeLabel: pick(locale, { en: r.typeEn, ar: r.typeAr, fr: r.typeFr }),
        moduleId: r.moduleId,
        moduleName: pick(locale, { en: r.nameEn, ar: r.nameAr, fr: r.nameFr }),
        universitySlug: r.universitySlug,
        sizeBytes: r.sizeBytes,
        viewedAt: r.viewedAt,
      }));
  },
);

export type SearchEntry = {
  id: string;
  kind: "module" | "resource";
  title: string;
  context: string;
  href: string;
};

/**
 * Everything the student can reach, flattened for the search box.
 *
 * Sent to the browser once and filtered there. A student holds a package, not
 * a library: that is tens of modules and low hundreds of resources, which is a
 * few kilobytes of JSON and an instant filter, against a round trip per
 * keystroke and a rate limiter to stop it being used to enumerate the
 * catalogue. Nothing outside their entitlement is in the payload, so there is
 * nothing here they could not already list by clicking.
 */
export const listSearchable = cache(
  async (userId: string, locale: Locale): Promise<SearchEntry[]> => {
    const entitled = await getEntitledModuleIds(userId);
    if (entitled.size === 0) return [];

    const rows = await db
      .select({
        moduleId: modules.id,
        moduleEn: modules.nameEn,
        moduleFr: modules.nameFr,
        moduleAr: modules.nameAr,
        resourceId: resources.id,
        titleEn: resources.titleEn,
        titleFr: resources.titleFr,
        titleAr: resources.titleAr,
        universitySlug: universities.slug,
        uniEn: universities.nameEn,
        uniFr: universities.nameFr,
        uniAr: universities.nameAr,
      })
      .from(modules)
      .innerJoin(semesters, eq(semesters.id, modules.semesterId))
      .innerJoin(academicYears, eq(academicYears.id, semesters.academicYearId))
      .innerJoin(universities, eq(universities.id, academicYears.universityId))
      .leftJoin(
        resources,
        and(
          eq(resources.moduleId, modules.id),
          eq(resources.isVisible, true),
          isNull(resources.archivedAt),
        ),
      )
      .where(
        and(
          eq(modules.isVisible, true),
          isNull(modules.archivedAt),
          isNull(semesters.archivedAt),
          isNull(academicYears.archivedAt),
        ),
      );

    const entries: SearchEntry[] = [];
    const seenModules = new Set<string>();

    for (const row of rows) {
      if (!entitled.has(row.moduleId)) continue;

      const moduleName = pick(locale, {
        en: row.moduleEn,
        ar: row.moduleAr,
        fr: row.moduleFr,
      });
      const uniName = pick(locale, { en: row.uniEn, ar: row.uniAr, fr: row.uniFr });
      const href = `/library/${row.universitySlug}/${row.moduleId}`;

      if (!seenModules.has(row.moduleId)) {
        seenModules.add(row.moduleId);
        entries.push({
          id: row.moduleId,
          kind: "module",
          title: moduleName,
          context: uniName,
          href,
        });
      }

      if (row.resourceId) {
        entries.push({
          id: row.resourceId,
          kind: "resource",
          title: pick(locale, { en: row.titleEn, ar: row.titleAr, fr: row.titleFr }),
          context: moduleName,
          href,
        });
      }
    }

    return entries;
  },
);
