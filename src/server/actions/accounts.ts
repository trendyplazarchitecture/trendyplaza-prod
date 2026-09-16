"use server";

import { createHash, randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { accountInvites, sessions, userPermissions, userProfiles, users } from "@/db/schema";
import { requirePermission } from "@/server/session";
import { logActivity } from "@/server/activity";
import { PERMISSIONS } from "@/lib/permissions";
import type { ActionResult } from "./orders";

export type { ActionResult };

/**
 * Creating, editing and deactivating an account.
 *
 * Decision D2, settled: **no screen in this application handles someone else's
 * password.** An admin creates the account and gets a single-use link; the
 * person sets their own password. The admin never sees a credential, so there
 * is nothing to travel by WhatsApp and nothing that goes un-rotated.
 *
 * The token is generated here, hashed, and the hash is what is stored. The
 * plain token is returned to the caller exactly once, for the admin to send. A
 * readable token in the table would mean a leaked backup is a takeover of
 * every account with an invite outstanding.
 */

const INVITE_TTL_HOURS = 72;

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export type InviteResult =
  | { ok: true; message: string; setupPath: string }
  | { ok: false; message: string };

const createInput = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(200),
  permissions: z.array(z.enum(PERMISSIONS)).max(PERMISSIONS.length).optional(),
});

export async function createAccountAction(
  input: z.infer<typeof createInput>,
): Promise<InviteResult> {
  const actor = await requirePermission("users.manage");

  const parsed = createInput.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "A name and a valid email address are needed." };
  }
  const data = parsed.data;
  const email = data.email.toLowerCase();

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (existing) {
    return {
      ok: false,
      message: "That email already has an account. Give it a preset instead of creating a second one.",
    };
  }

  const token = randomBytes(32).toString("base64url");
  const userId = crypto.randomUUID();

  await db.transaction(async (tx) => {
    await tx.insert(users).values({
      id: userId,
      name: data.name,
      email,
      // Not verified: the setup link is what proves they reach the address.
      emailVerified: false,
    });

    await tx.insert(userProfiles).values({
      userId,
      fullName: data.name,
      // Staff are active on creation; a student created this way still has to
      // be granted access separately.
      state: "active",
    });

    if (data.permissions?.length) {
      await tx
        .insert(userPermissions)
        .values(
          data.permissions.map((permission) => ({
            userId,
            permission,
            grantedBy: actor.id,
          })),
        );
    }

    await tx.insert(accountInvites).values({
      userId,
      tokenHash: hashToken(token),
      createdBy: actor.id,
      expiresAt: new Date(Date.now() + INVITE_TTL_HOURS * 60 * 60 * 1000),
    });
  });

  await logActivity({
    actorId: actor.id,
    action: "users.created",
    entity: "user",
    entityId: userId,
    after: { email, permissions: data.permissions?.length ?? 0 },
  });

  revalidatePath("/admin/team");
  return {
    ok: true,
    // Returned once. Nothing stores it, so if the admin loses it they reissue.
    setupPath: `/set-password?token=${token}`,
    message: `Account created. Send them the link; it expires in ${INVITE_TTL_HOURS} hours.`,
  };
}

const inviteInput = z.object({ userId: z.string().min(1).max(255) });

/** A fresh link for someone who lost theirs, or whose invite expired. */
export async function reissueInviteAction(
  input: z.infer<typeof inviteInput>,
): Promise<InviteResult> {
  const actor = await requirePermission("users.manage");
  const { userId } = inviteInput.parse(input);

  const [person] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!person) return { ok: false, message: "That account no longer exists." };

  const token = randomBytes(32).toString("base64url");

  await db.transaction(async (tx) => {
    // Any outstanding link stops working. Two live invites for one account is
    // two ways in, and only one of them is the one the admin just sent.
    await tx
      .update(accountInvites)
      .set({ usedAt: new Date() })
      .where(and(eq(accountInvites.userId, userId), isNull(accountInvites.usedAt)));

    await tx.insert(accountInvites).values({
      userId,
      tokenHash: hashToken(token),
      createdBy: actor.id,
      expiresAt: new Date(Date.now() + INVITE_TTL_HOURS * 60 * 60 * 1000),
    });
  });

  await logActivity({
    actorId: actor.id,
    action: "users.invite_reissued",
    entity: "user",
    entityId: userId,
  });

  revalidatePath("/admin/team");
  return {
    ok: true,
    setupPath: `/set-password?token=${token}`,
    message: "New link ready. The old one no longer works.",
  };
}

const editInput = z.object({
  userId: z.string().min(1).max(255),
  name: z.string().trim().min(2).max(120),
});

/**
 * Renaming. The email is deliberately not editable: it is the sign-in
 * identifier and the Better Auth account key, and changing it from an admin
 * screen locks someone out of their own account with no way to tell them.
 */
export async function updateAccountAction(
  input: z.infer<typeof editInput>,
): Promise<ActionResult> {
  const actor = await requirePermission("users.manage");
  const data = editInput.parse(input);

  await db.update(users).set({ name: data.name }).where(eq(users.id, data.userId));
  await db
    .update(userProfiles)
    .set({ fullName: data.name })
    .where(eq(userProfiles.userId, data.userId));

  await logActivity({
    actorId: actor.id,
    action: "users.updated",
    entity: "user",
    entityId: data.userId,
    after: { name: data.name },
  });

  revalidatePath("/admin/team");
  return { ok: true, message: "Saved." };
}

const stateInput = z.object({
  userId: z.string().min(1).max(255),
  state: z.enum(["active", "suspended"]),
});

/**
 * Deactivating, which is what "delete" means here.
 *
 * The account holds orders, entitlements and an activity trail, so the row
 * stays. `suspended` is already refused by `requireUser` and by the streaming
 * route, and there is a test for the latter.
 *
 * An admin cannot suspend themselves: locking yourself out of the admin with
 * your own button is a support call, and the guard costs one comparison.
 */
export async function setAccountStateAction(
  input: z.infer<typeof stateInput>,
): Promise<ActionResult> {
  const actor = await requirePermission("users.manage");
  const data = stateInput.parse(input);

  if (data.userId === actor.id && data.state === "suspended") {
    return {
      ok: false,
      message: "You cannot deactivate your own account. Ask another admin.",
    };
  }

  await db
    .update(userProfiles)
    .set({ state: data.state })
    .where(eq(userProfiles.userId, data.userId));

  if (data.state === "suspended") {
    // Invalidate all active sessions immediately so the user is logged out
    await db.delete(sessions).where(eq(sessions.userId, data.userId));
  }

  await logActivity({
    actorId: actor.id,
    action: data.state === "suspended" ? "users.deactivated" : "users.reactivated",
    entity: "user",
    entityId: data.userId,
  });

  revalidatePath("/admin/team");
  revalidatePath("/", "layout");
  return {
    ok: true,
    message:
      data.state === "suspended"
        ? "Deactivated. They cannot sign in, and active sessions have been revoked."
        : "Reactivated.",
  };
}

const userActionInput = z.object({
  userId: z.string().min(1).max(255),
});

/**
 * Moves user to trash (soft delete).
 * Sets state to suspended, records archivedAt and archivedBy,
 * revokes all active sessions and staff permissions immediately.
 * User will be scheduled for permanent cleanup after 30 days.
 */
export async function archiveUserAction(
  input: z.infer<typeof userActionInput>,
): Promise<ActionResult> {
  const actor = await requirePermission("users.manage");
  const data = userActionInput.parse(input);

  if (data.userId === actor.id) {
    return {
      ok: false,
      message: "You cannot delete your own account.",
    };
  }

  await db
    .update(userProfiles)
    .set({
      state: "suspended",
      archivedAt: new Date(),
      archivedBy: actor.id,
    })
    .where(eq(userProfiles.userId, data.userId));

  // Invalidate all active browser sessions immediately so they are logged out
  await db.delete(sessions).where(eq(sessions.userId, data.userId));

  // Revoke staff permissions immediately
  await db.delete(userPermissions).where(eq(userPermissions.userId, data.userId));

  await logActivity({
    actorId: actor.id,
    action: "users.archived",
    entity: "user",
    entityId: data.userId,
  });

  revalidatePath("/admin/team");
  revalidatePath("/", "layout");
  return {
    ok: true,
    message: "Moved to trash. Account deactivated, sessions revoked, and scheduled for permanent deletion after 30 days.",
  };
}

/**
 * Restores user from trash.
 */
export async function restoreUserAction(
  input: z.infer<typeof userActionInput>,
): Promise<ActionResult> {
  const actor = await requirePermission("users.manage");
  const data = userActionInput.parse(input);

  await db
    .update(userProfiles)
    .set({
      state: "active",
      archivedAt: null,
      archivedBy: null,
    })
    .where(eq(userProfiles.userId, data.userId));

  await logActivity({
    actorId: actor.id,
    action: "users.restored",
    entity: "user",
    entityId: data.userId,
  });

  revalidatePath("/admin/team");
  return {
    ok: true,
    message: "Account restored successfully.",
  };
}

