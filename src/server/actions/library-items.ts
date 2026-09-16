"use server";

import { revalidatePath } from "next/cache";
import { eq, max, sql } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { libraryCategories, libraryItems, libraryItemTags, tags } from "@/db/schema";
import { requirePermission } from "@/server/session";
import { logActivity } from "@/server/activity";
import { MAX_RESOURCE_BYTES, isInlinePreviewable, storeUpload } from "@/server/storage";
import { LIBRARY_COVER_FILES } from "@/lib/library-covers";
import type { ActionResult } from "./orders";

export type { ActionResult };

const REVALIDATE_PATHS = ["/admin/library", "/digital-library"] as const;

function revalidateLibrary() {
  for (const path of REVALIDATE_PATHS) revalidatePath(path);
}

const sourceEnum = z.enum(["file", "youtube", "drive", "link"]);

const saveInput = z.object({
  id: z.string().uuid().optional(),
  categoryId: z.string().uuid(),
  titleEn: z.string().trim().min(1).max(300),
  titleFr: z.string().trim().max(300).nullable(),
  titleAr: z.string().trim().max(300).nullable(),
  descriptionEn: z.string().trim().min(1).max(2000),
  descriptionFr: z.string().trim().max(2000).nullable(),
  descriptionAr: z.string().trim().max(2000).nullable(),
  authorEn: z.string().trim().max(200).nullable(),
  source: sourceEnum,
  externalUrl: z.string().trim().url().max(500).nullable(),
  allowDownload: z.boolean(),
  isGated: z.boolean(),
  isVisible: z.boolean(),
  tagIds: z.array(z.string().uuid()).max(20),
});

/**
 * One form, every category — the field a book needs (author) and the field a
 * CAD block doesn't are both just nullable columns, not a per-category form.
 * Template: `saveSoftwareToolAction` (`actions/software.ts`).
 */
export async function saveLibraryItemAction(formData: FormData): Promise<ActionResult> {
  const actor = await requirePermission("library.manage");

  const field = (name: string) => {
    const value = formData.get(name);
    const trimmed = typeof value === "string" ? value.trim() : "";
    return trimmed || null;
  };

  const tagIds = formData.getAll("tagIds").map(String).filter(Boolean);

  const parsed = saveInput.safeParse({
    id: (formData.get("id") as string) || undefined,
    categoryId: formData.get("categoryId"),
    titleEn: formData.get("titleEn"),
    titleFr: field("titleFr"),
    titleAr: field("titleAr"),
    descriptionEn: formData.get("descriptionEn"),
    descriptionFr: field("descriptionFr"),
    descriptionAr: field("descriptionAr"),
    authorEn: field("authorEn"),
    source: formData.get("source") ?? "file",
    externalUrl: field("externalUrl"),
    allowDownload: formData.get("allowDownload") === "on",
    isGated: formData.get("isGated") !== "off",
    isVisible: formData.get("isVisible") !== "off",
    tagIds,
  });
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "A category, a title, and a description are needed.",
    };
  }
  const data = parsed.data;

  const [category] = await db
    .select({ id: libraryCategories.id })
    .from(libraryCategories)
    .where(eq(libraryCategories.id, data.categoryId));
  if (!category) {
    return { ok: false, message: "That category no longer exists. Pick another." };
  }

  if ((data.source === "youtube" || data.source === "drive" || data.source === "link") && !data.externalUrl) {
    return { ok: false, message: "That source needs a URL." };
  }

  // File upload, cover image: same "leave alone unless a new one arrived" shape as `saveSoftwareToolAction`.
  let filePath: string | null | undefined;
  let mimeType: string | null | undefined;
  let sizeBytes: number | null | undefined;
  let allowDownloadFinal = data.allowDownload;

  if (data.source === "file") {
    const upload = formData.get("file");
    if (upload instanceof File && upload.size > 0) {
      const stored = await storeUpload(
        "resources",
        { buffer: Buffer.from(await upload.arrayBuffer()), declaredName: upload.name },
        { maxBytes: MAX_RESOURCE_BYTES, convertImages: false },
      );
      if (!stored.ok) {
        return {
          ok: false,
          message:
            stored.error === "too_large"
              ? "That file is over 200 MB. Split it, or compress the file."
              : "That file type is not accepted. Use PDF, images, AutoCAD (.dwg, .dxf), Word (.docx), PowerPoint (.pptx), or Excel (.xlsx).",
        };
      }
      filePath = stored.relativePath;
      mimeType = stored.mime;
      sizeBytes = stored.bytes;
      allowDownloadFinal = data.allowDownload || !isInlinePreviewable(stored.mime);
    } else if (!data.id) {
      return { ok: false, message: "Choose a file to upload." };
    }
  }

  let coverImagePath: string | null | undefined;
  const cover = formData.get("cover");
  const removeCover = formData.get("removeCover") === "on";
  const coverAsset = field("coverAsset");
  if (cover instanceof File && cover.size > 0) {
    const stored = await storeUpload(
      "library",
      { buffer: Buffer.from(await cover.arrayBuffer()) },
      { maxBytes: 4 * 1024 * 1024, convertImages: true },
    );
    if (!stored.ok) {
      return {
        ok: false,
        message: stored.error === "too_large" ? "That cover image is over 4 MB." : "That cover image is not a JPEG, PNG or WebP.",
      };
    }
    coverImagePath = stored.relativePath;
  } else if (coverAsset) {
    // One of the vetted, in-house-generated stock covers
    // (`lib/library-covers.ts`) rather than a fresh upload — same
    // `seed/<file>` pointer convention as the Software Hub's vendor-logo
    // picker. Validated against the fixed list, never trusted as a
    // free-form path.
    const known = LIBRARY_COVER_FILES.some((f) => f.file === coverAsset);
    if (!known) {
      return { ok: false, message: "That is not a recognised stock cover." };
    }
    coverImagePath = `seed/${coverAsset}`;
  } else if (removeCover) {
    coverImagePath = null;
  }

  const values = {
    categoryId: data.categoryId,
    titleEn: data.titleEn,
    titleFr: data.titleFr,
    titleAr: data.titleAr,
    descriptionEn: data.descriptionEn,
    descriptionFr: data.descriptionFr,
    descriptionAr: data.descriptionAr,
    authorEn: data.authorEn,
    source: data.source,
    externalUrl: data.source === "file" ? null : data.externalUrl,
    allowDownload: allowDownloadFinal,
    isGated: data.isGated,
    isVisible: data.isVisible,
  };

  let id = data.id;
  await db.transaction(async (tx) => {
    if (id) {
      await tx
        .update(libraryItems)
        .set({
          ...values,
          ...(filePath !== undefined ? { filePath, mimeType, sizeBytes } : {}),
          ...(coverImagePath !== undefined ? { coverImagePath } : {}),
        })
        .where(eq(libraryItems.id, id));
      // eslint-disable-next-line no-restricted-syntax -- rebuilding the tag join for this item, not a soft-deleted content row.
      await tx.delete(libraryItemTags).where(eq(libraryItemTags.libraryItemId, id));
    } else {
      const [row] = await tx.select({ value: max(libraryItems.position) }).from(libraryItems);
      const [created] = await tx
        .insert(libraryItems)
        .values({
          ...values,
          filePath: filePath ?? null,
          mimeType: mimeType ?? null,
          sizeBytes: sizeBytes ?? null,
          coverImagePath: coverImagePath ?? null,
          position: (row?.value ?? 0) + 1,
        })
        .returning();
      id = created.id;
    }

    if (data.tagIds.length > 0) {
      await tx.insert(libraryItemTags).values(data.tagIds.map((tagId) => ({ libraryItemId: id!, tagId })));
    }
  });

  await logActivity({
    actorId: actor.id,
    action: data.id ? "library_item.updated" : "library_item.created",
    entity: "library_item",
    entityId: id!,
    after: { titleEn: data.titleEn, categoryId: data.categoryId },
  });

  revalidateLibrary();
  return { ok: true, message: "Saved." };
}

const idInput = z.object({ itemId: z.string().uuid() });

export async function archiveLibraryItemAction(input: z.infer<typeof idInput>): Promise<ActionResult> {
  const actor = await requirePermission("library.manage");
  const { itemId } = idInput.parse(input);

  await db.update(libraryItems).set({ archivedAt: new Date() }).where(eq(libraryItems.id, itemId));

  await logActivity({ actorId: actor.id, action: "library_item.archived", entity: "library_item", entityId: itemId });

  revalidateLibrary();
  return { ok: true, message: "Deleted." };
}

const visibleInput = z.object({ itemId: z.string().uuid(), isVisible: z.boolean() });

export async function setLibraryItemVisibleAction(input: z.infer<typeof visibleInput>): Promise<ActionResult> {
  const actor = await requirePermission("library.manage");
  const data = visibleInput.parse(input);

  await db.update(libraryItems).set({ isVisible: data.isVisible }).where(eq(libraryItems.id, data.itemId));

  await logActivity({
    actorId: actor.id,
    action: data.isVisible ? "library_item.shown" : "library_item.hidden",
    entity: "library_item",
    entityId: data.itemId,
  });

  revalidateLibrary();
  return { ok: true, message: data.isVisible ? "Now showing." : "Hidden." };
}

const gatedInput = z.object({ itemId: z.string().uuid(), isGated: z.boolean() });

export async function setLibraryItemGatedAction(input: z.infer<typeof gatedInput>): Promise<ActionResult> {
  const actor = await requirePermission("library.manage");
  const data = gatedInput.parse(input);

  await db.update(libraryItems).set({ isGated: data.isGated }).where(eq(libraryItems.id, data.itemId));

  await logActivity({
    actorId: actor.id,
    action: data.isGated ? "library_item.gated" : "library_item.ungated",
    entity: "library_item",
    entityId: data.itemId,
  });

  revalidateLibrary();
  return { ok: true, message: data.isGated ? "Now requires access." : "Now free to read." };
}

const reorderInput = z.object({ itemIds: z.array(z.string().uuid()).max(500) });

export async function reorderLibraryItemsAction(input: z.infer<typeof reorderInput>): Promise<ActionResult> {
  const actor = await requirePermission("library.manage");
  const { itemIds } = reorderInput.parse(input);

  await db.transaction(async (tx) => {
    for (const [index, id] of itemIds.entries()) {
      await tx.update(libraryItems).set({ position: index + 1 }).where(eq(libraryItems.id, id));
    }
  });

  await logActivity({ actorId: actor.id, action: "library_item.reordered", entity: "library_item" });

  revalidateLibrary();
  return { ok: true, message: "Order saved." };
}

const newTagInput = z.object({ label: z.string().trim().min(1).max(60) });

/** A tag typed fresh in the admin form, not picked from the existing list — same slugify-with-suffix pattern as `saveSoftwareToolAction`'s slug. */
export async function createLibraryTagAction(
  input: z.infer<typeof newTagInput>,
): Promise<{ ok: true; id: string; slug: string; labelEn: string } | { ok: false; message: string }> {
  await requirePermission("library.manage");
  const { label } = newTagInput.parse(input);

  const baseSlug = label.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "tag";
  let slug = baseSlug;
  for (let suffix = 2; ; suffix++) {
    const [clash] = await db.select({ id: tags.id }).from(tags).where(eq(tags.slug, slug)).limit(1);
    if (!clash) break;
    slug = `${baseSlug}-${suffix}`;
  }

  const [created] = await db.insert(tags).values({ slug, labelEn: label }).returning();
  return { ok: true, id: created.id, slug: created.slug, labelEn: created.labelEn };
}

/* --------------------------------------------------------------------------
 * Category CRUD. Template: `saveCategoryAction`/`archiveCategoryAction`/
 * `restoreCategoryAction`/`deleteCategoryAction` (`actions/products.ts`) —
 * `library_categories` is shaped exactly like `product_categories`, an
 * admin-editable reference table rather than a fixed enum.
 * ----------------------------------------------------------------------- */

const categoryInput = z.object({
  id: z.string().uuid().optional(),
  key: z
    .string()
    .trim()
    .min(2)
    .max(40)
    .regex(/^[a-z0-9-]+$/, "Lower case letters, numbers and hyphens only"),
  labelEn: z.string().trim().min(1).max(80),
  labelAr: z.string().trim().max(80).nullable().optional(),
  labelFr: z.string().trim().max(80).nullable().optional(),
});

export async function saveLibraryCategoryAction(formData: FormData): Promise<ActionResult> {
  const actor = await requirePermission("library.manage");

  const parsed = categoryInput.safeParse({
    id: (formData.get("id") as string) || undefined,
    key: formData.get("key"),
    labelEn: formData.get("labelEn"),
    labelAr: (formData.get("labelAr") as string) || null,
    labelFr: (formData.get("labelFr") as string) || null,
  });
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "A category needs a key and an English label.",
    };
  }
  const data = parsed.data;

  const values = {
    key: data.key,
    labelEn: data.labelEn,
    labelAr: data.labelAr ?? null,
    labelFr: data.labelFr ?? null,
  };

  try {
    if (data.id) {
      await db.update(libraryCategories).set(values).where(eq(libraryCategories.id, data.id));
    } else {
      const [row] = await db.select({ value: max(libraryCategories.position) }).from(libraryCategories);
      await db.insert(libraryCategories).values({ ...values, position: (row?.value ?? 0) + 1 });
    }
  } catch (error) {
    const cause = error instanceof Error ? (error.cause as { constraint_name?: string } | undefined) : undefined;
    if (cause?.constraint_name === "library_categories_key_unique") {
      return { ok: false, message: `The key "${data.key}" is already taken. Pick another.` };
    }
    throw error;
  }

  await logActivity({
    actorId: actor.id,
    action: data.id ? "library_category.updated" : "library_category.created",
    entity: "library_category",
    entityId: data.id,
    after: values,
  });

  revalidateLibrary();
  return { ok: true, message: data.id ? "Category saved." : "Category added." };
}

const categoryIdInput = z.object({ categoryId: z.string().uuid() });

export async function archiveLibraryCategoryAction(
  input: z.infer<typeof categoryIdInput>,
): Promise<ActionResult> {
  const actor = await requirePermission("library.manage");
  const { categoryId } = categoryIdInput.parse(input);

  await db
    .update(libraryCategories)
    .set({ archivedAt: new Date() })
    .where(eq(libraryCategories.id, categoryId));

  await logActivity({
    actorId: actor.id,
    action: "library_category.archived",
    entity: "library_category",
    entityId: categoryId,
  });

  revalidateLibrary();
  return {
    ok: true,
    message: "Archived. Items already in it keep it; it just stops being offered as a choice.",
  };
}

export async function restoreLibraryCategoryAction(
  input: z.infer<typeof categoryIdInput>,
): Promise<ActionResult> {
  const actor = await requirePermission("library.manage");
  const { categoryId } = categoryIdInput.parse(input);

  await db.update(libraryCategories).set({ archivedAt: null }).where(eq(libraryCategories.id, categoryId));

  await logActivity({
    actorId: actor.id,
    action: "library_category.restored",
    entity: "library_category",
    entityId: categoryId,
  });

  revalidateLibrary();
  return { ok: true, message: "Restored." };
}

/**
 * A real delete, not archive-only — a category carries no purchase or
 * entitlement history of its own. `library_items.category_id` is
 * `RESTRICT`, so this fails loudly at the database if anything still points
 * at it; checked here first only to give a message that names the count.
 */
export async function deleteLibraryCategoryAction(
  input: z.infer<typeof categoryIdInput>,
): Promise<ActionResult> {
  const actor = await requirePermission("library.manage");
  const { categoryId } = categoryIdInput.parse(input);

  const [{ n }] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(libraryItems)
    .where(eq(libraryItems.categoryId, categoryId));

  if (n > 0) {
    return {
      ok: false,
      message: `${n} item${n === 1 ? "" : "s"} still use this category. Move ${n === 1 ? "it" : "them"} first, or archive the category instead.`,
    };
  }

  // eslint-disable-next-line no-restricted-syntax -- category without items can be removed
  await db.delete(libraryCategories).where(eq(libraryCategories.id, categoryId));

  await logActivity({
    actorId: actor.id,
    action: "library_category.deleted",
    entity: "library_category",
    entityId: categoryId,
  });

  revalidateLibrary();
  return { ok: true, message: "Deleted." };
}
