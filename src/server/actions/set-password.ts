"use server";

import { createHash } from "node:crypto";
import { and, eq, gt, isNull } from "drizzle-orm";
import { hashPassword } from "better-auth/crypto";
import { z } from "zod";

import { db } from "@/db";
import { accountInvites, accounts, users } from "@/db/schema";
import { logActivity } from "@/server/activity";
import { rateLimit } from "@/server/rate-limit";
import type { ActionResult } from "./orders";

/**
 * The other half of D2: the invited person sets their own password.
 *
 * This is the one place a password is written, and it is written by its owner.
 * No admin screen reaches it.
 *
 * Unauthenticated by necessity — the whole point is that the person cannot
 * sign in yet — so it is rate limited and the token is the only credential.
 * The token is compared by hash: the table stores a hash, so a leaked backup
 * yields nothing usable.
 */
const input = z.object({
  token: z.string().min(20).max(200),
  password: z.string().min(10).max(200),
});

export async function setPasswordAction(
  raw: z.infer<typeof input>,
): Promise<ActionResult> {
  const parsed = input.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, message: "Pick a password of at least 10 characters." };
  }
  const data = parsed.data;

  // Keyed on the token, so guessing is throttled per token rather than being
  // one shared bucket somebody else can exhaust for a legitimate user.
  const limited = rateLimit(`set-password:${data.token.slice(0, 16)}`, {
    limit: 5,
    windowSeconds: 900,
  });
  if (!limited.ok) {
    return { ok: false, message: "Too many attempts. Wait fifteen minutes." };
  }

  const tokenHash = createHash("sha256").update(data.token).digest("hex");

  const [invite] = await db
    .select()
    .from(accountInvites)
    .where(
      and(
        eq(accountInvites.tokenHash, tokenHash),
        isNull(accountInvites.usedAt),
        gt(accountInvites.expiresAt, new Date()),
      ),
    )
    .limit(1);

  // One message for expired, used and never-existed. Distinguishing them tells
  // whoever is guessing which tokens were real.
  if (!invite) {
    return {
      ok: false,
      message: "This link is not valid any more. Ask for a new one.",
    };
  }

  const hashed = await hashPassword(data.password);

  await db.transaction(async (tx) => {
    const [existing] = await tx
      .select({ id: accounts.id })
      .from(accounts)
      .where(and(eq(accounts.userId, invite.userId), eq(accounts.providerId, "credential")))
      .limit(1);

    if (existing) {
      await tx.update(accounts).set({ password: hashed }).where(eq(accounts.id, existing.id));
    } else {
      await tx.insert(accounts).values({
        id: crypto.randomUUID(),
        accountId: invite.userId,
        providerId: "credential",
        userId: invite.userId,
        password: hashed,
      });
    }

    // Reaching the link proves they reach the address.
    await tx.update(users).set({ emailVerified: true }).where(eq(users.id, invite.userId));

    // Single use, marked inside the same transaction as the password write, so
    // a token cannot be spent twice by two concurrent submissions.
    await tx
      .update(accountInvites)
      .set({ usedAt: new Date() })
      .where(and(eq(accountInvites.id, invite.id), isNull(accountInvites.usedAt)));
  });

  await logActivity({
    actorId: invite.userId,
    action: "users.password_set",
    entity: "user",
    entityId: invite.userId,
  });

  return { ok: true, message: "Password set. You can sign in now." };
}
