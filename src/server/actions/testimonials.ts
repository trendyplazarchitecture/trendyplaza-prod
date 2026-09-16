"use server";

import { revalidatePath } from "next/cache";
import { and, eq, isNotNull, isNull, max } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { testimonials } from "@/db/schema";
import { requirePermission } from "@/server/session";
import { storeUpload } from "@/server/storage";
import { logActivity } from "@/server/activity";
import type { ActionResult } from "./orders";

export type { ActionResult };

/**
 * The home page marquee. Each row is an admin-uploaded screenshot, nothing
 * bilingual to carry, so create is the whole edit surface: an image goes in,
 * a position and a visibility toggle come with it, and that is the entire
 * shape of the content. There is no "update" action because there is nothing
 * on a row worth changing in place; swap it out and delete the old one.
 */

const REVALIDATE_PATHS = ["/admin/testimonials", "/"] as const;

function revalidateTestimonials() {
  for (const path of REVALIDATE_PATHS) revalidatePath(path);
}

export async function createTestimonialAction(formData: FormData): Promise<ActionResult> {
  const actor = await requirePermission("testimonials.manage");

  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, message: "Pick an image first." };
  }

  const stored = await storeUpload(
    "testimonials",
    { buffer: Buffer.from(await file.arrayBuffer()) },
    { maxBytes: 12 * 1024 * 1024, convertImages: true },
  );
  if (!stored.ok) {
    return {
      ok: false,
      message:
        stored.error === "too_large"
          ? "That image is over 12 MB."
          : "That file is not an image this can read (JPEG, PNG or WebP).",
    };
  }

  const [row] = await db
    .select({ value: max(testimonials.position) })
    .from(testimonials);

  const [created] = await db
    .insert(testimonials)
    .values({ imagePath: stored.relativePath, position: (row?.value ?? 0) + 1 })
    .returning();

  await logActivity({
    actorId: actor.id,
    action: "testimonials.created",
    entity: "testimonial",
    entityId: created.id,
  });

  revalidateTestimonials();
  return { ok: true, message: "Added." };
}

const idInput = z.object({ testimonialId: z.string().uuid() });

/** Soft delete: `archived_at`, never a removed row. See _AI_CONTEXT/04_DATA.md. */
export async function archiveTestimonialAction(
  input: z.infer<typeof idInput>,
): Promise<ActionResult> {
  const actor = await requirePermission("testimonials.manage");
  const { testimonialId } = idInput.parse(input);

  await db
    .update(testimonials)
    .set({ archivedAt: new Date() })
    .where(eq(testimonials.id, testimonialId));

  await logActivity({
    actorId: actor.id,
    action: "testimonials.archived",
    entity: "testimonial",
    entityId: testimonialId,
  });

  revalidateTestimonials();
  return { ok: true, message: "Deleted." };
}

export async function restoreTestimonialAction(
  input: z.infer<typeof idInput>,
): Promise<ActionResult> {
  const actor = await requirePermission("testimonials.manage");
  const { testimonialId } = idInput.parse(input);

  await db
    .update(testimonials)
    .set({ archivedAt: null })
    .where(eq(testimonials.id, testimonialId));

  await logActivity({
    actorId: actor.id,
    action: "testimonials.restored",
    entity: "testimonial",
    entityId: testimonialId,
  });

  revalidateTestimonials();
  return { ok: true, message: "Restored." };
}

const visibleInput = z.object({ testimonialId: z.string().uuid(), isVisible: z.boolean() });

export async function setTestimonialVisibleAction(
  input: z.infer<typeof visibleInput>,
): Promise<ActionResult> {
  const actor = await requirePermission("testimonials.manage");
  const data = visibleInput.parse(input);

  await db
    .update(testimonials)
    .set({ isVisible: data.isVisible })
    .where(eq(testimonials.id, data.testimonialId));

  await logActivity({
    actorId: actor.id,
    action: data.isVisible ? "testimonials.shown" : "testimonials.hidden",
    entity: "testimonial",
    entityId: data.testimonialId,
  });

  revalidateTestimonials();
  return { ok: true, message: data.isVisible ? "Now showing on the home page." : "Hidden." };
}

const reorderInput = z.object({ testimonialIds: z.array(z.string().uuid()).max(200) });

export async function reorderTestimonialsAction(
  input: z.infer<typeof reorderInput>,
): Promise<ActionResult> {
  const actor = await requirePermission("testimonials.manage");
  const { testimonialIds } = reorderInput.parse(input);

  await db.transaction(async (tx) => {
    for (const [index, id] of testimonialIds.entries()) {
      await tx
        .update(testimonials)
        .set({ position: index + 1 })
        .where(and(eq(testimonials.id, id), isNull(testimonials.archivedAt)));
    }
  });

  await logActivity({
    actorId: actor.id,
    action: "testimonials.reordered",
    entity: "testimonial",
  });

  revalidateTestimonials();
  return { ok: true, message: "Order saved." };
}

/**
 * The one real delete in this file. Nothing else in the schema references
 * `testimonials.id`, so removing it orphans nothing — unlike the
 * content/catalogue/order rows `04_DATA.md` requires soft-deleting. The
 * `isNotNull(archivedAt)` guard means this can only ever remove a row
 * already taken off the home page, never a live one.
 */
export async function purgeTestimonialAction(
  input: z.infer<typeof idInput>,
): Promise<ActionResult> {
  const actor = await requirePermission("testimonials.manage");
  const { testimonialId } = idInput.parse(input);

  const [row] = await db
    .select({ id: testimonials.id })
    .from(testimonials)
    .where(and(eq(testimonials.id, testimonialId), isNotNull(testimonials.archivedAt)));
  if (!row) return { ok: false, message: "That screenshot is not in the deleted list." };

  // eslint-disable-next-line no-restricted-syntax -- see the doc comment above.
  await db
    .delete(testimonials)
    .where(and(eq(testimonials.id, testimonialId), isNotNull(testimonials.archivedAt)));

  await logActivity({
    actorId: actor.id,
    action: "testimonials.purged",
    entity: "testimonial",
    entityId: testimonialId,
  });

  revalidateTestimonials();
  return { ok: true, message: "Removed for good." };
}
