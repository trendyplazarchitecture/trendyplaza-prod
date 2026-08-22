"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requirePermission } from "@/server/session";
import {
  entityPermission,
  purgeFromTrash,
  restoreFromTrash,
  TRASH_ENTITIES,
  type TrashEntity,
} from "@/server/trash";
import type { ActionResult } from "./orders";

export type { ActionResult, TrashEntity };

const idInput = z.object({
  entity: z.enum(TRASH_ENTITIES),
  id: z.string().uuid(),
});

/** Each entity's own admin screen — a trashed row is a filter/section there, not a separate page. */
const REVALIDATE_PATH: Record<TrashEntity, string> = {
  order: "/admin/orders",
  contact_message: "/admin/messages",
  content_university: "/admin/content",
  content_year: "/admin/content",
  content_semester: "/admin/content",
  content_module: "/admin/content",
  content_resource: "/admin/content",
  product: "/admin/products",
  package: "/admin/packages",
  testimonial: "/admin/testimonials",
  promo_code: "/admin/promo-codes",
};

function revalidateTrash(entity: TrashEntity) {
  revalidatePath(REVALIDATE_PATH[entity]);
  revalidatePath("/admin");
}

export async function restoreFromTrashAction(
  input: z.infer<typeof idInput>,
): Promise<ActionResult> {
  const { entity, id } = idInput.parse(input);
  const actor = await requirePermission(entityPermission(entity));

  const result = await restoreFromTrash(entity, id, actor.id);
  revalidateTrash(entity);
  return result.ok ? { ok: true, message: "Restored." } : result;
}

/**
 * Order purge carries one extra gate beyond permission: the caller must
 * type the exact order reference. Checked here too, not only in the
 * dialog, so a stray call can't slip past the UI's typed-confirmation.
 */
const purgeInput = idInput.extend({
  confirmText: z.string().trim().optional(),
});

export async function purgeFromTrashAction(
  input: z.infer<typeof purgeInput>,
): Promise<ActionResult> {
  const { entity, id, confirmText } = purgeInput.parse(input);
  const actor = await requirePermission(entityPermission(entity));

  if (entity === "order") {
    const { getOrder } = await import("@/server/orders");
    const order = await getOrder(id);
    if (!order) return { ok: false, message: "That order no longer exists." };
    if (!confirmText || confirmText.trim() !== order.reference) {
      return { ok: false, message: "Type the order reference exactly to confirm." };
    }
  }

  const result = await purgeFromTrash(entity, id, actor.id);
  revalidateTrash(entity);
  return result.ok ? { ok: true, message: "Deleted for good." } : result;
}

/**
 * Bulk purge for every entity except orders: no per-row confirmation text to
 * check server-side beyond the UI's own typed "DELETE" gate, since there is
 * no single identifying string (like an order reference) worth demanding per
 * row in a batch.
 */
const bulkInput = z.object({
  entity: z.enum(TRASH_ENTITIES),
  ids: z.array(z.string().uuid()).min(1).max(200),
});

export async function purgeManyFromTrashAction(
  input: z.infer<typeof bulkInput>,
): Promise<ActionResult> {
  const { entity, ids } = bulkInput.parse(input);
  const actor = await requirePermission(entityPermission(entity));

  const results = await Promise.all(ids.map((id) => purgeFromTrash(entity, id, actor.id)));
  revalidateTrash(entity);

  const failed = results.filter((r) => !r.ok).length;
  if (failed === 0) return { ok: true, message: "Deleted for good." };
  return { ok: false, message: `${failed} of ${ids.length} did not go through.` };
}

export async function restoreManyFromTrashAction(
  input: z.infer<typeof bulkInput>,
): Promise<ActionResult> {
  const { entity, ids } = bulkInput.parse(input);
  const actor = await requirePermission(entityPermission(entity));

  const results = await Promise.all(ids.map((id) => restoreFromTrash(entity, id, actor.id)));
  revalidateTrash(entity);

  const failed = results.filter((r) => !r.ok).length;
  if (failed === 0) return { ok: true, message: "Restored." };
  return { ok: false, message: `${failed} of ${ids.length} did not go through.` };
}

/**
 * Bulk order purge specifically: the single-row path demands the exact
 * order reference (the highest-stakes single delete this system allows),
 * but typing every reference in a batch is not a realistic ask. The UI's
 * own typed "DELETE" dialog is the gate instead, and it is checked here
 * too so a stray call can't skip it.
 */
const bulkOrderInput = z.object({
  orderIds: z.array(z.string().uuid()).min(1).max(200),
  confirmWord: z.string().trim(),
});

export async function purgeOrdersAction(
  input: z.infer<typeof bulkOrderInput>,
): Promise<ActionResult> {
  const { orderIds, confirmWord } = bulkOrderInput.parse(input);
  if (confirmWord !== "DELETE") {
    return { ok: false, message: 'Type "DELETE" to confirm.' };
  }
  const actor = await requirePermission(entityPermission("order"));

  const results = await Promise.all(orderIds.map((id) => purgeFromTrash("order", id, actor.id)));
  revalidateTrash("order");

  const failed = results.filter((r) => !r.ok).length;
  if (failed === 0) return { ok: true, message: "Deleted for good." };
  return { ok: false, message: `${failed} of ${orderIds.length} did not go through.` };
}
