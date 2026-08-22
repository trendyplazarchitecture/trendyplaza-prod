import "server-only";

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";

/**
 * What a student can change about themselves.
 *
 * `users.image` and `users.name` are Better Auth's columns, and the adapter
 * owns their shape, so they are written here by id rather than through the
 * auth client: nothing about a display name or a picture needs a session
 * round trip, and doing it in SQL keeps the write in the data layer where the
 * rest of the project's writes live.
 */

/**
 * Points the account at a stored avatar.
 *
 * The old file is left on disk. It is a few kilobytes, it is unreachable the
 * moment this row changes, and unlinking it would be the one hard delete in a
 * codebase whose whole deletion policy is "never". A sweep of orphaned avatars
 * is a cron job, not a write path.
 */
export async function setAvatar(userId: string, relativePath: string) {
  await db.update(users).set({ image: relativePath }).where(eq(users.id, userId));
}

/** Clears it back to initials. Same argument: the row moves, the file stays. */
export async function clearAvatar(userId: string) {
  await db.update(users).set({ image: null }).where(eq(users.id, userId));
}

export async function setDisplayName(userId: string, name: string) {
  await db.update(users).set({ name }).where(eq(users.id, userId));
}
