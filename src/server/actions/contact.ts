"use server";

import { z } from "zod";

import { submitContactMessage } from "@/server/messages";
import { normalisePhone } from "@/lib/phone";

const input = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().toLowerCase().email().max(255).optional().or(z.literal("")),
  phone: z.string().trim().max(40).optional(),
  subject: z.string().trim().max(200).optional(),
  body: z.string().trim().min(1).max(4000),
  // Never rendered, never labelled, off-screen rather than merely hidden so a
  // screen reader does not read it out either. A human never fills this in; a
  // script that fills every field it finds does. Caught silently, not with a
  // rejection that tells the script what tripped it.
  website: z.string().max(200).optional(),
});

export type ContactActionResult =
  | { ok: true }
  | { ok: false; reason: "rate_limited" | "invalid" | "no_contact_method" };

/**
 * No session behind this — anyone reaching `/contact` can send one. That is
 * the point of the page, and it is also the whole reason this action does
 * more validating than most: every other public write in this project (the
 * receipt upload, code redemption) is at least behind a signed-in account,
 * which is its own throttle. This one is not.
 *
 * `submitContactMessage` rate limits by address; everything here is the
 * shape of the input, not the volume of it.
 */
export async function submitContactMessageAction(
  raw: z.infer<typeof input>,
): Promise<ContactActionResult> {
  const parsed = input.safeParse(raw);
  if (!parsed.success) return { ok: false, reason: "invalid" };

  // The honeypot caught something. Reported as success: telling a script
  // which field gave it away only teaches it to stop filling that one in.
  if (parsed.data.website) return { ok: true };

  const email = parsed.data.email || null;
  const rawPhone = parsed.data.phone?.trim();

  // A message with no way to answer it is not a lead, it is a dead end for
  // whoever reads /admin/messages. At least one real channel is required,
  // matching what the client actually asked for.
  if (!email && !rawPhone) return { ok: false, reason: "no_contact_method" };

  // Given but not a real Algerian mobile number: refused rather than stored
  // as-is, the same standard checkout holds phone numbers to.
  let phone: string | null = null;
  if (rawPhone) {
    phone = normalisePhone(rawPhone);
    if (!phone) return { ok: false, reason: "invalid" };
  }

  const result = await submitContactMessage({
    name: parsed.data.name,
    email,
    phone,
    subject: parsed.data.subject || null,
    body: parsed.data.body,
  });

  if (!result.ok) return { ok: false, reason: result.error };
  return { ok: true };
}
