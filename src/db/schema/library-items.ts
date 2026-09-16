import { boolean, index, integer, pgTable, primaryKey, text, uuid } from "drizzle-orm/pg-core";
import { resourceSource } from "./enums";
import { tags } from "./content";
import { RESTRICT, archivedAt, createdAt } from "./_shared";

/**
 * NextPhase/03-library — the general architecture library (books, PDF
 * documents, graduation projects, research papers, templates & CAD blocks).
 *
 * Categories are admin-editable rows, not a fixed enum — same pattern as
 * `product_categories` (`catalogue.ts`): the client can rename, reorder,
 * add or retire a shelf without a developer touching an enum. Seeded with
 * the infographic's original five (`book`, `document`,
 * `graduation_project`, `research_paper`, `template`) in the migration
 * itself, exactly like `product_categories`' own seed insert.
 */
export const libraryCategories = pgTable("library_categories", {
  id: uuid().primaryKey().defaultRandom(),
  key: text().notNull().unique(),
  labelEn: text().notNull(),
  labelFr: text(),
  labelAr: text(),
  position: integer().notNull().default(0),
  archivedAt: archivedAt(),
});

/**
 * Not the university tree (`universities` → ... → `resources` in
 * `content.ts`, live at `/library`). This is a second, flatter shelf: content
 * not tied to any one school's curriculum. Named `library_items`, not
 * `library`, precisely to avoid colliding with that existing name in code —
 * see `src/server/library-items.ts`'s own doc comment.
 *
 * `source`/`filePath`/`externalUrl`/`mimeType`/`sizeBytes` mirror
 * `resources` exactly (same enum, same shape) so `storage.ts` and the
 * streaming route need no new branch to serve either table. `isGated` is the
 * one field `resources` does not need and this table does: unlike the
 * university tree (always behind an entitlement), a library item can be
 * admin-marked free — a sample CAD pack, a recruiting-showcase graduation
 * project — per `03-library/PLAN.md` §7's "mixed" recommendation.
 */
export const libraryItems = pgTable(
  "library_items",
  {
    id: uuid().primaryKey().defaultRandom(),
    categoryId: uuid()
      .notNull()
      .references(() => libraryCategories.id, RESTRICT),
    titleEn: text().notNull(),
    titleFr: text(),
    titleAr: text(),
    descriptionEn: text().notNull(),
    descriptionFr: text(),
    descriptionAr: text(),
    /** A book or research paper's author — a proper noun, not translated. Same rule as `software_tools.nameEn`. */
    authorEn: text(),
    /** Shape B, public bucket — the thumbnail shown on the public grid/carousel. */
    coverImagePath: text(),
    source: resourceSource().notNull().default("file"),
    /** Relative to STORAGE_ROOT, set when source = 'file'. Shape A, entitlement-checked. */
    filePath: text(),
    /** Set when source = 'drive' | 'link'. Shape C. */
    externalUrl: text(),
    mimeType: text(),
    sizeBytes: integer(),
    /** Off by default. An admin turns it on per item, never globally — same rule as `resources.allowDownload`. */
    allowDownload: boolean().notNull().default(false),
    /** Whether this item requires an active LMS entitlement at all. Per-item, not all-or-nothing — see the plan's §7. */
    isGated: boolean().notNull().default(true),
    isVisible: boolean().notNull().default(true),
    position: integer().notNull().default(0),
    archivedAt: archivedAt(),
    createdAt: createdAt(),
  },
  (t) => [index("library_items_category_idx").on(t.categoryId, t.position)],
);

/** Reuses the existing generic `tags` table (`content.ts`) — a research paper's subject or a CAD block's discipline is open-ended, unlike Software Hub's closed enum. */
export const libraryItemTags = pgTable(
  "library_item_tags",
  {
    libraryItemId: uuid()
      .notNull()
      .references(() => libraryItems.id, RESTRICT),
    tagId: uuid()
      .notNull()
      .references(() => tags.id, RESTRICT),
  },
  (t) => [
    primaryKey({ columns: [t.libraryItemId, t.tagId] }),
    index("library_item_tags_tag_idx").on(t.tagId),
  ],
);
