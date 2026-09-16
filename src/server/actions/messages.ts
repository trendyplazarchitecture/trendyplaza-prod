"use server";

import { revalidatePath } from "next/cache";
import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { contactMessages } from "@/db/schema";
import { requirePermission } from "@/server/session";
import { logActivity } from "@/server/activity";
import { getPendingMessageCount, setMessageStatus } from "@/server/messages";
import type { ActionResult } from "./orders";

const input = z.object({
  id: z.string().uuid(),
  status: z.enum(["new", "read", "answered"]),
});

/**
 * Marks a message read or answered. "Answered" means the admin has actually
 * messaged the person back on WhatsApp or Instagram — nothing here sends
 * anything, since no outbound email exists in this project.
 */
export async function setMessageStatusAction(
  raw: z.infer<typeof input>,
): Promise<ActionResult> {
  await requirePermission("messages.reply");
  const data = input.parse(raw);

  await setMessageStatus(data.id, data.status);

  revalidatePath("/admin/messages");
  return { ok: true, message: "Updated." };
}

const idInput = z.object({ id: z.string().uuid() });

/**
 * Sends a message to the trash — `src/server/trash.ts` handles restore, the
 * 30-day purge and the guarded permanent delete from there.
 */
export async function archiveMessageAction(
  raw: z.infer<typeof idInput>,
): Promise<ActionResult> {
  const actor = await requirePermission("messages.reply");
  const { id } = idInput.parse(raw);

  const [row] = await db
    .update(contactMessages)
    .set({ archivedAt: new Date() })
    .where(and(eq(contactMessages.id, id), isNull(contactMessages.archivedAt)))
    .returning({ id: contactMessages.id });
  if (!row) return { ok: false, message: "That message is already in the trash." };

  await logActivity({
    actorId: actor.id,
    action: "contact_message.archived",
    entity: "contact_message",
    entityId: id,
  });

  revalidatePath("/admin/messages");
  revalidatePath("/admin/trash");
  return { ok: true, message: "Moved to trash." };
}

/** Polled every 30s by MessageNotifier — a deliberately cheap, single-count read. */
export async function getPendingMessageCountAction(): Promise<number> {
  await requirePermission("messages.view");
  return getPendingMessageCount();
}
