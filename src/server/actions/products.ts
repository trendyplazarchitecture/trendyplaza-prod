"use server";

import { revalidatePath } from "next/cache";
import { and, eq, inArray, isNull, max, sql } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import {
  orderItems,
  productCategories,
  productColors,
  productImages,
  productOffers,
  productSpecs,
  products,
} from "@/db/schema";
import { requirePermission } from "@/server/session";
import { logActivity } from "@/server/activity";
import { storeUpload } from "@/server/storage";
import { toCentimes, toDinars } from "@/lib/money";
import type { ActionResult } from "./orders";

export type { ActionResult };

/**
 * Product authoring.
 *
 * Prices are typed in dinars, because that is what a person says out loud,
 * and converted to centimes here. That conversion happens in exactly one
 * place; a second one is how half a catalogue ends up priced at 1/100th.
 */
const productInput = z.object({
  id: z.string().uuid().optional(),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9-]+$/, "Lower case letters, numbers and hyphens only"),
  titleEn: z.string().trim().min(1).max(200),
  titleAr: z.string().trim().max(200).nullable().optional(),
  titleFr: z.string().trim().max(200).nullable().optional(),
  descriptionEn: z.string().trim().max(1200).nullable().optional(),
  descriptionAr: z.string().trim().max(1200).nullable().optional(),
  descriptionFr: z.string().trim().max(1200).nullable().optional(),
  categoryId: z.string().uuid(),
  /** In dinars, as typed. */
  price: z.coerce.number().min(0).max(10_000_000),
  compareAt: z.coerce.number().min(0).max(10_000_000).nullable().optional(),
  stockCount: z.coerce.number().int().min(0).max(100_000),
  sku: z.string().trim().max(60).nullable().optional(),
  containsAccessCode: z.boolean().optional(),
  accessPackageId: z.string().uuid().nullable().optional(),
  isVisible: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
});

export async function saveProductAction(formData: FormData): Promise<ActionResult> {
  const actor = await requirePermission("products.manage");

  const raw = {
    id: (formData.get("id") as string) || undefined,
    slug: formData.get("slug"),
    titleEn: formData.get("titleEn"),
    titleAr: (formData.get("titleAr") as string) || null,
    titleFr: (formData.get("titleFr") as string) || null,
    descriptionEn: (formData.get("descriptionEn") as string) || null,
    descriptionAr: (formData.get("descriptionAr") as string) || null,
    descriptionFr: (formData.get("descriptionFr") as string) || null,
    categoryId: formData.get("categoryId"),
    price: formData.get("price"),
    compareAt: (formData.get("compareAt") as string) || null,
    stockCount: formData.get("stockCount"),
    sku: (formData.get("sku") as string) || null,
    containsAccessCode: formData.get("containsAccessCode") === "on",
    accessPackageId: (formData.get("accessPackageId") as string) || null,
    isVisible: formData.get("isVisible") !== "off",
    isFeatured: formData.get("isFeatured") === "on",
  };

  const parsed = productInput.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      message:
        parsed.error.issues[0]?.message ??
        "Check the fields. A slug, an English title, a category and a price are needed.",
    };
  }
  const data = parsed.data;

  // A pack that says it contains a card has to name what the card opens, or
  // the product page cannot tell the buyer and the promise is empty.
  if (data.containsAccessCode && !data.accessPackageId) {
    return {
      ok: false,
      message: "Say which package the card inside opens, or untick the card option.",
    };
  }

  const values = {
    slug: data.slug,
    titleEn: data.titleEn,
    titleAr: data.titleAr ?? null,
    titleFr: data.titleFr ?? null,
    descriptionEn: data.descriptionEn ?? null,
    descriptionAr: data.descriptionAr ?? null,
    descriptionFr: data.descriptionFr ?? null,
    categoryId: data.categoryId,
    priceDzd: toCentimes(data.price),
    compareAtDzd: data.compareAt ? toCentimes(data.compareAt) : null,
    stockCount: data.stockCount,
    sku: data.sku ?? null,
    containsAccessCode: data.containsAccessCode ?? false,
    accessPackageId: data.containsAccessCode ? (data.accessPackageId ?? null) : null,
    isVisible: data.isVisible ?? true,
    isFeatured: data.isFeatured ?? false,
  };

  let productId = data.id;

  try {
    if (productId) {
      await db.update(products).set(values).where(eq(products.id, productId));
    } else {
      const [row] = await db
        .select({ value: max(products.position) })
        .from(products);

      const [created] = await db
        .insert(products)
        .values({ ...values, position: (row?.value ?? 0) + 1 })
        .returning();
      productId = created.id;
    }
  } catch (error) {
    // The slug is unique and it is the one field a person collides on.
    // Drizzle/postgres puts the real driver error (with constraint_name) on
    // error.cause, not in the top-level message string.
    const cause = error instanceof Error ? (error.cause as { constraint_name?: string } | undefined) : undefined;
    if (cause?.constraint_name === "products_slug_unique") {
      return { ok: false, message: `The slug "${data.slug}" is already taken. Pick another.` };
    }
    throw error;
  }

  // Images are public: it is a shop, and the point is that anyone can see
  // them. They still get magic-byte checked and re-encoded to WebP, because a
  // phone photo at 6 MB is the whole 3G budget.
  //
  // `getAll`, so a client can drop the whole gallery in one go rather than
  // reopening the dialog once per photograph.
  const uploads = formData
    .getAll("images")
    .filter((f): f is File => f instanceof File && f.size > 0);

  let rejected = 0;
  if (uploads.length > 0 && productId) {
    const [row] = await db
      .select({ value: max(productImages.position) })
      .from(productImages)
      .where(eq(productImages.productId, productId));
    let position = (row?.value ?? 0) + 1;

    for (const upload of uploads) {
      const stored = await storeUpload(
        "products",
        { buffer: Buffer.from(await upload.arrayBuffer()) },
        { maxBytes: 12 * 1024 * 1024, convertImages: true },
      );

      // One bad file out of twenty must not throw away the nineteen good
      // ones, or the client re-drops the whole set to find the offender.
      if (!stored.ok) {
        rejected++;
        continue;
      }

      await db.insert(productImages).values({
        productId,
        path: stored.relativePath,
        position: position++,
        altEn: data.titleEn,
        altAr: data.titleAr ?? null,
        altFr: data.titleFr ?? null,
      });
    }
  }

  await logActivity({
    actorId: actor.id,
    action: data.id ? "products.updated" : "products.created",
    entity: "product",
    entityId: productId,
    after: { slug: data.slug, priceDzd: values.priceDzd, stock: values.stockCount },
  });

  revalidatePath("/admin/products");
  revalidatePath("/admin");
  revalidatePath("/", "layout");

  const saved = data.id ? "Product saved." : "Product created.";
  return {
    ok: true,
    message:
      rejected > 0
        ? `${saved} ${rejected} file${rejected === 1 ? "" : "s"} were not images we accept and were skipped.`
        : saved,
  };
}

export async function setProductFeaturedAction(
  input: { productId: string; isFeatured: boolean },
): Promise<ActionResult> {
  const actor = await requirePermission("products.manage");
  const { productId } = idInput.parse(input);

  await db
    .update(products)
    .set({ isFeatured: input.isFeatured })
    .where(eq(products.id, productId));

  await logActivity({
    actorId: actor.id,
    action: input.isFeatured ? "products.featured" : "products.unfeatured",
    entity: "product",
    entityId: productId,
  });

  revalidatePath("/admin/products");
  // The landing page reads this, so it has to be rebuilt or the client
  // features something and sees no change.
  revalidatePath("/", "layout");
  return {
    ok: true,
    message: input.isFeatured ? "Featured on the home page." : "No longer featured.",
  };
}

/* --------------------------------------------------------------------------
 * Specs and offers. Both are sent as the whole set and replace what is there,
 * because that is what the editor holds: a list the client has finished
 * arranging, not a stream of individual edits.
 * ----------------------------------------------------------------------- */

const specsInput = z.object({
  productId: z.string().uuid(),
  rows: z
    .array(
      z.object({
        labelEn: z.string().trim().min(1).max(80),
        labelFr: z.string().trim().max(80).nullable().optional(),
        labelAr: z.string().trim().max(80).nullable().optional(),
        valueEn: z.string().trim().min(1).max(200),
        valueFr: z.string().trim().max(200).nullable().optional(),
        valueAr: z.string().trim().max(200).nullable().optional(),
      }),
    )
    .max(30),
});

export async function saveProductSpecsAction(
  input: z.infer<typeof specsInput>,
): Promise<ActionResult> {
  const actor = await requirePermission("products.manage");
  const parsed = specsInput.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Every spec needs an English label and value." };
  }
  const data = parsed.data;

  await db.transaction(async (tx) => {
    // Archived, not removed, and in the same transaction as the insert, so the
    // product page never renders half a spec table.
    await tx
      .update(productSpecs)
      .set({ archivedAt: new Date() })
      .where(
        and(eq(productSpecs.productId, data.productId), isNull(productSpecs.archivedAt)),
      );

    if (data.rows.length > 0) {
      await tx.insert(productSpecs).values(
        data.rows.map((row, index) => ({
          productId: data.productId,
          labelEn: row.labelEn,
          labelFr: row.labelFr ?? null,
          labelAr: row.labelAr ?? null,
          valueEn: row.valueEn,
          valueFr: row.valueFr ?? null,
          valueAr: row.valueAr ?? null,
          position: index,
        })),
      );
    }
  });

  await logActivity({
    actorId: actor.id,
    action: "products.specs_updated",
    entity: "product",
    entityId: data.productId,
    after: { count: data.rows.length },
  });

  revalidatePath("/admin/products");
  return { ok: true, message: `${data.rows.length} specs saved.` };
}

const offersInput = z.object({
  productId: z.string().uuid(),
  rows: z
    .array(
      z.object({
        // Two is the lowest quantity that is an offer. One is just the price.
        minQuantity: z.coerce.number().int().min(2).max(100),
        kind: z.enum(["percent", "unit_price"]),
        /** Percent points, or a unit price in dinars as typed. */
        value: z.coerce.number().min(0).max(10_000_000),
        labelEn: z.string().trim().max(80).nullable().optional(),
        labelFr: z.string().trim().max(80).nullable().optional(),
        labelAr: z.string().trim().max(80).nullable().optional(),
      }),
    )
    .max(10),
});

export async function saveProductOffersAction(
  input: z.infer<typeof offersInput>,
): Promise<ActionResult> {
  const actor = await requirePermission("products.manage");
  const parsed = offersInput.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "An offer needs a quantity of 2 or more and a value.",
    };
  }
  const data = parsed.data;

  // The table has a unique key on (product, quantity). Catching it here means
  // a clear sentence rather than a constraint name in a toast.
  const quantities = data.rows.map((r) => r.minQuantity);
  if (new Set(quantities).size !== quantities.length) {
    return { ok: false, message: "Two offers cannot start at the same quantity." };
  }

  const [product] = await db
    .select({ priceDzd: products.priceDzd })
    .from(products)
    .where(eq(products.id, data.productId))
    .limit(1);
  if (!product) return { ok: false, message: "That product no longer exists." };

  for (const row of data.rows) {
    if (row.kind === "percent" && row.value > 100) {
      return { ok: false, message: "A percentage offer cannot be over 100." };
    }
    if (row.kind === "unit_price" && toCentimes(row.value) >= product.priceDzd) {
      return {
        ok: false,
        message: `A ${row.minQuantity}+ price of ${row.value} DA is not below the ${toDinars(product.priceDzd)} DA list price. That is not an offer.`,
      };
    }
  }

  await db.transaction(async (tx) => {
    // Archive rather than remove: an offer that priced a past order is part of
    // why that order cost what it did, even though the price itself is frozen
    // on the line.
    await tx
      .update(productOffers)
      .set({ archivedAt: new Date(), isActive: false })
      .where(
        and(eq(productOffers.productId, data.productId), isNull(productOffers.archivedAt)),
      );

    if (data.rows.length > 0) {
      await tx.insert(productOffers).values(
        data.rows.map((row, index) => ({
          productId: data.productId,
          minQuantity: row.minQuantity,
          kind: row.kind,
          value: row.kind === "percent" ? Math.round(row.value) : toCentimes(row.value),
          labelEn: row.labelEn ?? null,
          labelFr: row.labelFr ?? null,
          labelAr: row.labelAr ?? null,
          position: index,
        })),
      );
    }
  });

  await logActivity({
    actorId: actor.id,
    action: "products.offers_updated",
    entity: "product",
    entityId: data.productId,
    after: { tiers: data.rows.map((r) => `${r.minQuantity}+`) },
  });

  revalidatePath("/admin/products");
  revalidatePath("/", "layout");
  return { ok: true, message: `${data.rows.length} offers saved.` };
}

/**
 * Removing an image row. This is the one delete in the products module and it
 * is not a content delete: no order, entitlement or receipt holds a key to a
 * `product_images` row, and a product with a photograph the client no longer
 * wants is not history worth keeping. The file on disk is left; a sweep for
 * unreferenced uploads is a separate job.
 */
export async function deleteProductImageAction(input: {
  imageId: string;
}): Promise<ActionResult> {
  const actor = await requirePermission("products.manage");
  const { imageId } = z.object({ imageId: z.string().uuid() }).parse(input);

  const [image] = await db
    .select()
    .from(productImages)
    .where(eq(productImages.id, imageId))
    .limit(1);
  if (!image) return { ok: false, message: "That image is already gone." };

  // eslint-disable-next-line no-restricted-syntax
  await db.delete(productImages).where(eq(productImages.id, imageId));

  await logActivity({
    actorId: actor.id,
    action: "products.image_removed",
    entity: "product",
    entityId: image.productId,
    before: { path: image.path },
  });

  revalidatePath("/admin/products");
  revalidatePath("/", "layout");
  return { ok: true, message: "Image removed." };
}

/** The whole order, as the client arranged it. Position 0 is the card image. */
export async function reorderProductImagesAction(input: {
  productId: string;
  imageIds: string[];
}): Promise<ActionResult> {
  const actor = await requirePermission("products.manage");
  const data = z
    .object({ productId: z.string().uuid(), imageIds: z.array(z.string().uuid()).max(30) })
    .parse(input);

  await db.transaction(async (tx) => {
    for (const [index, id] of data.imageIds.entries()) {
      await tx
        .update(productImages)
        .set({ position: index })
        .where(
          and(eq(productImages.id, id), eq(productImages.productId, data.productId)),
        );
    }
  });

  await logActivity({
    actorId: actor.id,
    action: "products.images_reordered",
    entity: "product",
    entityId: data.productId,
  });

  revalidatePath("/admin/products");
  revalidatePath("/", "layout");
  return { ok: true, message: "Order saved. The first image is the one on the card." };
}

/**
 * Drag-to-reorder in the admin products list. `position` is one global
 * sequence — `listProducts` orders the whole catalogue by it, unscoped by
 * category — so a drag inside a single (paginated, 25-per-page) admin page
 * must not touch any row outside it. Reusing the exact set of position
 * values the dragged rows already hold, just permuted to match the new
 * order, does that without needing to know what any other page contains.
 */
export async function reorderProductsAction(input: {
  ids: string[];
}): Promise<ActionResult> {
  const actor = await requirePermission("products.manage");
  const data = z.object({ ids: z.array(z.string().uuid()).min(1).max(200) }).parse(input);

  const rows = await db
    .select({ id: products.id, position: products.position })
    .from(products)
    .where(inArray(products.id, data.ids));
  if (rows.length !== data.ids.length) {
    return { ok: false, message: "That list is out of date. Reload and try again." };
  }

  const slots = rows.map((r) => r.position).sort((a, b) => a - b);

  await db.transaction(async (tx) => {
    for (const [index, id] of data.ids.entries()) {
      await tx.update(products).set({ position: slots[index] }).where(eq(products.id, id));
    }
  });

  await logActivity({
    actorId: actor.id,
    action: "products.reordered",
    entity: "product",
    entityId: data.ids[0],
  });

  revalidatePath("/admin/products");
  revalidatePath("/", "layout");
  return { ok: true, message: "Reordered." };
}

const stockInput = z.object({
  productId: z.string().uuid(),
  /** Signed. Negative writes stock off. */
  delta: z.coerce.number().int().min(-10_000).max(10_000),
  note: z.string().trim().max(200).optional(),
});

/**
 * A relative adjustment, not an absolute set.
 *
 * Two people counting the same shelf and both typing 40 leaves 40. Two people
 * each adding the 20 they counted leaves 40 as well, and the guard keeps it
 * from going negative. Setting an absolute value silently discards whichever
 * write lost the race.
 */
export async function adjustStockAction(
  input: z.infer<typeof stockInput>,
): Promise<ActionResult> {
  const actor = await requirePermission("products.manage");
  const data = stockInput.parse(input);

  const [row] = await db
    .update(products)
    .set({ stockCount: sql`greatest(0, ${products.stockCount} + ${data.delta})` })
    .where(eq(products.id, data.productId))
    .returning({ stockCount: products.stockCount });

  if (!row) return { ok: false, message: "That product no longer exists." };

  await logActivity({
    actorId: actor.id,
    action: "products.stock_adjusted",
    entity: "product",
    entityId: data.productId,
    after: { delta: data.delta, now: row.stockCount, note: data.note ?? null },
  });

  revalidatePath("/admin/products");
  revalidatePath("/admin");
  return {
    ok: true,
    message: `Stock is now ${row.stockCount}.`,
  };
}

const idInput = z.object({ productId: z.string().uuid() });

export async function setProductVisibilityAction(
  input: z.infer<typeof idInput> & { isVisible: boolean },
): Promise<ActionResult> {
  const actor = await requirePermission("products.manage");
  const { productId } = idInput.parse(input);

  await db
    .update(products)
    .set({ isVisible: input.isVisible })
    .where(eq(products.id, productId));

  await logActivity({
    actorId: actor.id,
    action: input.isVisible ? "products.listed" : "products.unlisted",
    entity: "product",
    entityId: productId,
  });

  revalidatePath("/admin/products");
  return {
    ok: true,
    message: input.isVisible ? "Listed in the shop." : "Taken off the shop.",
  };
}

/**
 * Archive, never delete. Order history holds a foreign key to this row, and
 * removing it orphans every receipt the customer was ever sent.
 */
export async function archiveProductAction(
  input: z.infer<typeof idInput>,
): Promise<ActionResult> {
  const actor = await requirePermission("products.manage");
  const { productId } = idInput.parse(input);

  await db
    .update(products)
    .set({ archivedAt: new Date(), isVisible: false })
    .where(and(eq(products.id, productId), isNull(products.archivedAt)));

  await logActivity({
    actorId: actor.id,
    action: "products.archived",
    entity: "product",
    entityId: productId,
  });

  revalidatePath("/admin/products");
  return { ok: true, message: "Archived. Past orders still show it correctly." };
}

export async function restoreProductAction(
  input: z.infer<typeof idInput>,
): Promise<ActionResult> {
  const actor = await requirePermission("products.manage");
  const { productId } = idInput.parse(input);

  await db.update(products).set({ archivedAt: null }).where(eq(products.id, productId));

  await logActivity({
    actorId: actor.id,
    action: "products.restored",
    entity: "product",
    entityId: productId,
  });

  revalidatePath("/admin/products");
  return { ok: true, message: "Restored, and still off the shop until you list it." };
}

/* --------------------------------------------------------------- categories */

const categoryInput = z.object({
  id: z.string().uuid().optional(),
  key: z
    .string()
    .trim()
    .min(2)
    .max(40)
    .regex(/^[a-z0-9-]+$/, "Lower case letters, numbers and hyphens only"),
  labelEn: z.string().trim().min(1).max(60),
  labelAr: z.string().trim().max(60).nullable().optional(),
  labelFr: z.string().trim().max(60).nullable().optional(),
});

export async function saveCategoryAction(formData: FormData): Promise<ActionResult> {
  const actor = await requirePermission("products.manage");

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
      message:
        parsed.error.issues[0]?.message ?? "A category needs a key and an English label.",
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
      await db.update(productCategories).set(values).where(eq(productCategories.id, data.id));
    } else {
      const [row] = await db
        .select({ value: max(productCategories.position) })
        .from(productCategories);

      await db.insert(productCategories).values({ ...values, position: (row?.value ?? 0) + 1 });
    }
  } catch (error) {
    // Drizzle/postgres puts the real driver error (with constraint_name) on
    // error.cause, not in the top-level message string.
    const cause = error instanceof Error ? (error.cause as { constraint_name?: string } | undefined) : undefined;
    if (cause?.constraint_name === "product_categories_key_unique") {
      return { ok: false, message: `The key "${data.key}" is already taken. Pick another.` };
    }
    throw error;
  }

  await logActivity({
    actorId: actor.id,
    action: data.id ? "products.category_updated" : "products.category_created",
    entity: "product_category",
    entityId: data.id,
    after: values,
  });

  revalidatePath("/admin/products");
  revalidatePath("/", "layout");
  return { ok: true, message: data.id ? "Category saved." : "Category added." };
}

const categoryIdInput = z.object({ categoryId: z.string().uuid() });

export async function archiveCategoryAction(
  input: z.infer<typeof categoryIdInput>,
): Promise<ActionResult> {
  const actor = await requirePermission("products.manage");
  const { categoryId } = categoryIdInput.parse(input);

  await db
    .update(productCategories)
    .set({ archivedAt: new Date() })
    .where(and(eq(productCategories.id, categoryId), isNull(productCategories.archivedAt)));

  await logActivity({
    actorId: actor.id,
    action: "products.category_archived",
    entity: "product_category",
    entityId: categoryId,
  });

  revalidatePath("/admin/products");
  revalidatePath("/", "layout");
  return {
    ok: true,
    message: "Archived. Products already in it keep it; it just stops being offered.",
  };
}

export async function restoreCategoryAction(
  input: z.infer<typeof categoryIdInput>,
): Promise<ActionResult> {
  const actor = await requirePermission("products.manage");
  const { categoryId } = categoryIdInput.parse(input);

  await db
    .update(productCategories)
    .set({ archivedAt: null })
    .where(eq(productCategories.id, categoryId));

  await logActivity({
    actorId: actor.id,
    action: "products.category_restored",
    entity: "product_category",
    entityId: categoryId,
  });

  revalidatePath("/admin/products");
  revalidatePath("/", "layout");
  return { ok: true, message: "Restored." };
}

/**
 * A real delete, not archive-only — unlike content and catalogue rows, a
 * category carries no purchase history of its own. `products.category_id` is
 * `RESTRICT`, so this fails loudly at the database if anything still points
 * at it; checked here first only to give a message that names the count
 * instead of a raw constraint error.
 */
export async function deleteCategoryAction(
  input: z.infer<typeof categoryIdInput>,
): Promise<ActionResult> {
  const actor = await requirePermission("products.manage");
  const { categoryId } = categoryIdInput.parse(input);

  const [{ n }] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(products)
    .where(eq(products.categoryId, categoryId));

  if (n > 0) {
    return {
      ok: false,
      message: `${n} product${n === 1 ? "" : "s"} still use this category. Move ${n === 1 ? "it" : "them"} first, or archive the category instead.`,
    };
  }

  // eslint-disable-next-line no-restricted-syntax -- category without products can be removed
  await db.delete(productCategories).where(eq(productCategories.id, categoryId));

  await logActivity({
    actorId: actor.id,
    action: "products.category_deleted",
    entity: "product_category",
    entityId: categoryId,
  });

  revalidatePath("/admin/products");
  revalidatePath("/", "layout");
  return { ok: true, message: "Deleted." };
}

/* ------------------------------------------------------------------ colors */

const HEX = /^#[0-9a-f]{6}$/i;

const colorInput = z.object({
  id: z.string().uuid().optional(),
  productId: z.string().uuid(),
  nameEn: z.string().trim().min(1).max(60),
  nameFr: z.string().trim().max(60).nullable().optional(),
  nameAr: z.string().trim().max(60).nullable().optional(),
  hex: z
    .string()
    .trim()
    .toUpperCase()
    .refine((v) => v === "" || HEX.test(v), "A hex color looks like #1A2B3C")
    .nullable()
    .optional(),
  stockCount: z.coerce.number().int().min(0).max(100_000).default(0),
  isVisible: z.coerce.boolean().default(true),
});

export async function saveProductColorAction(formData: FormData): Promise<ActionResult> {
  const actor = await requirePermission("products.manage");

  const parsed = colorInput.safeParse({
    id: (formData.get("id") as string) || undefined,
    productId: formData.get("productId"),
    nameEn: formData.get("nameEn"),
    nameFr: (formData.get("nameFr") as string) || null,
    nameAr: (formData.get("nameAr") as string) || null,
    hex: (formData.get("hex") as string) || null,
    stockCount: formData.get("stockCount"),
    isVisible: formData.get("isVisible") === "true",
  });
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "A color needs a name.",
    };
  }
  const data = parsed.data;

  const values = {
    productId: data.productId,
    nameEn: data.nameEn,
    nameFr: data.nameFr ?? null,
    nameAr: data.nameAr ?? null,
    hex: data.hex || null,
    stockCount: data.stockCount,
    isVisible: data.isVisible,
  };

  try {
    if (data.id) {
      await db.update(productColors).set(values).where(eq(productColors.id, data.id));
    } else {
      const [row] = await db
        .select({ value: max(productColors.position) })
        .from(productColors)
        .where(eq(productColors.productId, data.productId));

      await db
        .insert(productColors)
        .values({ ...values, position: (row?.value ?? 0) + 1 });
    }
  } catch (error) {
    // Drizzle/postgres puts the real driver error (with constraint_name) on
    // error.cause, not in the top-level message string. See 06's fix.
    const cause = error instanceof Error ? (error.cause as { constraint_name?: string } | undefined) : undefined;
    if (cause?.constraint_name === "product_colors_product_name_key") {
      return { ok: false, message: `This product already has a color named "${data.nameEn}".` };
    }
    throw error;
  }

  await logActivity({
    actorId: actor.id,
    action: data.id ? "products.color_updated" : "products.color_created",
    entity: "product",
    entityId: data.productId,
    after: values,
  });

  revalidatePath("/admin/products");
  revalidatePath("/", "layout");
  return { ok: true, message: data.id ? "Color saved." : "Color added." };
}

const colorIdInput = z.object({ colorId: z.string().uuid() });

export async function archiveProductColorAction(
  input: z.infer<typeof colorIdInput>,
): Promise<ActionResult> {
  const actor = await requirePermission("products.manage");
  const { colorId } = colorIdInput.parse(input);

  await db
    .update(productColors)
    .set({ archivedAt: new Date(), isVisible: false })
    .where(and(eq(productColors.id, colorId), isNull(productColors.archivedAt)));

  await logActivity({
    actorId: actor.id,
    action: "products.color_archived",
    entity: "product_color",
    entityId: colorId,
  });

  revalidatePath("/admin/products");
  revalidatePath("/", "layout");
  return { ok: true, message: "Archived. Past orders that used it are unaffected." };
}

export async function restoreProductColorAction(
  input: z.infer<typeof colorIdInput>,
): Promise<ActionResult> {
  const actor = await requirePermission("products.manage");
  const { colorId } = colorIdInput.parse(input);

  await db
    .update(productColors)
    .set({ archivedAt: null })
    .where(eq(productColors.id, colorId));

  await logActivity({
    actorId: actor.id,
    action: "products.color_restored",
    entity: "product_color",
    entityId: colorId,
  });

  revalidatePath("/admin/products");
  revalidatePath("/", "layout");
  return { ok: true, message: "Restored. Still hidden until you turn visibility on." };
}

/**
 * A real delete, guarded: `order_items.product_color_id` is `RESTRICT`, so
 * this fails at the database if any order used it. Checked here first only
 * to give a message that names the count instead of a raw constraint error.
 */
export async function deleteProductColorAction(
  input: z.infer<typeof colorIdInput>,
): Promise<ActionResult> {
  const actor = await requirePermission("products.manage");
  const { colorId } = colorIdInput.parse(input);

  const [{ n }] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(orderItems)
    .where(eq(orderItems.productColorId, colorId));

  if (n > 0) {
    return {
      ok: false,
      message: `${n} order${n === 1 ? "" : "s"} reference this color. Archive it instead.`,
    };
  }

  // eslint-disable-next-line no-restricted-syntax -- color unreferenced by any order can be removed
  await db.delete(productColors).where(eq(productColors.id, colorId));

  await logActivity({
    actorId: actor.id,
    action: "products.color_deleted",
    entity: "product_color",
    entityId: colorId,
  });

  revalidatePath("/admin/products");
  revalidatePath("/", "layout");
  return { ok: true, message: "Deleted." };
}
