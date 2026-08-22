import "server-only";

import { and, count, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { contactMessages } from "@/db/schema";
import { limitByIp } from "./rate-limit";

/**
 * The contact form, and the admin's read of it.
 *
 * No outbound email exists anywhere in this project — every support channel
 * the client actually runs is Instagram, a phone call, or a Baridimob
 * transfer read by hand. "Reply" here means the admin marks a message
 * answered once they have actually messaged the person back on WhatsApp or
 * Instagram, not that this screen sends anything itself.
 */

export type SubmitContactResult = { ok: true } | { ok: false; error: "rate_limited" | "invalid" };

const MAX_LEN = { name: 120, email: 255, phone: 40, subject: 200, body: 4000 };

export async function submitContactMessage(input: {
  name: string;
  email?: string | null;
  phone?: string | null;
  subject?: string | null;
  body: string;
}): Promise<SubmitContactResult> {
  const name = input.name.trim();
  const body = input.body.trim();
  if (!name || !body || name.length > MAX_LEN.name || body.length > MAX_LEN.body) {
    return { ok: false, error: "invalid" };
  }

  // Ten an address per hour. A contact form with no account behind it is the
  // easiest thing on the site to script, and there is nothing here worth
  // more than a generous human rate.
  const perIp = await limitByIp("contact", { limit: 10, windowSeconds: 3600 });
  if (!perIp.ok) return { ok: false, error: "rate_limited" };

  await db.insert(contactMessages).values({
    name,
    email: input.email?.trim().slice(0, MAX_LEN.email) || null,
    phone: input.phone?.trim().slice(0, MAX_LEN.phone) || null,
    subject: input.subject?.trim().slice(0, MAX_LEN.subject) || null,
    body,
  });

  return { ok: true };
}

export type MessageRow = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  subject: string | null;
  body: string;
  status: "new" | "read" | "answered";
  createdAt: Date;
};

/** Newest first, capped: a contact form on a site this size does not need a pager yet. */
export async function listContactMessages(limit = 200): Promise<MessageRow[]> {
  return db
    .select()
    .from(contactMessages)
    .where(isNull(contactMessages.archivedAt))
    .orderBy(desc(contactMessages.createdAt))
    .limit(limit);
}

export async function setMessageStatus(id: string, status: "new" | "read" | "answered") {
  await db.update(contactMessages).set({ status }).where(eq(contactMessages.id, id));
}

/** Just the count, for the notification poller — cheaper than a full getWorkload() every 30s. */
export async function getPendingMessageCount(): Promise<number> {
  const [row] = await db
    .select({ n: count() })
    .from(contactMessages)
    .where(and(eq(contactMessages.status, "new"), isNull(contactMessages.archivedAt)));
  return row?.n ?? 0;
}
