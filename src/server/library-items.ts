import "server-only";

import { cache } from "react";
import { and, asc, desc, eq, getTableColumns, inArray, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { libraryCategories, libraryItems, libraryItemTags, tags } from "@/db/schema";
import type { Locale } from "@/lib/i18n-content";
import { pick } from "@/lib/i18n-content";
import { hasAnyAccess } from "./entitlements";

/**
 * NextPhase/03-library — the general architecture library.
 *
 * Not `library.ts`, which already exists for the university tree's own
 * student-facing reads (`/library`). This file is a distinct name on
 * purpose, one this codebase does not already use, mirroring
 * `03-library/PLAN.md` §4's own instruction to grep before naming anything
 * here.
 *
 * Categories are admin-editable rows (`library_categories`), not a fixed
 * enum — same reasoning as `product_categories` — so this module reads and
 * writes them like any other small reference table, not a hardcoded union.
 */

export type LibraryCategoryOption = {
  id: string;
  key: string;
  label: string;
  labelEn: string;
  labelAr: string | null;
  labelFr: string | null;
  position: number;
  archivedAt: Date | null;
};

/** Every visible category, in display order — the public filter tabs. */
export const listLibraryCategories = cache(async (locale: Locale): Promise<LibraryCategoryOption[]> => {
  const rows = await db
    .select()
    .from(libraryCategories)
    .where(isNull(libraryCategories.archivedAt))
    .orderBy(asc(libraryCategories.position));

  return rows.map((row) => ({
    id: row.id,
    key: row.key,
    label: pick(locale, { en: row.labelEn, ar: row.labelAr, fr: row.labelFr }),
    labelEn: row.labelEn,
    labelAr: row.labelAr,
    labelFr: row.labelFr,
    position: row.position,
    archivedAt: row.archivedAt,
  }));
});

/** Every category, archived included — the admin's own tabs and the item form's picker. */
export async function listAdminLibraryCategories(): Promise<LibraryCategoryOption[]> {
  const rows = await db.select().from(libraryCategories).orderBy(asc(libraryCategories.position));
  return rows.map((row) => ({
    id: row.id,
    key: row.key,
    label: row.labelEn,
    labelEn: row.labelEn,
    labelAr: row.labelAr,
    labelFr: row.labelFr,
    position: row.position,
    archivedAt: row.archivedAt,
  }));
}

export type LibraryItemSummary = {
  id: string;
  category: { id: string; key: string; label: string };
  title: string;
  description: string;
  author: string | null;
  coverImagePath: string | null;
  isGated: boolean;
  allowDownload: boolean;
  source: "file" | "youtube" | "drive" | "link";
  externalUrl: string | null;
  mimeType: string | null;
  sizeBytes: number | null;
  tags: { slug: string; label: string }[];
};

/** One row of the joined item+category select below — the shape both list and single-item reads produce. */
type JoinedItemRow = typeof libraryItems.$inferSelect & {
  categoryKey: string;
  categoryLabelEn: string;
  categoryLabelAr: string | null;
  categoryLabelFr: string | null;
};

const itemWithCategoryColumns = {
  ...getTableColumns(libraryItems),
  categoryKey: libraryCategories.key,
  categoryLabelEn: libraryCategories.labelEn,
  categoryLabelAr: libraryCategories.labelAr,
  categoryLabelFr: libraryCategories.labelFr,
};

function shapeRow(
  row: JoinedItemRow,
  locale: Locale,
  itemTags: { slug: string; labelEn: string; labelAr: string | null; labelFr: string | null }[],
): LibraryItemSummary {
  return {
    id: row.id,
    category: {
      id: row.categoryId,
      key: row.categoryKey,
      label: pick(locale, { en: row.categoryLabelEn, ar: row.categoryLabelAr, fr: row.categoryLabelFr }),
    },
    title: pick(locale, { en: row.titleEn, ar: row.titleAr, fr: row.titleFr }),
    description: pick(locale, { en: row.descriptionEn, ar: row.descriptionAr, fr: row.descriptionFr }),
    author: row.authorEn,
    coverImagePath: row.coverImagePath,
    isGated: row.isGated,
    allowDownload: row.allowDownload,
    source: row.source,
    externalUrl: row.externalUrl,
    mimeType: row.mimeType,
    sizeBytes: row.sizeBytes,
    tags: itemTags.map((t) => ({ slug: t.slug, label: pick(locale, { en: t.labelEn, ar: t.labelAr, fr: t.labelFr }) })),
  };
}

/** Every tag attached to every visible item, one query, grouped in memory rather than N+1 per item. */
async function tagsByItem(itemIds: string[]) {
  if (itemIds.length === 0) return new Map<string, { slug: string; labelEn: string; labelAr: string | null; labelFr: string | null }[]>();

  const rows = await db
    .select({
      libraryItemId: libraryItemTags.libraryItemId,
      slug: tags.slug,
      labelEn: tags.labelEn,
      labelAr: tags.labelAr,
      labelFr: tags.labelFr,
    })
    .from(libraryItemTags)
    .innerJoin(tags, eq(tags.id, libraryItemTags.tagId))
    .where(inArray(libraryItemTags.libraryItemId, itemIds));

  const map = new Map<string, { slug: string; labelEn: string; labelAr: string | null; labelFr: string | null }[]>();
  for (const row of rows) {
    const list = map.get(row.libraryItemId) ?? [];
    list.push({ slug: row.slug, labelEn: row.labelEn, labelAr: row.labelAr, labelFr: row.labelFr });
    map.set(row.libraryItemId, list);
  }
  return map;
}

/**
 * Public read: every visible, unarchived item, optionally filtered by
 * category key or tag. One joined query for the rows plus one batched
 * query for their tags — never a query per item, and never a separate
 * round-trip just to resolve each row's category.
 */
export const listLibraryItems = cache(
  async (
    locale: Locale,
    filters: { categoryKey?: string; tagSlug?: string } = {},
  ): Promise<LibraryItemSummary[]> => {
    const conditions = [eq(libraryItems.isVisible, true), isNull(libraryItems.archivedAt)];
    if (filters.categoryKey) conditions.push(eq(libraryCategories.key, filters.categoryKey));

    if (filters.tagSlug) {
      const tagged = await db
        .select({ id: libraryItems.id })
        .from(libraryItems)
        .innerJoin(libraryItemTags, eq(libraryItemTags.libraryItemId, libraryItems.id))
        .innerJoin(tags, eq(tags.id, libraryItemTags.tagId))
        .where(and(eq(libraryItems.isVisible, true), isNull(libraryItems.archivedAt), eq(tags.slug, filters.tagSlug)));
      if (tagged.length === 0) return [];
      conditions.push(inArray(libraryItems.id, tagged.map((r) => r.id)));
    }

    const rows = await db
      .select(itemWithCategoryColumns)
      .from(libraryItems)
      .innerJoin(libraryCategories, eq(libraryCategories.id, libraryItems.categoryId))
      .where(and(...conditions))
      .orderBy(asc(libraryItems.position), desc(libraryItems.createdAt));

    const tagMap = await tagsByItem(rows.map((r) => r.id));
    return rows.map((row) => shapeRow(row, locale, tagMap.get(row.id) ?? []));
  },
);

export const getLibraryItemById = cache(
  async (id: string, locale: Locale): Promise<LibraryItemSummary | null> => {
    const [row] = await db
      .select(itemWithCategoryColumns)
      .from(libraryItems)
      .innerJoin(libraryCategories, eq(libraryCategories.id, libraryItems.categoryId))
      .where(and(eq(libraryItems.id, id), eq(libraryItems.isVisible, true), isNull(libraryItems.archivedAt)))
      .limit(1);
    if (!row) return null;

    const tagMap = await tagsByItem([row.id]);
    return shapeRow(row, locale, tagMap.get(row.id) ?? []);
  },
);

/** Every visible tag slug currently attached to at least one visible library item — drives the public filter bar. */
export const listLibraryTags = cache(async (locale: Locale) => {
  const rows = await db
    .selectDistinct({ slug: tags.slug, labelEn: tags.labelEn, labelAr: tags.labelAr, labelFr: tags.labelFr })
    .from(tags)
    .innerJoin(libraryItemTags, eq(libraryItemTags.tagId, tags.id))
    .innerJoin(
      libraryItems,
      and(
        eq(libraryItems.id, libraryItemTags.libraryItemId),
        eq(libraryItems.isVisible, true),
        isNull(libraryItems.archivedAt),
      ),
    );

  return rows
    .map((r) => ({ slug: r.slug, label: pick(locale, { en: r.labelEn, ar: r.labelAr, fr: r.labelFr }) }))
    .sort((a, b) => a.label.localeCompare(b.label));
});

export type LibraryAccess =
  | { status: "ok"; item: typeof libraryItems.$inferSelect }
  | { status: "not_found" }
  | { status: "forbidden" };

/**
 * The check the streaming route makes before a single byte moves — mirrors
 * `resolveResourceAccess` (`entitlements.ts`) exactly, except the gate is
 * conditional on `isGated` rather than always required. A signed-in user
 * reading an ungated item needs no entitlement at all.
 */
export async function resolveLibraryItemAccess(
  userId: string,
  itemId: string,
): Promise<LibraryAccess> {
  const [row] = await db
    .select()
    .from(libraryItems)
    .where(and(eq(libraryItems.id, itemId), isNull(libraryItems.archivedAt)))
    .limit(1);

  if (!row || !row.isVisible) return { status: "not_found" };
  if (row.isGated && !(await hasAnyAccess(userId))) return { status: "forbidden" };
  return { status: "ok", item: row };
}

/** Every row an admin can act on, archived included — the editor groups them client-side. */
export async function listAdminLibraryItems() {
  const rows = await db.select().from(libraryItems).orderBy(asc(libraryItems.position));
  const tagMap = await tagsByItem(rows.map((r) => r.id));
  return rows.map((row) => ({
    ...row,
    tags: (tagMap.get(row.id) ?? []).map((t) => t.slug),
  }));
}

export async function listAllTagsForPicker() {
  return db.select({ id: tags.id, slug: tags.slug, labelEn: tags.labelEn }).from(tags).orderBy(asc(tags.labelEn));
}

/** Count per category, for the admin's tab badges. */
export const countByCategory = cache(async () => {
  const rows = await db
    .select({ categoryId: libraryItems.categoryId, n: sql<number>`count(*)::int` })
    .from(libraryItems)
    .where(isNull(libraryItems.archivedAt))
    .groupBy(libraryItems.categoryId);

  return new Map(rows.map((r) => [r.categoryId, r.n]));
});
