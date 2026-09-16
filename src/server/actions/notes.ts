"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { userNotes } from "@/db/schema";
import { requirePermission } from "@/server/session";
import { logActivity } from "@/server/activity";
import { subjectExists } from "@/server/notes";
import type { ActionResult } from "./orders";

export type { ActionResult };

/**
 * Notes are written by whoever is working the queue, so the permission is the
 * one that already means "you handle this kind of thing": orders for an order,
 * students for a student. There is no separate notes permission, because an
 * account that can confirm an order and cannot record why the customer did not
 * answer is an account that writes on paper instead.
 */
const noteInput = z.object({
  subjectType: z.enum(["student", "order"]),
  subjectId: z.string().min(1).max(255),
  body: z.string().trim().min(1).max(2000),
});

export async function addNoteAction(
  input: z.infer<typeof noteInput>,
): Promise<ActionResult> {
  const parsed = noteInput.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Write something first, and keep it under 2000 characters." };
  }
  const data = parsed.data;

  const actor = await requirePermission(
    data.subjectType === "order" ? "orders.edit" : "students.manage",
  );

  // No foreign key on `subject_id`, so this is the only thing standing between
  // a posted id and a note attached to nothing.
  if (!(await subjectExists(data.subjectType, data.subjectId))) {
    return { ok: false, message: "That record no longer exists." };
  }

  await db.insert(userNotes).values({
    subjectType: data.subjectType,
    subjectId: data.subjectId,
    authorId: actor.id,
    body: data.body,
  });

  await logActivity({
    actorId: actor.id,
    action: "notes.added",
    entity: data.subjectType,
    entityId: data.subjectId,
  });

  revalidatePath(
    data.subjectType === "order"
      ? `/admin/orders/${data.subjectId}`
      : `/admin/students/${data.subjectId}`,
  );
  return { ok: true, message: "Note added." };
}

const archiveInput = z.object({
  noteId: z.string().uuid(),
  subjectType: z.enum(["student", "order"]),
  subjectId: z.string().min(1).max(255),
});

/**
 * Archived, never removed.
 *
 * A note is a record of what someone was told, and the day it matters is the
 * day of a dispute about an order. Taking it off the panel is enough.
 */
export async function archiveNoteAction(
  input: z.infer<typeof archiveInput>,
): Promise<ActionResult> {
  const data = archiveInput.parse(input);
  const actor = await requirePermission(
    data.subjectType === "order" ? "orders.edit" : "students.manage",
  );

  await db
    .update(userNotes)
    .set({ archivedAt: new Date() })
    .where(and(eq(userNotes.id, data.noteId), eq(userNotes.subjectId, data.subjectId)));

  await logActivity({
    actorId: actor.id,
    action: "notes.archived",
    entity: data.subjectType,
    entityId: data.subjectId,
  });

  revalidatePath(
    data.subjectType === "order"
      ? `/admin/orders/${data.subjectId}`
      : `/admin/students/${data.subjectId}`,
  );
  return { ok: true, message: "Note removed from the panel." };
}
