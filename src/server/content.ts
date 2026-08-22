import "server-only";

import { cache } from "react";
import { and, asc, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  academicYears,
  modules,
  resourceTypes,
  resources,
  semesters,
  universities,
} from "@/db/schema";
import type { Locale } from "@/lib/i18n-content";
import { pick } from "@/lib/i18n-content";

/**
 * Student-facing reads. `is_visible` false hides a branch, `archived_at`
 * deletes it, and both are filtered here so no caller has to remember.
 * Admin reads live in `src/server/admin-content.ts` and see everything.
 */
const live = {
  university: () =>
    and(eq(universities.isVisible, true), isNull(universities.archivedAt)),
  year: () => and(eq(academicYears.isVisible, true), isNull(academicYears.archivedAt)),
  semester: () => and(eq(semesters.isVisible, true), isNull(semesters.archivedAt)),
  module: () => and(eq(modules.isVisible, true), isNull(modules.archivedAt)),
  resource: () => and(eq(resources.isVisible, true), isNull(resources.archivedAt)),
};

export const listUniversities = cache(async (locale: Locale) => {
  const rows = await db
    .select()
    .from(universities)
    .where(live.university())
    .orderBy(asc(universities.position), asc(universities.nameEn));

  return rows.map((u) => ({
    id: u.id,
    slug: u.slug,
    name: pick(locale, { en: u.nameEn, ar: u.nameAr, fr: u.nameFr }),
    logoPath: u.logoPath,
  }));
});

/**
 * The whole tree for one university in a single round trip. It is small (five
 * years, ten semesters, tens of modules) and it is read on every LMS page, so
 * fetching it piecewise would be the slowest thing in the app.
 */
export const getUniversityTree = cache(async (slug: string, locale: Locale) => {
  const [university] = await db
    .select()
    .from(universities)
    .where(and(eq(universities.slug, slug), live.university()))
    .limit(1);
  if (!university) return null;

  const rows = await db
    .select({
      yearId: academicYears.id,
      yearNameEn: academicYears.nameEn,
      yearNameFr: academicYears.nameFr,
      yearNameAr: academicYears.nameAr,
      yearPosition: academicYears.position,
      semesterId: semesters.id,
      semesterNumber: semesters.number,
      semesterLabelEn: semesters.labelEn,
      semesterLabelFr: semesters.labelFr,
      semesterLabelAr: semesters.labelAr,
      moduleId: modules.id,
      moduleNameEn: modules.nameEn,
      moduleNameFr: modules.nameFr,
      moduleNameAr: modules.nameAr,
      modulePosition: modules.position,
    })
    .from(academicYears)
    .innerJoin(semesters, eq(semesters.academicYearId, academicYears.id))
    .leftJoin(
      modules,
      and(eq(modules.semesterId, semesters.id), live.module()),
    )
    .where(and(eq(academicYears.universityId, university.id), live.year(), live.semester()))
    .orderBy(
      asc(academicYears.position),
      asc(semesters.number),
      asc(modules.position),
    );

  type ModuleNode = { id: string; name: string };
  type SemesterNode = { id: string; number: number; label: string; modules: ModuleNode[] };
  type YearNode = { id: string; level: string; semesters: SemesterNode[] };

  const years = new Map<string, YearNode>();
  for (const row of rows) {
    let year = years.get(row.yearId);
    if (!year) {
      year = {
        id: row.yearId,
        level: pick(locale, { en: row.yearNameEn, ar: row.yearNameAr, fr: row.yearNameFr }),
        semesters: [],
      };
      years.set(row.yearId, year);
    }
    let semester = year.semesters.find((s) => s.id === row.semesterId);
    if (!semester) {
      semester = {
        id: row.semesterId,
        number: row.semesterNumber,
        label: pick(locale, { en: row.semesterLabelEn, ar: row.semesterLabelAr, fr: row.semesterLabelFr }),
        modules: [],
      };
      year.semesters.push(semester);
    }
    if (row.moduleId) {
      semester.modules.push({
        id: row.moduleId,
        name: pick(locale, { en: row.moduleNameEn, ar: row.moduleNameAr, fr: row.moduleNameFr }),
      });
    }
  }

  return {
    id: university.id,
    slug: university.slug,
    name: pick(locale, { en: university.nameEn, ar: university.nameAr, fr: university.nameFr }),
    logoPath: university.logoPath,
    years: [...years.values()],
  };
});

/**
 * What is actually in the library, counted rather than claimed.
 *
 * The presentation page used to quote invented figures. Every number a visitor
 * reads should be one we can point at a row for; the copy rules say so and it
 * is also the only version that survives the client adding a university.
 */
export const getLibraryStats = cache(async () => {
  const [row] = await db
    .select({
      universities: sql<number>`count(distinct ${universities.id})::int`,
      modules: sql<number>`count(distinct ${modules.id})::int`,
      resources: sql<number>`count(distinct ${resources.id})::int`,
    })
    .from(universities)
    .leftJoin(academicYears, and(eq(academicYears.universityId, universities.id), live.year()))
    .leftJoin(semesters, and(eq(semesters.academicYearId, academicYears.id), live.semester()))
    .leftJoin(modules, and(eq(modules.semesterId, semesters.id), live.module()))
    .leftJoin(resources, and(eq(resources.moduleId, modules.id), live.resource()))
    .where(live.university());

  return {
    universities: row?.universities ?? 0,
    modules: row?.modules ?? 0,
    resources: row?.resources ?? 0,
  };
});

/** The six system types, plus whatever the admin has added. Ordered for display. */
export const listResourceTypes = cache(async (locale: Locale) => {
  const rows = await db
    .select()
    .from(resourceTypes)
    .orderBy(asc(resourceTypes.position));

  return rows.map((type) => ({
    key: type.key,
    label: pick(locale, { en: type.labelEn, ar: type.labelAr, fr: type.labelFr }),
  }));
});

export const getModuleWithResources = cache(
  async (moduleId: string, locale: Locale) => {
    const [row] = await db
      .select({
        module: modules,
        semester: semesters,
        year: academicYears,
        university: universities,
      })
      .from(modules)
      .innerJoin(semesters, eq(semesters.id, modules.semesterId))
      .innerJoin(academicYears, eq(academicYears.id, semesters.academicYearId))
      .innerJoin(universities, eq(universities.id, academicYears.universityId))
      .where(and(eq(modules.id, moduleId), live.module()))
      .limit(1);
    if (!row) return null;

    const items = await db
      .select({
        id: resources.id,
        titleEn: resources.titleEn,
        titleFr: resources.titleFr,
        titleAr: resources.titleAr,
        descriptionEn: resources.descriptionEn,
        descriptionFr: resources.descriptionFr,
        descriptionAr: resources.descriptionAr,
        source: resources.source,
        externalUrl: resources.externalUrl,
        mimeType: resources.mimeType,
        sizeBytes: resources.sizeBytes,
        allowDownload: resources.allowDownload,
        position: resources.position,
        typeKey: resourceTypes.key,
        typeLabelEn: resourceTypes.labelEn,
        typeLabelFr: resourceTypes.labelFr,
        typeLabelAr: resourceTypes.labelAr,
        typePosition: resourceTypes.position,
      })
      .from(resources)
      .innerJoin(resourceTypes, eq(resourceTypes.id, resources.resourceTypeId))
      .where(and(eq(resources.moduleId, moduleId), live.resource()))
      .orderBy(asc(resourceTypes.position), asc(resources.position));

    // Grouped by type, because that is how a student looks for a thing: the
    // TD, not the fourteenth item in a flat list.
    const groups = new Map<
      string,
      { key: string; label: string; items: typeof shaped }
    >();
    const shaped = items.map((r) => ({
      id: r.id,
      title: pick(locale, { en: r.titleEn, ar: r.titleAr, fr: r.titleFr }),
      description: pick(locale, { en: r.descriptionEn, ar: r.descriptionAr, fr: r.descriptionFr }),
      source: r.source,
      externalUrl: r.externalUrl,
      mimeType: r.mimeType,
      sizeBytes: r.sizeBytes,
      allowDownload: r.allowDownload,
      typeKey: r.typeKey,
    }));

    for (let i = 0; i < items.length; i += 1) {
      const meta = items[i];
      const group = groups.get(meta.typeKey) ?? {
        key: meta.typeKey,
        label: pick(locale, { en: meta.typeLabelEn, ar: meta.typeLabelAr, fr: meta.typeLabelFr }),
        items: [] as typeof shaped,
      };
      group.items.push(shaped[i]);
      groups.set(meta.typeKey, group);
    }

    return {
      id: row.module.id,
      name: pick(locale, { en: row.module.nameEn, ar: row.module.nameAr, fr: row.module.nameFr }),
      description: pick(locale, { en: row.module.descriptionEn, ar: row.module.descriptionAr, fr: row.module.descriptionFr }),
      semester: pick(locale, { en: row.semester.labelEn, ar: row.semester.labelAr, fr: row.semester.labelFr }),
      level: row.year.level,
      universitySlug: row.university.slug,
      universityName: pick(locale, { en: row.university.nameEn, ar: row.university.nameAr, fr: row.university.nameFr }),
      groups: [...groups.values()],
      resourceCount: shaped.length,
    };
  },
);
