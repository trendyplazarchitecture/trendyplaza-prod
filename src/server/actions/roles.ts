"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { rolePresets } from "@/db/schema";
import { requirePermission } from "@/server/session";
import { logActivity } from "@/server/activity";
import { PERMISSIONS, type Permission } from "@/lib/permissions";
import type { ActionResult } from "./orders";

const ALLOWED_COLORS = [
  "purple",
  "blue",
  "emerald",
  "amber",
  "rose",
  "indigo",
  "cyan",
  "teal",
  "orange",
  "pink",
] as const;

function generateSlug(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return base || `preset_${Date.now()}`;
}

const createInput = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(60),
  description: z.string().trim().max(300).optional(),
  color: z.enum(ALLOWED_COLORS).default("blue"),
  permissions: z.array(z.string()).min(1, "Select at least 1 permission"),
});

export async function createRolePresetAction(
  raw: z.infer<typeof createInput>,
): Promise<ActionResult> {
  const actor = await requirePermission("users.manage");
  const parsed = createInput.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const { name, description, color, permissions } = parsed.data;
  const validPermissions = permissions.filter((p) =>
    PERMISSIONS.includes(p as Permission),
  );

  if (validPermissions.length === 0) {
    return { ok: false, message: "At least one valid permission is required." };
  }

  let slug = generateSlug(name);
  const [existing] = await db
    .select({ id: rolePresets.id })
    .from(rolePresets)
    .where(eq(rolePresets.slug, slug))
    .limit(1);

  if (existing) {
    slug = `${slug}_${Date.now().toString().slice(-4)}`;
  }

  try {
    const [row] = await db
      .insert(rolePresets)
      .values({
        slug,
        name,
        description: description || null,
        color,
        permissions: validPermissions,
        isSystem: false,
      })
      .returning();

    await logActivity({
      actorId: actor.id,
      action: "roles.created",
      entity: "role_preset",
      entityId: row.id,
      after: { name, slug, permissions: validPermissions },
    });

    revalidatePath("/admin/team");
    return { ok: true, message: `Role preset "${name}" created.` };
  } catch (error) {
    console.error("Failed to create role preset:", error);
    return { ok: false, message: "Could not create role preset." };
  }
}

const updateInput = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(60),
  description: z.string().trim().max(300).optional(),
  color: z.enum(ALLOWED_COLORS).default("blue"),
  permissions: z.array(z.string()).min(1, "Select at least 1 permission"),
});

export async function updateRolePresetAction(
  raw: z.infer<typeof updateInput>,
): Promise<ActionResult> {
  const actor = await requirePermission("users.manage");
  const parsed = updateInput.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const { id, name, description, color, permissions } = parsed.data;
  const validPermissions = permissions.filter((p) =>
    PERMISSIONS.includes(p as Permission),
  );

  if (validPermissions.length === 0) {
    return { ok: false, message: "At least one valid permission is required." };
  }

  try {
    const [existing] = await db
      .select()
      .from(rolePresets)
      .where(eq(rolePresets.id, id))
      .limit(1);

    if (!existing) {
      return { ok: false, message: "Role preset not found." };
    }

    const [updated] = await db
      .update(rolePresets)
      .set({
        name,
        description: description || null,
        color,
        permissions: validPermissions,
        updatedAt: new Date(),
      })
      .where(eq(rolePresets.id, id))
      .returning();

    await logActivity({
      actorId: actor.id,
      action: "roles.updated",
      entity: "role_preset",
      entityId: id,
      before: { name: existing.name, permissions: existing.permissions },
      after: { name, permissions: validPermissions },
    });

    revalidatePath("/admin/team");
    return { ok: true, message: `Role preset "${name}" updated.` };
  } catch (error) {
    console.error("Failed to update role preset:", error);
    return { ok: false, message: "Could not update role preset." };
  }
}

const deleteInput = z.object({
  id: z.string().uuid(),
});

export async function deleteRolePresetAction(
  raw: z.infer<typeof deleteInput>,
): Promise<ActionResult> {
  const actor = await requirePermission("users.manage");
  const parsed = deleteInput.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, message: "Invalid role ID." };
  }

  try {
    const [existing] = await db
      .select()
      .from(rolePresets)
      .where(eq(rolePresets.id, parsed.data.id))
      .limit(1);

    if (!existing) {
      return { ok: false, message: "Role preset not found." };
    }

    if (existing.isSystem) {
      return {
        ok: false,
        message: "System role presets cannot be deleted. You can edit its permissions instead.",
      };
    }

    await db.delete(rolePresets).where(eq(rolePresets.id, parsed.data.id));

    await logActivity({
      actorId: actor.id,
      action: "roles.deleted",
      entity: "role_preset",
      entityId: parsed.data.id,
      before: { name: existing.name, slug: existing.slug },
    });

    revalidatePath("/admin/team");
    return { ok: true, message: `Role preset "${existing.name}" deleted.` };
  } catch (error) {
    console.error("Failed to delete role preset:", error);
    return { ok: false, message: "Could not delete role preset." };
  }
}
