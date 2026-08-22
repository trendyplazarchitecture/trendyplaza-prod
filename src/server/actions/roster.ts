"use server";

import { revalidatePath } from "next/cache";
import { and, eq, isNotNull, isNull, max } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { rosterMembers } from "@/db/schema";
import { requirePermission } from "@/server/session";
import { storeUpload } from "@/server/storage";
import { logActivity } from "@/server/activity";
import type { ActionResult } from "./orders";

export type { ActionResult };

/** "Meet the team", on the About page. Name and photo, role in three languages. */

const REVALIDATE_PATHS = ["/admin/roster", "/about"] as const;

function revalidateRoster() {
  for (const path of REVALIDATE_PATHS) revalidatePath(path);
}

const saveInput = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(2).max(120),
  roleEn: z.string().trim().min(1).max(120),
  roleAr: z.string().trim().max(120).nullable(),
  roleFr: z.string().trim().max(120).nullable(),
});

export async function saveRosterMemberAction(formData: FormData): Promise<ActionResult> {
  const actor = await requirePermission("roster.manage");

  const field = (name: string) => {
    const value = formData.get(name);
    const trimmed = typeof value === "string" ? value.trim() : "";
    return trimmed || null;
  };

  const parsed = saveInput.safeParse({
    id: (formData.get("id") as string) || undefined,
    name: formData.get("name"),
    roleEn: field("roleEn"),
    roleAr: field("roleAr"),
    roleFr: field("roleFr"),
  });
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "A name and a role are needed." };
  }
  const data = parsed.data;

  const file = formData.get("image");
  let imagePath: string | undefined;
  if (file instanceof File && file.size > 0) {
    const stored = await storeUpload(
      "roster",
      { buffer: Buffer.from(await file.arrayBuffer()) },
      { maxBytes: 12 * 1024 * 1024, convertImages: true },
    );
    if (!stored.ok) {
      return {
        ok: false,
        message:
          stored.error === "too_large"
            ? "That photo is over 12 MB."
            : "That file is not an image this can read (JPEG, PNG or WebP).",
      };
    }
    imagePath = stored.relativePath;
  } else if (!data.id) {
    return { ok: false, message: "A photo is needed." };
  }

  const values = { name: data.name, roleEn: data.roleEn, roleAr: data.roleAr, roleFr: data.roleFr };

  let id = data.id;
  if (id) {
    await db
      .update(rosterMembers)
      .set(imagePath ? { ...values, imagePath } : values)
      .where(eq(rosterMembers.id, id));
  } else {
    const [row] = await db.select({ value: max(rosterMembers.position) }).from(rosterMembers);
    const [created] = await db
      .insert(rosterMembers)
      .values({ ...values, imagePath: imagePath!, position: (row?.value ?? 0) + 1 })
      .returning();
    id = created.id;
  }

  await logActivity({
    actorId: actor.id,
    action: data.id ? "roster.updated" : "roster.created",
    entity: "roster_member",
    entityId: id,
    after: { name: data.name },
  });

  revalidateRoster();
  return { ok: true, message: "Saved." };
}

const idInput = z.object({ memberId: z.string().uuid() });

/** Soft delete: `archived_at`, never a removed row. See _AI_CONTEXT/04_DATA.md. */
export async function archiveRosterMemberAction(
  input: z.infer<typeof idInput>,
): Promise<ActionResult> {
  const actor = await requirePermission("roster.manage");
  const { memberId } = idInput.parse(input);

  await db.update(rosterMembers).set({ archivedAt: new Date() }).where(eq(rosterMembers.id, memberId));

  await logActivity({
    actorId: actor.id,
    action: "roster.archived",
    entity: "roster_member",
    entityId: memberId,
  });

  revalidateRoster();
  return { ok: true, message: "Deleted." };
}

export async function restoreRosterMemberAction(
  input: z.infer<typeof idInput>,
): Promise<ActionResult> {
  const actor = await requirePermission("roster.manage");
  const { memberId } = idInput.parse(input);

  await db.update(rosterMembers).set({ archivedAt: null }).where(eq(rosterMembers.id, memberId));

  await logActivity({
    actorId: actor.id,
    action: "roster.restored",
    entity: "roster_member",
    entityId: memberId,
  });

  revalidateRoster();
  return { ok: true, message: "Restored." };
}

const visibleInput = z.object({ memberId: z.string().uuid(), isVisible: z.boolean() });

export async function setRosterMemberVisibleAction(
  input: z.infer<typeof visibleInput>,
): Promise<ActionResult> {
  const actor = await requirePermission("roster.manage");
  const data = visibleInput.parse(input);

  await db
    .update(rosterMembers)
    .set({ isVisible: data.isVisible })
    .where(eq(rosterMembers.id, data.memberId));

  await logActivity({
    actorId: actor.id,
    action: data.isVisible ? "roster.shown" : "roster.hidden",
    entity: "roster_member",
    entityId: data.memberId,
  });

  revalidateRoster();
  return { ok: true, message: data.isVisible ? "Now showing on the about page." : "Hidden." };
}

const reorderInput = z.object({ memberIds: z.array(z.string().uuid()).max(200) });

export async function reorderRosterMembersAction(
  input: z.infer<typeof reorderInput>,
): Promise<ActionResult> {
  const actor = await requirePermission("roster.manage");
  const { memberIds } = reorderInput.parse(input);

  await db.transaction(async (tx) => {
    for (const [index, id] of memberIds.entries()) {
      await tx
        .update(rosterMembers)
        .set({ position: index + 1 })
        .where(and(eq(rosterMembers.id, id), isNull(rosterMembers.archivedAt)));
    }
  });

  await logActivity({
    actorId: actor.id,
    action: "roster.reordered",
    entity: "roster_member",
  });

  revalidateRoster();
  return { ok: true, message: "Order saved." };
}

/**
 * The one real delete in this file, and it stays narrow on purpose: nothing
 * else in the schema references `roster_members.id` (no order, entitlement
 * or activity row points at one), so removing it orphans nothing — unlike
 * the content/catalogue/order rows `04_DATA.md` requires soft-deleting. The
 * `isNotNull(archivedAt)` guard means this can only ever remove a row that
 * was already taken off the about page, never a live one.
 */
export async function purgeRosterMemberAction(
  input: z.infer<typeof idInput>,
): Promise<ActionResult> {
  const actor = await requirePermission("roster.manage");
  const { memberId } = idInput.parse(input);

  const [row] = await db
    .select({ id: rosterMembers.id, name: rosterMembers.name })
    .from(rosterMembers)
    .where(and(eq(rosterMembers.id, memberId), isNotNull(rosterMembers.archivedAt)));
  if (!row) return { ok: false, message: "That member is not in the deleted list." };

  // eslint-disable-next-line no-restricted-syntax -- see the doc comment above.
  await db
    .delete(rosterMembers)
    .where(and(eq(rosterMembers.id, memberId), isNotNull(rosterMembers.archivedAt)));

  await logActivity({
    actorId: actor.id,
    action: "roster.purged",
    entity: "roster_member",
    entityId: memberId,
    before: { name: row.name },
  });

  revalidateRoster();
  return { ok: true, message: "Removed for good." };
}
