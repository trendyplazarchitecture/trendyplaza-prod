import { boolean, integer, pgTable, text, uuid, type AnyPgColumn } from "drizzle-orm/pg-core";
import { softwareToolKind } from "./enums";
import { RESTRICT, archivedAt, createdAt } from "./_shared";

/**
 * Software Hub (NextPhase/02-software-hub) — a curated directory of vendor
 * links, not a download server. Every entry links out; nothing here is
 * hosted, per that plan's Shape C decision. `logoPath` is the one exception
 * (Shape B, the small icon image) and lives under the public media bucket
 * like product and roster images already do.
 *
 * `parentToolId` is a plugin's application (null for a standalone
 * application) — a closed, client-named list, so an enum plus a
 * self-reference is simpler to filter by than free tags (00-shared's own
 * reasoning). `relatedCourseId` is left as a plain nullable uuid rather than
 * a real foreign key until 04-courses-videos ships its `courses` table —
 * exactly the plan's own note on why the column can exist before the table
 * it will eventually point at.
 */
export const softwareTools = pgTable("software_tools", {
  id: uuid().primaryKey().defaultRandom(),
  kind: softwareToolKind().notNull().default("application"),
  slug: text().notNull().unique(),
  nameEn: text().notNull(), // "AutoCAD" is a proper noun, not translated — same rule as roster_members.name
  descriptionEn: text().notNull(),
  descriptionFr: text(),
  descriptionAr: text(),
  logoPath: text(),
  officialUrl: text().notNull(),
  studentLicenseUrl: text(),
  parentToolId: uuid().references((): AnyPgColumn => softwareTools.id, RESTRICT),
  relatedCourseId: uuid(),
  /**
   * Incremented once per "official site"/"student license" click, never
   * decremented. Purely a popularity signal for the admin — it drives an
   * admin-side sort and a "popular" badge, never the public order, which
   * stays admin-controlled (`position`) so the client is never surprised by
   * their own hub reordering itself.
   */
  clickCount: integer().notNull().default(0),
  isVisible: boolean().notNull().default(true),
  position: integer().notNull().default(0),
  archivedAt: archivedAt(),
  createdAt: createdAt(),
});

/**
 * The "trusted by" logo strip — homepage, about page, and the software hub
 * page. Deliberately not the same table as `softwareTools`: this is
 * decorative marketing content (a logo, nothing else), not a curated
 * directory entry with a description and vendor links, and the two lists
 * overlap only by coincidence (AutoCAD is both a Hub entry and a carousel
 * logo, V-Ray might be only a carousel logo). `logoPath` here is a filename
 * under `public/software-logos/` (the client's own vetted SVGs), not a
 * `storeUpload` bucket path — see the note in `actions/software-carousel.ts`
 * on why arbitrary SVG upload is out of scope.
 */
export const homepageSoftwareLogos = pgTable("homepage_software_logos", {
  id: uuid().primaryKey().defaultRandom(),
  nameEn: text().notNull(),
  logoPath: text().notNull(),
  isVisible: boolean().notNull().default(true),
  position: integer().notNull().default(0),
  archivedAt: archivedAt(),
  createdAt: createdAt(),
});
