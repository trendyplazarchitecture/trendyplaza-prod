import "server-only";

import { cache } from "react";
import { and, asc, eq, inArray, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  academicYears,
  modules,
  resources,
  semesters,
  universities,
} from "@/db/schema";
import type { Locale } from "@/lib/i18n-content";
import { pick } from "@/lib/i18n-content";
import { getEntitledModuleIds } from "./entitlements";

/**
 * The student's own view of the catalogue.
 *
 * `content.ts` answers "what exists"; this answers "what can this person
 * open". Keeping the two apart is what stops an entitlement check leaking into
 * a query that also serves the admin, where it would be wrong.
 */

export type LibraryUniversity = {
  id: string;
  slug: string;
  name: string;
  logoPath: string | null;
  moduleCount: number;
  resourceCount: number;
};

/**
 * Universities the student holds at least one module in, with counts. One
 * query, because the alternative is a tree fetch per university and the page
 * shows nothing else.
 */
export const listMyUniversities = cache(
  async (userId: string, locale: Locale): Promise<LibraryUniversity[]> => {
    const entitled = await getEntitledModuleIds(userId);
    if (entitled.size === 0) return [];

    const rows = await db
      .select({
        id: universities.id,
        slug: universities.slug,
        nameEn: universities.nameEn,
        nameFr: universities.nameFr,
        nameAr: universities.nameAr,
        logoPath: universities.logoPath,
        moduleCount: sql<number>`count(distinct ${modules.id})::int`,
        resourceCount: sql<number>`count(${resources.id})::int`,
      })
      .from(universities)
      .innerJoin(academicYears, eq(academicYears.universityId, universities.id))
      .innerJoin(semesters, eq(semesters.academicYearId, academicYears.id))
      .innerJoin(modules, eq(modules.semesterId, semesters.id))
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
          inArray(modules.id, [...entitled]),
          eq(universities.isVisible, true),
          isNull(universities.archivedAt),
        ),
      )
      .groupBy(
        universities.id,
        universities.slug,
        universities.nameEn,
        universities.nameFr,
        universities.nameAr,
        universities.logoPath,
        universities.position,
      )
      .orderBy(asc(universities.position), asc(universities.nameEn));

    return rows.map((row) => ({
      id: row.id,
      slug: row.slug,
      name: pick(locale, { en: row.nameEn, ar: row.nameAr, fr: row.nameFr }),
      logoPath: row.logoPath,
      moduleCount: row.moduleCount,
      resourceCount: row.resourceCount,
    }));
  },
);

/**
 * Every visible school, with whether this student can open it.
 *
 * The portal shows the locked ones too. A student whose pack covers one school
 * should be able to see that the others exist, because that is what they would
 * buy next; hiding them makes the platform look like it holds one university's
 * notes. Same argument as listing locked modules inside a tree.
 */
export const listPortalUniversities = cache(
  async (userId: string, locale: Locale) => {
    const entitled = await getEntitledModuleIds(userId);

    const rows = await db
      .select({
        id: universities.id,
        slug: universities.slug,
        nameEn: universities.nameEn,
        nameFr: universities.nameFr,
        nameAr: universities.nameAr,
        moduleId: modules.id,
      })
      .from(universities)
      .leftJoin(academicYears, and(
        eq(academicYears.universityId, universities.id),
        isNull(academicYears.archivedAt),
      ))
      .leftJoin(semesters, and(
        eq(semesters.academicYearId, academicYears.id),
        isNull(semesters.archivedAt),
      ))
      .leftJoin(modules, and(
        eq(modules.semesterId, semesters.id),
        eq(modules.isVisible, true),
        isNull(modules.archivedAt),
      ))
      .where(and(eq(universities.isVisible, true), isNull(universities.archivedAt)))
      .orderBy(asc(universities.position), asc(universities.nameEn));

    const byId = new Map<
      string,
      { id: string; slug: string; name: string; moduleCount: number; open: boolean }
    >();

    for (const row of rows) {
      let uni = byId.get(row.id);
      if (!uni) {
        uni = {
          id: row.id,
          slug: row.slug,
          name: pick(locale, { en: row.nameEn, ar: row.nameAr, fr: row.nameFr }),
          moduleCount: 0,
          open: false,
        };
        byId.set(row.id, uni);
      }
      if (row.moduleId) {
        uni.moduleCount += 1;
        // Open means at least one module inside is actually reachable, not
        // that the school exists.
        if (entitled.has(row.moduleId)) uni.open = true;
      }
    }

    // Open schools first: the ones a student can act on belong at the top.
    return [...byId.values()].sort((a, b) => Number(b.open) - Number(a.open));
  },
);

export type LibraryModule = {
  id: string;
  name: string;
  resourceCount: number;
  entitled: boolean;
};

export type LibraryTree = {
  id: string;
  slug: string;
  name: string;
  years: {
    id: string;
    level: string;
    semesters: {
      id: string;
      number: number;
      label: string;
      modules: LibraryModule[];
    }[];
  }[];
};

/**
 * One university's tree, with each module marked open or not.
 *
 * Modules outside the student's package are listed rather than hidden. A
 * student whose pack covers L2 should be able to see that L3 exists; hiding it
 * makes the library look thin and turns "what did I buy" into a support
 * question.
 */
export const getMyTree = cache(
  async (userId: string, slug: string, locale: Locale): Promise<LibraryTree | null> => {
    const [university] = await db
      .select()
      .from(universities)
      .where(
        and(
          eq(universities.slug, slug),
          eq(universities.isVisible, true),
          isNull(universities.archivedAt),
        ),
      )
      .limit(1);
    if (!university) return null;

    const entitled = await getEntitledModuleIds(userId);

    const rows = await db
      .select({
        yearId: academicYears.id,
        level: academicYears.level,
        yearNameEn: academicYears.nameEn,
        yearNameFr: academicYears.nameFr,
        yearNameAr: academicYears.nameAr,
        semesterId: semesters.id,
        semesterNumber: semesters.number,
        labelEn: semesters.labelEn,
        labelFr: semesters.labelFr,
        labelAr: semesters.labelAr,
        moduleId: modules.id,
        nameEn: modules.nameEn,
        nameFr: modules.nameFr,
        nameAr: modules.nameAr,
        resourceCount: sql<number>`(
          select count(*)::int from ${resources}
          where ${resources.moduleId} = ${modules.id}
            and ${resources.isVisible} = true
            and ${resources.archivedAt} is null
        )`,
      })
      .from(academicYears)
      .innerJoin(semesters, eq(semesters.academicYearId, academicYears.id))
      .leftJoin(
        modules,
        and(
          eq(modules.semesterId, semesters.id),
          eq(modules.isVisible, true),
          isNull(modules.archivedAt),
        ),
      )
      .where(
        and(
          eq(academicYears.universityId, university.id),
          eq(academicYears.isVisible, true),
          isNull(academicYears.archivedAt),
          eq(semesters.isVisible, true),
          isNull(semesters.archivedAt),
        ),
      )
      .orderBy(asc(academicYears.position), asc(semesters.number), asc(modules.position));

    const years: LibraryTree["years"] = [];
    for (const row of rows) {
      let year = years.find((y) => y.id === row.yearId);
      if (!year) {
        year = {
          id: row.yearId,
          level: pick(locale, {
            en: row.yearNameEn,
            ar: row.yearNameAr,
            fr: row.yearNameFr,
          }),
          semesters: [],
        };
        years.push(year);
      }

      let semester = year.semesters.find((s) => s.id === row.semesterId);
      if (!semester) {
        semester = {
          id: row.semesterId,
          number: row.semesterNumber,
          label: pick(locale, { en: row.labelEn, ar: row.labelAr, fr: row.labelFr }),
          modules: [],
        };
        year.semesters.push(semester);
      }

      if (row.moduleId) {
        semester.modules.push({
          id: row.moduleId,
          name: pick(locale, { en: row.nameEn, ar: row.nameAr, fr: row.nameFr }),
          resourceCount: row.resourceCount,
          entitled: entitled.has(row.moduleId),
        });
      }
    }

    return {
      id: university.id,
      slug: university.slug,
      name: pick(locale, { en: university.nameEn, ar: university.nameAr, fr: university.nameFr }),
      years,
    };
  },
);
