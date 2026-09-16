"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePermission, requireUser } from "@/server/session";
import {
  requestStaffAccess,
  reviewStaffAccessRequest,
} from "@/server/access-requests";
import { PERMISSIONS, type Permission } from "@/lib/permissions";
import type { ActionResult } from "./orders";

const requestInput = z.object({
  permission: z.enum(PERMISSIONS),
  note: z.string().max(500).optional(),
});

export async function requestStaffAccessAction(
  input: z.infer<typeof requestInput>,
): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = requestInput.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Invalid request payload." };
  }

  const res = await requestStaffAccess({
    userId: user.id,
    permission: parsed.data.permission as Permission,
    note: parsed.data.note,
  });

  if (res.ok) {
    revalidatePath("/admin");
    revalidatePath("/admin/team");
  }

  return res;
}

const reviewInput = z.object({
  requestId: z.string().uuid(),
  approved: z.boolean(),
});

export async function reviewStaffAccessRequestAction(
  input: z.infer<typeof reviewInput>,
): Promise<ActionResult> {
  const actor = await requirePermission("users.manage");
  const parsed = reviewInput.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Invalid review parameters." };
  }

  const res = await reviewStaffAccessRequest({
    requestId: parsed.data.requestId,
    approved: parsed.data.approved,
    actorId: actor.id,
  });

  if (res.ok) {
    revalidatePath("/admin/team");
    revalidatePath("/admin");
  }

  return res;
}
