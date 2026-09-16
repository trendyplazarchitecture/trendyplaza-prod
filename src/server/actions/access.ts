"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { userProfiles } from "@/db/schema";
import { requirePermission } from "@/server/session";
import { createCodeBatch, createSingleCode, lookupCode, voidCode } from "@/server/codes";
import { approveAccessRequest, rejectAccessRequest } from "@/server/access-requests";
import { extendEntitlement, setEntitlementStatus } from "@/server/entitlements";
import { logActivity } from "@/server/activity";
import type { ActionResult } from "./orders";

export type { ActionResult };

/* -------------------------------------------------------------------------
 * Access codes
 * ---------------------------------------------------------------------- */

const batchInput = z.object({
  label: z.string().trim().min(3).max(120),
  packageId: z.string().uuid(),
  prefix: z.string().trim().min(1).max(8),
  quantity: z.coerce.number().int().min(1).max(2000),
  durationDays: z.coerce.number().int().min(1).max(3650).nullable(),
});

export async function createBatchAction(
  input: z.infer<typeof batchInput>,
): Promise<ActionResult & { batchId?: string }> {
  const actor = await requirePermission("codes.generate");
  const data = batchInput.parse(input);

  const { batch, codes } = await createCodeBatch(data, actor.id);

  revalidatePath("/admin/codes");
  revalidatePath("/admin");
  return {
    ok: true,
    message: `${codes.length} codes generated. Export them before the cards go to print.`,
    batchId: batch.id,
  };
}

const singleInput = z.object({
  packageId: z.string().uuid(),
  prefix: z.string().trim().max(8).optional(),
  durationDays: z.coerce.number().int().min(1).max(3650).nullable(),
  orderId: z.string().uuid().nullable().optional(),
});

export async function createSingleCodeAction(
  input: z.infer<typeof singleInput>,
): Promise<ActionResult> {
  const actor = await requirePermission("codes.generate");
  const data = singleInput.parse(input);

  const row = await createSingleCode(data, actor.id);

  revalidatePath("/admin/codes");
  return { ok: true, message: `Code ${row.code} created.` };
}

const voidInput = z.object({
  codeId: z.string().uuid(),
  reason: z.string().trim().min(3).max(200),
});

export async function voidCodeAction(
  input: z.infer<typeof voidInput>,
): Promise<ActionResult> {
  const actor = await requirePermission("codes.revoke");
  const data = voidInput.parse(input);

  const row = await voidCode(data.codeId, data.reason, actor.id);
  if (!row) return { ok: false, message: "That code was already void." };

  revalidatePath("/admin/codes");
  return { ok: true, message: "Voided. It can no longer be redeemed." };
}

/* -------------------------------------------------------------------------
 * Access requests, the receipt path
 * ---------------------------------------------------------------------- */

const approveInput = z.object({
  requestId: z.string().uuid(),
  durationDays: z.coerce.number().int().min(1).max(3650).nullable().optional(),
});

export async function approveRequestAction(
  input: z.infer<typeof approveInput>,
): Promise<ActionResult> {
  const actor = await requirePermission("students.manage");
  const data = approveInput.parse(input);

  const entitlement = await approveAccessRequest(
    data.requestId,
    actor.id,
    data.durationDays ?? undefined,
  );

  if (!entitlement) {
    return {
      ok: false,
      message: "Someone already reviewed this one. Refresh to see the decision.",
    };
  }

  revalidatePath("/admin/requests");
  revalidatePath("/admin");
  return { ok: true, message: "Approved. Their courses are open now." };
}

const rejectInput = z.object({
  requestId: z.string().uuid(),
  reasonEn: z.string().trim().min(3).max(300),
});

export async function rejectRequestAction(
  input: z.infer<typeof rejectInput>,
): Promise<ActionResult> {
  const actor = await requirePermission("students.manage");
  const data = rejectInput.parse(input);

  // The student reads this, so the same words go into all three columns
  // until an admin translates them. A blank reason is worse than an English
  // one on a French screen.
  const row = await rejectAccessRequest(
    data.requestId,
    { fr: data.reasonEn, ar: data.reasonEn },
    actor.id,
  );

  if (!row) {
    return { ok: false, message: "Someone already reviewed this one." };
  }

  revalidatePath("/admin/requests");
  revalidatePath("/admin");
  return { ok: true, message: "Rejected. The student can see the reason." };
}

/* -------------------------------------------------------------------------
 * Entitlements
 * ---------------------------------------------------------------------- */

const statusInput = z.object({
  entitlementId: z.string().uuid(),
  status: z.enum(["active", "paused", "revoked"]),
});

export async function setEntitlementStatusAction(
  input: z.infer<typeof statusInput>,
): Promise<ActionResult> {
  const actor = await requirePermission("students.manage");
  const data = statusInput.parse(input);

  await setEntitlementStatus(data.entitlementId, data.status, actor.id);
  revalidatePath("/admin/students");

  const said = {
    active: "Access reopened.",
    // Every LMS page re-checks, so this takes effect on their next page load
    // rather than whenever a session happens to expire.
    paused: "Paused. Their next page load is blocked.",
    revoked: "Revoked. Their next page load is blocked.",
  } as const;
  return { ok: true, message: said[data.status] };
}

const extendInput = z.object({
  entitlementId: z.string().uuid(),
  days: z.coerce.number().int().min(1).max(3650),
});

export async function extendEntitlementAction(
  input: z.infer<typeof extendInput>,
): Promise<ActionResult> {
  const actor = await requirePermission("students.manage");
  const data = extendInput.parse(input);

  await extendEntitlement(data.entitlementId, data.days, actor.id);
  revalidatePath("/admin/students");
  return { ok: true, message: `Extended by ${data.days} days.` };
}

/* -------------------------------------------------------------------------
 * Account state
 * ---------------------------------------------------------------------- */

const studentStateInput = z.object({ userId: z.string().min(1).max(255) });

/**
 * Deleting a student, which here means what it means everywhere else in this
 * project: `user_profiles.state = 'suspended'`, never a row removal. The
 * account holds orders, entitlements and an activity trail, and `requireUser`
 * already refuses a suspended account at every LMS page and the streaming
 * route. Gated on `students.delete`, separate from `students.manage`, since
 * pausing an entitlement and locking someone out of their account entirely
 * are different levels of consequence.
 */
export async function deleteStudentAction(
  input: z.infer<typeof studentStateInput>,
): Promise<ActionResult> {
  const actor = await requirePermission("students.delete");
  const { userId } = studentStateInput.parse(input);

  await db.update(userProfiles).set({ state: "suspended" }).where(eq(userProfiles.userId, userId));

  await logActivity({
    actorId: actor.id,
    action: "students.deleted",
    entity: "user",
    entityId: userId,
  });

  revalidatePath("/admin/students");
  return { ok: true, message: "Deleted. They cannot sign in, and nothing they touched was removed." };
}

export async function restoreStudentAction(
  input: z.infer<typeof studentStateInput>,
): Promise<ActionResult> {
  const actor = await requirePermission("students.delete");
  const { userId } = studentStateInput.parse(input);

  await db.update(userProfiles).set({ state: "active" }).where(eq(userProfiles.userId, userId));

  await logActivity({
    actorId: actor.id,
    action: "students.restored",
    entity: "user",
    entityId: userId,
  });

  revalidatePath("/admin/students");
  return { ok: true, message: "Restored. They can sign in again." };
}

/* -------------------------------------------------------------------------
 * Support desk
 * ---------------------------------------------------------------------- */

const lookupInput = z.object({ code: z.string().trim().min(1).max(64) });

/**
 * Reads `codes.generate` rather than a lookup-specific permission: seeing who
 * holds a card is the same class of information as issuing one, and adding a
 * sixteenth permission for one screen makes the permission editor worse.
 */
export async function lookupCodeAction(input: z.infer<typeof lookupInput>) {
  await requirePermission("codes.generate");
  const { code } = lookupInput.parse(input);
  return lookupCode(code);
}
