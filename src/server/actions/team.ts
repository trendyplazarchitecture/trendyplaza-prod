"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requirePermission } from "@/server/session";
import { setUserPermissions } from "@/server/team";
import { PERMISSIONS } from "@/lib/permissions";
import type { ActionResult } from "./orders";

const input = z.object({
  // `users.id` is `text`, not `uuid`. Better Auth generates the id and it is
  // not a UUID, so validating one here rejected every real account and threw
  // a ZodError on the team page rather than returning a refusal. Everything
  // else in `src/server/actions` validates uuids because those ids genuinely
  // are `uuid()` columns; this table is the exception, as is
  // `entitlements.source_id`.
  userId: z.string().min(1).max(255),
  permissions: z.array(z.enum(PERMISSIONS)).max(PERMISSIONS.length),
});

/**
 * Granting and revoking, in one call, because the editor sends the whole set.
 *
 * `users.manage` is the permission that gates this, and it is deliberately not
 * implied by anything else: an account that can confirm orders must not be
 * able to give itself the ability to read receipts.
 */
export async function setUserPermissionsAction(
  raw: z.infer<typeof input>,
): Promise<ActionResult> {
  const actor = await requirePermission("users.manage");
  const data = input.parse(raw);

  const result = await setUserPermissions(data.userId, data.permissions, actor.id);

  if (!result.ok) {
    const said = {
      self_lockout:
        "You cannot take team management off your own account. Ask another admin to do it.",
      last_admin:
        "This is the last account that can manage the team. Give someone else that permission first.",
      unknown_user: "That account no longer exists.",
    } as const;
    return { ok: false, message: said[result.error] };
  }

  revalidatePath("/admin/team");

  if (result.granted === 0 && result.revoked === 0) {
    return { ok: true, message: "Nothing changed." };
  }

  const parts = [
    result.granted > 0 ? `${result.granted} granted` : null,
    result.revoked > 0 ? `${result.revoked} removed` : null,
  ].filter(Boolean);

  // Permissions are read from the database on every request, so this lands on
  // their next page load rather than whenever their session happens to expire.
  return { ok: true, message: `${parts.join(", ")}. Live on their next page load.` };
}
