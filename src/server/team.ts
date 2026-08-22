import "server-only";

import { and, asc, desc, eq, inArray, isNotNull, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { accountInvites, userPermissions, userProfiles, users } from "@/db/schema";
import { PERMISSIONS, type Permission } from "@/lib/permissions";
import { logActivity } from "./activity";

/**
 * Who can reach the admin, and what each of them can do.
 *
 * Staff is not a flag on a row: it is "holds at least one permission". That
 * keeps one source of truth. Revoking the last permission removes someone from
 * the team without a second field to remember to update.
 *
 * Permissions are read from the database on every request by `getCurrentUser`,
 * never from the session, so a change here takes effect on the target's next
 * request. That is stronger than invalidating their session and it needs no
 * extra machinery.
 */

export type StaffMember = {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  permissions: Permission[];
  /** `suspended` is what "deleted" means for an account that holds history. */
  state: "on_hold" | "active" | "suspended";
  archivedAt: Date | null;
  /** True while an unused, unexpired setup link is outstanding. */
  awaitingSetup: boolean;
};

export async function listStaff(): Promise<StaffMember[]> {
  try {
    const rows = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        createdAt: users.createdAt,
        permission: userPermissions.permission,
        state: userProfiles.state,
        archivedAt: userProfiles.archivedAt,
        awaitingSetup: sql<boolean>`exists (
          select 1 from ${accountInvites} i
           where i.user_id = ${users.id}
             and i.used_at is null
             and i.expires_at > now()
        )`,
      })
      .from(users)
      .innerJoin(userPermissions, eq(userPermissions.userId, users.id))
      .leftJoin(userProfiles, eq(userProfiles.userId, users.id))
      .where(isNull(userProfiles.archivedAt))
      .orderBy(asc(users.name));

    const byUser = new Map<string, StaffMember>();
    for (const row of rows) {
      let member = byUser.get(row.id);
      if (!member) {
        member = {
          id: row.id,
          name: row.name,
          email: row.email,
          createdAt: row.createdAt,
          permissions: [],
          state: row.state ?? "active",
          archivedAt: row.archivedAt ?? null,
          awaitingSetup: Boolean(row.awaitingSetup),
        };
        byUser.set(row.id, member);
      }
      member.permissions.push(row.permission as Permission);
    }

    return [...byUser.values()];
  } catch (error) {
    console.error("Failed to list staff:", error);
    return [];
  }
}

export async function listArchivedStaff(): Promise<StaffMember[]> {
  try {
    const rows = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        createdAt: users.createdAt,
        permission: userPermissions.permission,
        state: userProfiles.state,
        archivedAt: userProfiles.archivedAt,
        awaitingSetup: sql<boolean>`false`,
      })
      .from(users)
      .leftJoin(userPermissions, eq(userPermissions.userId, users.id))
      .leftJoin(userProfiles, eq(userProfiles.userId, users.id))
      .where(isNotNull(userProfiles.archivedAt))
      .orderBy(desc(userProfiles.archivedAt));

    const byUser = new Map<string, StaffMember>();
    for (const row of rows) {
      let member = byUser.get(row.id);
      if (!member) {
        member = {
          id: row.id,
          name: row.name,
          email: row.email,
          createdAt: row.createdAt,
          permissions: [],
          state: row.state ?? "suspended",
          archivedAt: row.archivedAt ?? null,
          awaitingSetup: false,
        };
        byUser.set(row.id, member);
      }
      if (row.permission) {
        member.permissions.push(row.permission as Permission);
      }
    }

    return [...byUser.values()];
  } catch (error) {
    console.error("Failed to list archived staff:", error);
    return [];
  }
}

/**
 * The candidate list for promotion: accounts with no permissions at all.
 *
 * There is no "create a staff account" here on purpose. A person signs up
 * through the same door as everyone else and an admin then grants what they
 * need, which means no screen in this application ever handles someone else's
 * password.
 */
export async function listPromotable(search: string | undefined, limit = 20) {
  const term = search?.trim();

  try {
    return await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        state: userProfiles.state,
      })
      .from(users)
      .leftJoin(userProfiles, eq(userProfiles.userId, users.id))
      .where(
        and(
          isNull(userProfiles.archivedAt),
          sql`not exists (
            select 1 from ${userPermissions}
            where ${userPermissions.userId} = ${users.id}
          )`,
          term
            ? sql`(${users.email} ilike ${`%${term}%`} or ${users.name} ilike ${`%${term}%`})`
            : undefined,
        ),
      )
      .orderBy(desc(users.createdAt))
      .limit(limit);
  } catch (error) {
    console.error("Failed to list promotable users:", error);
    return [];
  }
}

export type SetPermissionsResult =
  | { ok: true; granted: number; revoked: number }
  | { ok: false; error: "self_lockout" | "last_admin" | "unknown_user" };

/**
 * Replaces someone's permission set with the one given.
 *
 * Two refusals, both about not locking the door from the inside:
 *
 *   - an admin cannot take `users.manage` off their own account, because the
 *     screen that would put it back is the one they just closed;
 *   - the last account holding `users.manage` cannot lose it, because then
 *     nobody can grant it to anyone ever again and the fix is a SQL prompt on
 *     a production database.
 */
export async function setUserPermissions(
  userId: string,
  next: readonly Permission[],
  actorId: string,
): Promise<SetPermissionsResult> {
  const wanted = new Set(next.filter((p) => PERMISSIONS.includes(p)));

  const [target] = await db
    .select({ id: users.id, name: users.name })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!target) return { ok: false, error: "unknown_user" };

  if (userId === actorId && !wanted.has("users.manage")) {
    return { ok: false, error: "self_lockout" };
  }

  if (!wanted.has("users.manage")) {
    const [{ holders }] = await db
      .select({ holders: sql<number>`count(*)::int` })
      .from(userPermissions)
      .where(eq(userPermissions.permission, "users.manage"));

    const [held] = await db
      .select({ permission: userPermissions.permission })
      .from(userPermissions)
      .where(
        and(
          eq(userPermissions.userId, userId),
          eq(userPermissions.permission, "users.manage"),
        ),
      )
      .limit(1);

    if (held && holders <= 1) return { ok: false, error: "last_admin" };
  }

  const current = await db
    .select({ permission: userPermissions.permission })
    .from(userPermissions)
    .where(eq(userPermissions.userId, userId));

  const currentSet = new Set(current.map((row) => row.permission as Permission));
  const toGrant = [...wanted].filter((p) => !currentSet.has(p));
  const toRevoke = [...currentSet].filter((p) => !wanted.has(p));

  await db.transaction(async (tx) => {
    if (toGrant.length > 0) {
      await tx
        .insert(userPermissions)
        .values(toGrant.map((permission) => ({ userId, permission, grantedBy: actorId })))
        .onConflictDoNothing();
    }

    if (toRevoke.length > 0) {
      // A permission grant is not content, an order, a code or an entitlement,
      // so the no-delete rule does not reach it. Removing the row is the
      // revocation, and the activity log below is what preserves the history.
      // eslint-disable-next-line no-restricted-syntax
      await tx
        .delete(userPermissions)
        .where(
          and(
            eq(userPermissions.userId, userId),
            inArray(userPermissions.permission, toRevoke),
          ),
        );
    }

    await logActivity({
      actorId,
      action: "users.permissions_changed",
      entity: "user",
      entityId: userId,
      before: { permissions: [...currentSet] },
      after: { permissions: [...wanted] },
      tx,
    });
  });

  return { ok: true, granted: toGrant.length, revoked: toRevoke.length };
}
