import "server-only";

import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  accessRequests,
  entitlements,
  lmsPackages,
  staffAccessRequests,
  userProfiles,
  users,
} from "@/db/schema";
import { PERMISSIONS, type Permission } from "@/lib/permissions";
import { grantPermissions } from "./session";
import { logActivity } from "./activity";
import { storeUpload } from "./storage";

/* --------------------------------------------------------------------------
 * 1. Staff Permission Access Requests
 * ----------------------------------------------------------------------- */

export type PendingStaffAccessRequest = {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  permission: Permission;
  note: string | null;
  createdAt: Date;
};

export async function listPendingStaffAccessRequests(): Promise<PendingStaffAccessRequest[]> {
  try {
    const rows = await db
      .select({
        id: staffAccessRequests.id,
        userId: staffAccessRequests.userId,
        userName: users.name,
        userEmail: users.email,
        permission: staffAccessRequests.permission,
        note: staffAccessRequests.note,
        createdAt: staffAccessRequests.createdAt,
      })
      .from(staffAccessRequests)
      .innerJoin(users, eq(users.id, staffAccessRequests.userId))
      .where(eq(staffAccessRequests.status, "pending"))
      .orderBy(desc(staffAccessRequests.createdAt));

    return rows.map((r) => ({
      ...r,
      permission: r.permission as Permission,
    }));
  } catch (error) {
    console.error("Failed to list pending staff access requests:", error);
    return [];
  }
}

export async function requestStaffAccess(params: {
  userId: string;
  permission: Permission;
  note?: string;
}): Promise<{ ok: boolean; message: string }> {
  if (!PERMISSIONS.includes(params.permission)) {
    return { ok: false, message: "Invalid permission requested." };
  }

  try {
    const [existing] = await db
      .select({ id: staffAccessRequests.id })
      .from(staffAccessRequests)
      .where(
        and(
          eq(staffAccessRequests.userId, params.userId),
          eq(staffAccessRequests.permission, params.permission),
          eq(staffAccessRequests.status, "pending"),
        ),
      )
      .limit(1);

    if (existing) {
      return {
        ok: true,
        message: "Your access request has already been submitted and is pending review.",
      };
    }

    await db.insert(staffAccessRequests).values({
      userId: params.userId,
      permission: params.permission,
      status: "pending",
      note: params.note ?? null,
    });

    return {
      ok: true,
      message: "Access request sent to admins successfully.",
    };
  } catch (error) {
    console.error("Failed to request staff access:", error);
    return { ok: false, message: "Could not submit access request." };
  }
}

export async function reviewStaffAccessRequest(params: {
  requestId: string;
  approved: boolean;
  actorId: string;
}): Promise<{ ok: boolean; message: string }> {
  try {
    const [req] = await db
      .select()
      .from(staffAccessRequests)
      .where(eq(staffAccessRequests.id, params.requestId))
      .limit(1);

    if (!req) {
      return { ok: false, message: "Access request not found." };
    }

    if (req.status !== "pending") {
      return { ok: false, message: `This request was already ${req.status}.` };
    }

    const nextStatus = params.approved ? "approved" : "denied";

    await db.transaction(async (tx) => {
      await tx
        .update(staffAccessRequests)
        .set({
          status: nextStatus,
          reviewedBy: params.actorId,
          reviewedAt: new Date(),
        })
        .where(eq(staffAccessRequests.id, params.requestId));

      if (params.approved) {
        await grantPermissions(req.userId, [req.permission as Permission], params.actorId);
      }

      await logActivity({
        actorId: params.actorId,
        action: params.approved ? "users.access_granted" : "users.access_denied",
        entity: "staff_access_request",
        entityId: params.requestId,
        after: {
          userId: req.userId,
          permission: req.permission,
          status: nextStatus,
        },
        tx,
      });
    });

    return {
      ok: true,
      message: params.approved
        ? "Access request approved and permission granted."
        : "Access request denied.",
    };
  } catch (error) {
    console.error("Failed to review staff access request:", error);
    return { ok: false, message: "Failed to process the request." };
  }
}

/* --------------------------------------------------------------------------
 * 2. Student Receipt Access Requests (LMS Access)
 * ----------------------------------------------------------------------- */

export type StudentAccessRequestRow = {
  id: string;
  userId: string;
  packageId: string;
  receiptPath: string;
  receiptMime: string | null;
  amountClaimedDzd: number | null;
  status: "pending" | "approved" | "rejected";
  createdAt: Date;
  userName: string;
  userEmail: string;
  userPhone: string | null;
  packageTitleEn: string;
  packageTitleFr: string | null;
  packageTitleAr: string | null;
  packagePriceDzd: number;
  packageDurationDays: number | null;
  rejectionReasonEn: string | null;
  rejectionReasonFr: string | null;
  rejectionReasonAr: string | null;
};

export async function listAccessRequests(
  status: "pending" | "approved" | "rejected" = "pending",
): Promise<StudentAccessRequestRow[]> {
  try {
    const rows = await db
      .select({
        id: accessRequests.id,
        userId: accessRequests.userId,
        packageId: accessRequests.packageId,
        receiptPath: accessRequests.receiptPath,
        receiptMime: accessRequests.receiptMime,
        amountClaimedDzd: accessRequests.amountClaimedDzd,
        status: accessRequests.status,
        createdAt: accessRequests.createdAt,
        userName: users.name,
        userEmail: users.email,
        userPhone: userProfiles.phone,
        packageTitleEn: lmsPackages.titleEn,
        packageTitleFr: lmsPackages.titleFr,
        packageTitleAr: lmsPackages.titleAr,
        packagePriceDzd: lmsPackages.priceDzd,
        packageDurationDays: lmsPackages.defaultDurationDays,
        rejectionReasonEn: accessRequests.rejectionReasonEn,
        rejectionReasonFr: accessRequests.rejectionReasonFr,
        rejectionReasonAr: accessRequests.rejectionReasonAr,
      })
      .from(accessRequests)
      .innerJoin(users, eq(users.id, accessRequests.userId))
      .leftJoin(userProfiles, eq(userProfiles.userId, accessRequests.userId))
      .innerJoin(lmsPackages, eq(lmsPackages.id, accessRequests.packageId))
      .where(eq(accessRequests.status, status))
      .orderBy(desc(accessRequests.createdAt));

    return rows;
  } catch (error) {
    console.error("Failed to list student access requests:", error);
    return [];
  }
}

export async function getMyLatestRequest(userId: string) {
  try {
    const [row] = await db
      .select({
        id: accessRequests.id,
        status: accessRequests.status,
        createdAt: accessRequests.createdAt,
        amountClaimedDzd: accessRequests.amountClaimedDzd,
        packageTitleEn: lmsPackages.titleEn,
        packageTitleFr: lmsPackages.titleFr,
        packageTitleAr: lmsPackages.titleAr,
        rejectionReasonEn: accessRequests.rejectionReasonEn,
        rejectionReasonFr: accessRequests.rejectionReasonFr,
        rejectionReasonAr: accessRequests.rejectionReasonAr,
      })
      .from(accessRequests)
      .innerJoin(lmsPackages, eq(lmsPackages.id, accessRequests.packageId))
      .where(eq(accessRequests.userId, userId))
      .orderBy(desc(accessRequests.createdAt))
      .limit(1);

    return row ?? null;
  } catch (error) {
    console.error("Failed to get latest access request for user:", error);
    return null;
  }
}

export async function submitAccessRequest(
  userId: string,
  input: { packageId: string; amountClaimedDzd: number | null },
  fileBuffer: Buffer,
): Promise<
  | { ok: true }
  | { ok: false; error: "duplicate_pending" | "too_large" | "unsupported_type" | "invalid" }
> {
  try {
    const [pending] = await db
      .select({ id: accessRequests.id })
      .from(accessRequests)
      .where(and(eq(accessRequests.userId, userId), eq(accessRequests.status, "pending")))
      .limit(1);

    if (pending) {
      return { ok: false, error: "duplicate_pending" };
    }

    const stored = await storeUpload("receipts", { buffer: fileBuffer });
    if (!stored.ok) {
      return { ok: false, error: stored.error };
    }

    await db.insert(accessRequests).values({
      userId,
      packageId: input.packageId,
      amountClaimedDzd: input.amountClaimedDzd,
      receiptPath: stored.relativePath,
      receiptMime: stored.mime,
      status: "pending",
    });

    return { ok: true };
  } catch (error) {
    console.error("Failed to submit access request:", error);
    return { ok: false, error: "invalid" };
  }
}

export async function approveAccessRequest(
  requestId: string,
  actorId: string,
  durationDays?: number | null,
  note?: string | null,
) {
  try {
    const [req] = await db
      .select()
      .from(accessRequests)
      .where(eq(accessRequests.id, requestId))
      .limit(1);

    if (!req || req.status !== "pending") return null;

    const expiresAt = durationDays
      ? new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000)
      : null;

    return await db.transaction(async (tx) => {
      await tx
        .update(accessRequests)
        .set({
          status: "approved",
          reviewedBy: actorId,
          reviewedAt: new Date(),
        })
        .where(eq(accessRequests.id, requestId));

      const [entitlement] = await tx
        .insert(entitlements)
        .values({
          userId: req.userId,
          packageId: req.packageId,
          source: "request",
          sourceId: req.id,
          status: "active",
          expiresAt,
          note: note ?? null,
        })
        .returning();

      await tx
        .update(userProfiles)
        .set({ state: "active" })
        .where(eq(userProfiles.userId, req.userId));

      await logActivity({
        actorId,
        action: "access_requests.approved",
        entity: "access_request",
        entityId: req.id,
        after: { userId: req.userId, packageId: req.packageId },
        tx,
      });

      return entitlement;
    });
  } catch (error) {
    console.error("Failed to approve student access request:", error);
    return null;
  }
}

export async function rejectAccessRequest(
  requestId: string,
  reason: { fr?: string; ar?: string; en?: string } | string,
  actorId: string,
) {
  try {
    const [req] = await db
      .select()
      .from(accessRequests)
      .where(eq(accessRequests.id, requestId))
      .limit(1);

    if (!req || req.status !== "pending") return null;

    const fr = typeof reason === "string" ? reason : reason.fr ?? reason.en ?? "";
    const ar = typeof reason === "string" ? reason : reason.ar ?? reason.en ?? "";
    const en = typeof reason === "string" ? reason : reason.en ?? reason.fr ?? "";

    return await db.transaction(async (tx) => {
      const [updated] = await tx
        .update(accessRequests)
        .set({
          status: "rejected",
          reviewedBy: actorId,
          reviewedAt: new Date(),
          rejectionReasonEn: en,
          rejectionReasonFr: fr,
          rejectionReasonAr: ar,
        })
        .where(eq(accessRequests.id, requestId))
        .returning();

      await logActivity({
        actorId,
        action: "access_requests.rejected",
        entity: "access_request",
        entityId: req.id,
        after: { userId: req.userId, packageId: req.packageId },
        tx,
      });

      return updated;
    });
  } catch (error) {
    console.error("Failed to reject student access request:", error);
    return null;
  }
}
