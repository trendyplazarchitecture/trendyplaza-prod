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
import { academicLevel, resourceSource, scopeType } from "./enums";
import { RESTRICT, archivedAt, createdAt, updatedAt } from "./_shared";

/* --------------------------------------------------------------------------
 * University → Academic year → Semester → Module → Resource.
 *
 * Every key on this chain is `restrict`. A cascade here removes content a
 * student paid for, raises no error, and leaves no trace. It is the most
 * expensive mistake available in this schema.
 *
 * `is_visible` is the admin hiding something from students.
 * `archived_at` is deletion. They are not the same column and never merge.
 *
 * Three locales, `_en` `_ar` `_fr`, in the client's order of priority.
 * English is the authoring language, so `_en` is `notNull` and the other two
 * are optional and fall back through `pick()` in src/lib/i18n-content.ts.
 * Requiring all three at insert time would stall the client's team the first
 * time they load a module with no translator to hand, and a fallback that is
 * tested is safer than a column that is filled with placeholder text to get
 * past a constraint.
 *
 * Proper nouns are not tripled: `wilayas` and `communes` carry `_fr` and `_ar`
 * only, because a place has one Latin spelling and one Arabic spelling.
 * ----------------------------------------------------------------------- */

export const universities = pgTable("universities", {
  id: uuid().primaryKey().defaultRandom(),
  slug: text().notNull().unique(),
  nameEn: text().notNull(),
  nameFr: text(),
  nameAr: text(),
  logoPath: text(),
  isVisible: boolean().notNull().default(true),
  position: integer().notNull().default(0),
  archivedAt: archivedAt(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

/**
 * A year of study, named by whoever runs the school.
 *
 * `level` was a `L1..M2` enum with a unique key per university, which encoded
 * the LMD system into the schema. Plenty of Algerian schools do not use it:
 * an architecture school running a five-year diplôme has "1ère année" through
 * "5ème année", a preparatory year, or names of its own. A fixed enum made
 * those universities impossible to enter rather than merely awkward.
 *
 * So the name is free text, trilingual like every other content column, and
 * ordering is `position`. `level` survives as an optional tag, because
 * entitlement scopes and the seed still read it and because "this is the L2
 * cohort" is genuinely useful when it happens to be true.
 */
export const academicYears = pgTable(
  "academic_years",
  {
    id: uuid().primaryKey().defaultRandom(),
    universityId: uuid()
      .notNull()
      .references(() => universities.id, RESTRICT),
    nameEn: text().notNull(),
    nameFr: text(),
    nameAr: text(),
    /** Optional. Null for any school that does not run LMD. */
    level: academicLevel(),
    isVisible: boolean().notNull().default(true),
    position: integer().notNull().default(0),
    archivedAt: archivedAt(),
    createdAt: createdAt(),
  },
  (t) => [index("academic_years_university_idx").on(t.universityId, t.position)],
);

export const semesters = pgTable(
  "semesters",
  {
    id: uuid().primaryKey().defaultRandom(),
    academicYearId: uuid()
      .notNull()
      .references(() => academicYears.id, RESTRICT),
    number: integer().notNull(),
    labelEn: text().notNull(),
    labelFr: text(),
    labelAr: text(),
    isVisible: boolean().notNull().default(true),
    archivedAt: archivedAt(),
    createdAt: createdAt(),
  },
  (t) => [unique("semesters_year_number_key").on(t.academicYearId, t.number)],
);

/**
 * A module belongs to one university, through its semester. Reuse across
 * universities is a copy of the resources, never a shared reference, so one
 * client editing their copy cannot change another university's content.
 */
export const modules = pgTable(
  "modules",
  {
    id: uuid().primaryKey().defaultRandom(),
    semesterId: uuid()
      .notNull()
      .references(() => semesters.id, RESTRICT),
    nameEn: text().notNull(),
    nameFr: text(),
    nameAr: text(),
    descriptionEn: text(),
    descriptionFr: text(),
    descriptionAr: text(),
    isVisible: boolean().notNull().default(true),
    position: integer().notNull().default(0),
    archivedAt: archivedAt(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("modules_semester_idx").on(t.semesterId, t.position)],
);

/** Seeded with cours, td, tp, exam, resume, video. Admin adds more. */
export const resourceTypes = pgTable("resource_types", {
  id: uuid().primaryKey().defaultRandom(),
  key: text().notNull().unique(),
  labelEn: text().notNull(),
  labelFr: text(),
  labelAr: text(),
  isSystem: boolean().notNull().default(false),
  position: integer().notNull().default(0),
});

export const resources = pgTable(
  "resources",
  {
    id: uuid().primaryKey().defaultRandom(),
    moduleId: uuid()
      .notNull()
      .references(() => modules.id, RESTRICT),
    resourceTypeId: uuid()
      .notNull()
      .references(() => resourceTypes.id, RESTRICT),
    titleEn: text().notNull(),
    titleFr: text(),
    titleAr: text(),
    descriptionEn: text(),
    descriptionFr: text(),
    descriptionAr: text(),
    source: resourceSource().notNull().default("file"),
    /** Relative to STORAGE_ROOT. Never a path under public/. */
    filePath: text(),
    externalUrl: text(),
    mimeType: text(),
    sizeBytes: integer(),
    /** Off by default. An admin turns it on per resource, never globally. */
    allowDownload: boolean().notNull().default(false),
    isVisible: boolean().notNull().default(true),
    position: integer().notNull().default(0),
    archivedAt: archivedAt(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("resources_module_idx").on(t.moduleId, t.position)],
);

export const tags = pgTable("tags", {
  id: uuid().primaryKey().defaultRandom(),
  slug: text().notNull().unique(),
  labelEn: text().notNull(),
  labelFr: text(),
  labelAr: text(),
});

export const resourceTags = pgTable(
  "resource_tags",
  {
    resourceId: uuid()
      .notNull()
      .references(() => resources.id, RESTRICT),
    tagId: uuid()
      .notNull()
      .references(() => tags.id, RESTRICT),
  },
  (t) => [
    primaryKey({ columns: [t.resourceId, t.tagId] }),
    index("resource_tags_tag_idx").on(t.tagId),
  ],
);

/* --------------------------------------------------------------------------
 * The sellable unit of LMS access.
 * ----------------------------------------------------------------------- */

export const lmsPackages = pgTable("lms_packages", {
  id: uuid().primaryKey().defaultRandom(),
  titleEn: text().notNull(),
  titleFr: text(),
  titleAr: text(),
  descriptionEn: text(),
  descriptionFr: text(),
  descriptionAr: text(),
  priceDzd: integer().notNull(),
  /** Null means unlimited. Duration is per package or per grant, never global. */
  defaultDurationDays: integer(),
  isVisible: boolean().notNull().default(true),
  archivedAt: archivedAt(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

/**
 * `scopeId` is deliberately not a foreign key: it points at one of four
 * tables depending on `scopeType`. Resolution joins by type in
 * `src/server/entitlements.ts`, and the seed and admin both validate the
 * target exists before writing.
 */
export const packageContents = pgTable(
  "package_contents",
  {
    packageId: uuid()
      .notNull()
      .references(() => lmsPackages.id, RESTRICT),
    scopeType: scopeType().notNull(),
    scopeId: uuid().notNull(),
  },
  (t) => [primaryKey({ columns: [t.packageId, t.scopeType, t.scopeId] })],
);
