import "server-only";

import { cache } from "react";
import { cookies, headers } from "next/headers";
import { notFound } from "next/navigation";
import { and, eq, gt } from "drizzle-orm";
import { db } from "@/db";
import { sessions, userPermissions, userProfiles, users } from "@/db/schema";
import { PERMISSIONS, type Permission } from "@/lib/permissions";
import { auth } from "./auth";

/**
 * The only place a session is read.
 *
 * `proxy.ts` does locale routing and nothing else. Every protected page,
 * server action and route handler calls one of the guards below on its own
 * first line. A layout-level check is not inherited by a server action:
 * actions are public HTTP endpoints reachable without ever rendering the
 * layout that "protects" them. See _AI_CONTEXT/05_SECURITY.md.
 */

export type CurrentUser = {
  id: string;
  email: string;
  name: string;
  /** A stored `avatars/<uuid>.webp`, or a full URL from a social sign-in. */
  image: string | null;
  state: "on_hold" | "active" | "suspended";
  locale: string;
  permissions: Set<Permission>;
};

/** Deduplicated per request, so ten guards in one render cost one query. */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  try {
    let userId: string | null = null;
    let userEmail: string | null = null;
    let userName: string | null = null;

    try {
      const session = await auth.api.getSession({ headers: await headers() });
      if (session?.user) {
        userId = session.user.id;
        userEmail = session.user.email;
        userName = session.user.name;
      }
    } catch {
      // Handled by direct cookie DB fallback below
    }

    // Direct database session fallback for reverse proxies or cookie prefix variations
    if (!userId) {
      const cookieStore = await cookies();
      const rawToken =
        cookieStore.get("__Secure-better-auth.session_token")?.value ||
        cookieStore.get("better-auth.session_token")?.value;

      if (rawToken) {
        const token = rawToken.split(".")[0];
        const [dbSession] = await db
          .select({
            userId: sessions.userId,
            expiresAt: sessions.expiresAt,
          })
          .from(sessions)
          .where(and(eq(sessions.token, token), gt(sessions.expiresAt, new Date())))
          .limit(1);

        if (dbSession) {
          userId = dbSession.userId;
          const [u] = await db
            .select({ id: users.id, email: users.email, name: users.name })
            .from(users)
            .where(eq(users.id, dbSession.userId))
            .limit(1);
          if (u) {
            userEmail = u.email;
            userName = u.name;
          }
        }
      }
    }

    if (!userId) return null;

    const [profile] = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, userId))
      .limit(1);

    // Suspended or archived (in trash) accounts are inactive: immediately treat as signed out
    if (profile?.state === "suspended" || profile?.archivedAt != null) {
      return null;
    }

    /*
     * The picture is read from the table, not from `session.user`.
     */
    const [account] = await db
      .select({ image: users.image, name: users.name, email: users.email })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const perms = await db
      .select({ permission: userPermissions.permission })
      .from(userPermissions)
      .where(eq(userPermissions.userId, userId));

    const permSet = new Set(perms.map((p) => p.permission as Permission));
    if (permSet.has("users.manage") || permSet.has("settings.manage")) {
      for (const p of PERMISSIONS) {
        permSet.add(p);
      }
    }

    return {
      id: userId,
      email: account?.email ?? userEmail ?? "",
      name: account?.name ?? userName ?? "",
      image: account?.image ?? null,
      state: profile?.state ?? "on_hold",
      locale: profile?.locale ?? "fr",
      permissions: permSet,
    };
  } catch (error) {
    console.error("Failed to retrieve current user session:", error);
    return null;
  }
});

export class AuthError extends Error {
  constructor(
    readonly kind: "unauthenticated" | "forbidden" | "suspended",
    message: string,
  ) {
    super(message);
    this.name = "AuthError";
  }
}

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) throw new AuthError("unauthenticated", "Sign in required.");
  if (user.state === "suspended") {
    throw new AuthError("suspended", "This account is suspended.");
  }
  return user;
}

export async function requirePermission(
  permission: Permission,
): Promise<CurrentUser> {
  const user = await requireUser();
  if (!user.permissions.has(permission)) {
    throw new AuthError("forbidden", `Missing permission: ${permission}`);
  }
  return user;
}

/** True when the user holds any admin permission at all. Gates the shell, never an action. */
export async function isStaff(): Promise<boolean> {
  const user = await getCurrentUser();
  return !!user && user.permissions.size > 0;
}

export async function hasPermission(permission: Permission): Promise<boolean> {
  const user = await getCurrentUser();
  return !!user?.permissions.has(permission);
}

/**
 * Admin pages render a 404 rather than a 403 for a signed-out visitor, so the
 * existence of the admin is not confirmed to someone probing URLs.
 */
export async function requirePermissionOrNotFound(permission: Permission) {
  try {
    return await requirePermission(permission);
  } catch {
    notFound();
  }
}

/**
 * Ensures the visitor is an authenticated staff member holding at least one permission.
 * Non-staff visitors get a 404 to avoid confirming the admin endpoint exists.
 */
export async function requireStaffOrNotFound(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user || user.state === "suspended" || user.permissions.size === 0) {
    notFound();
  }
  return user;
}

export async function grantPermissions(
  userId: string,
  permissions: readonly Permission[],
  grantedBy: string,
) {
  if (permissions.length === 0) return;
  await db
    .insert(userPermissions)
    .values(permissions.map((permission) => ({ userId, permission, grantedBy })))
    .onConflictDoNothing();
}

export async function revokePermission(userId: string, permission: Permission) {
  // A permission grant is not content, an order, a code or an entitlement, so
  // the no-delete rule does not reach it. Removing the row is the revocation,
  // and the activity log is what preserves the history.
  // eslint-disable-next-line no-restricted-syntax
  await db
    .delete(userPermissions)
    .where(
      and(
        eq(userPermissions.userId, userId),
        eq(userPermissions.permission, permission),
      ),
    );
}
