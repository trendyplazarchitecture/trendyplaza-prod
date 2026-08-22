import "server-only";

import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import {
  accessCodes,
  codeBatches,
  entitlements,
  lmsPackages,
  orders,
  userProfiles,
  users,
} from "@/db/schema";
import { formatCode, generateCodeBatch, normaliseCode } from "@/lib/codes";
import { logActivity } from "./activity";

export const createBatchInput = z.object({
  label: z.string().min(1).max(120),
  packageId: z.string().uuid(),
  prefix: z.string().min(1).max(8),
  quantity: z.number().int().min(1).max(5000),
  durationDays: z.number().int().min(1).max(3650).nullable(),
  expiresAt: z.date().nullable().optional(),
});

/**
 * Codes are pre-generated, printed onto gift cards, and put in boxes. Nothing
 * here touches an order: `order_id` stays null on a batch code. Generating a
 * code at order approval instead would make the primary flow impossible.
 */
export async function createCodeBatch(
  input: z.infer<typeof createBatchInput>,
  actorId: string,
) {
  const data = createBatchInput.parse(input);

  return db.transaction(async (tx) => {
    const [batch] = await tx
      .insert(codeBatches)
      .values({
        label: data.label,
        packageId: data.packageId,
        prefix: data.prefix,
        quantity: data.quantity,
        durationDays: data.durationDays,
        expiresAt: data.expiresAt ?? null,
        createdBy: actorId,
      })
      .returning();

    const codes = generateCodeBatch(data.prefix, data.quantity);
    await tx.insert(accessCodes).values(
      codes.map((code) => ({
        code,
        batchId: batch.id,
        packageId: data.packageId,
        durationDays: data.durationDays,
      })),
    );

    await logActivity({
      actorId,
      action: "codes.batch_created",
      entity: "code_batch",
      entityId: batch.id,
      after: { label: data.label, quantity: data.quantity, prefix: data.prefix },
      tx,
    });

    return { batch, codes };
  });
}

/** A single code, for support cases. Optionally tied to an order. */
export async function createSingleCode(
  input: {
    packageId: string;
    prefix?: string;
    durationDays: number | null;
    orderId?: string | null;
  },
  actorId: string,
) {
  const [code] = generateCodeBatch(input.prefix ?? "TP", 1);
  const [row] = await db
    .insert(accessCodes)
    .values({
      code,
      packageId: input.packageId,
      durationDays: input.durationDays,
      orderId: input.orderId ?? null,
    })
    .returning();

  await logActivity({
    actorId,
    action: "codes.single_created",
    entity: "access_code",
    entityId: row.id,
    after: { code, orderId: input.orderId ?? null },
  });

  return row;
}

/**
 * Thrown to abort the redemption transaction on a refusal, so the conditional
 * UPDATE that already claimed the code is rolled back and the code stays
 * unused. A refusal must never burn a card the student paid for.
 */
class RedemptionRefused extends Error {
  constructor(readonly reason: "expired" | "already_entitled") {
    super(reason);
    this.name = "RedemptionRefused";
  }
}

export type RedeemResult =
  | { ok: true; packageId: string; entitlementId: string; expiresAt: Date | null }
  | { ok: false; reason: "not_found" | "already_redeemed" | "voided" | "expired" | "already_entitled" };

/**
 * The most important query in the project.
 *
 * Two submissions of the same code, from two tabs or a double-tapped button,
 * both pass a read-then-write check and both create an entitlement. The guard
 * is a single conditional UPDATE: Postgres serialises the row, the second
 * statement matches zero rows, and the caller gets a clean refusal.
 *
 * Never rewrite this as a SELECT followed by an UPDATE.
 */
export async function redeemCode(
  rawCode: string,
  userId: string,
): Promise<RedeemResult> {
  const code = normaliseCode(rawCode);
  if (!code) return { ok: false, reason: "not_found" };

  return db.transaction(async (tx): Promise<RedeemResult> => {
    const claimed = await tx
      .update(accessCodes)
      .set({
        isRedeemed: true,
        redeemedByUserId: userId,
        redeemedAt: new Date(),
      })
      .where(
        and(
          eq(accessCodes.code, code),
          eq(accessCodes.isRedeemed, false),
          isNull(accessCodes.voidedAt),
        ),
      )
      .returning({
        id: accessCodes.id,
        packageId: accessCodes.packageId,
        durationDays: accessCodes.durationDays,
        batchId: accessCodes.batchId,
      });

    // Zero rows means the code does not exist, is already redeemed, or is
    // void. Which one only matters for the message, so it costs one read on
    // the failure path and none on the success path.
    if (claimed.length === 0) {
      const [existing] = await tx
        .select({
          isRedeemed: accessCodes.isRedeemed,
          voidedAt: accessCodes.voidedAt,
        })
        .from(accessCodes)
        .where(eq(accessCodes.code, code))
        .limit(1);

      if (!existing) return { ok: false, reason: "not_found" as const };
      if (existing.voidedAt) return { ok: false, reason: "voided" as const };
      return { ok: false, reason: "already_redeemed" as const };
    }

    const claim = claimed[0];

    // A batch can carry its own deadline. Past it, the claim is rolled back so
    // the code stays unused rather than being burned by a failed attempt.
    if (claim.batchId) {
      const [batch] = await tx
        .select({ expiresAt: codeBatches.expiresAt })
        .from(codeBatches)
        .where(eq(codeBatches.id, claim.batchId))
        .limit(1);

      if (batch?.expiresAt && batch.expiresAt.getTime() < Date.now()) {
        throw new RedemptionRefused("expired");
      }
    }

    // Redeeming for content the student already holds is refused, and the code
    // stays unused. Rolling back is what keeps that promise.
    const [held] = await tx
      .select({ id: entitlements.id })
      .from(entitlements)
      .where(
        and(
          eq(entitlements.userId, userId),
          eq(entitlements.packageId, claim.packageId),
          eq(entitlements.status, "active"),
        ),
      )
      .limit(1);

    if (held) throw new RedemptionRefused("already_entitled");

    const [pkg] = await tx
      .select({ defaultDurationDays: lmsPackages.defaultDurationDays })
      .from(lmsPackages)
      .where(eq(lmsPackages.id, claim.packageId))
      .limit(1);

    const days = claim.durationDays ?? pkg?.defaultDurationDays ?? null;
    const expiresAt = days
      ? new Date(Date.now() + days * 24 * 60 * 60 * 1000)
      : null;

    const [entitlement] = await tx
      .insert(entitlements)
      .values({
        userId,
        packageId: claim.packageId,
        source: "code",
        sourceId: claim.id,
        expiresAt,
        status: "active",
      })
      .returning({ id: entitlements.id });

    // In the same transaction as the grant. An account left on hold while its
    // entitlement is live reads as broken to the student and to the admin
    // looking at the student list.
    await tx
      .update(userProfiles)
      .set({ state: "active" })
      .where(
        and(eq(userProfiles.userId, userId), eq(userProfiles.state, "on_hold")),
      );

    await logActivity({
      actorId: userId,
      action: "codes.redeemed",
      entity: "access_code",
      entityId: claim.id,
      after: { userId, packageId: claim.packageId },
      tx,
    });

    return {
      ok: true as const,
      packageId: claim.packageId,
      entitlementId: entitlement.id,
      expiresAt,
    };
  }).catch((error): RedeemResult => {
    if (error instanceof RedemptionRefused) {
      return { ok: false, reason: error.reason };
    }
    throw error;
  });
}

/** Void, do not delete. A voided code is evidence in a support conversation. */
export async function voidCode(codeId: string, reason: string, actorId: string) {
  const [row] = await db
    .update(accessCodes)
    .set({ voidedAt: new Date(), voidReason: reason })
    .where(and(eq(accessCodes.id, codeId), isNull(accessCodes.voidedAt)))
    .returning();

  if (row) {
    await logActivity({
      actorId,
      action: "codes.voided",
      entity: "access_code",
      entityId: codeId,
      after: { reason },
    });
  }
  return row ?? null;
}

export async function listBatches() {
  return db
    .select({
      id: codeBatches.id,
      label: codeBatches.label,
      prefix: codeBatches.prefix,
      quantity: codeBatches.quantity,
      durationDays: codeBatches.durationDays,
      createdAt: codeBatches.createdAt,
      exportedAt: codeBatches.exportedAt,
      packageTitleFr: lmsPackages.titleFr,
      packageTitleAr: lmsPackages.titleAr,
      redeemedCount: sql<number>`(
        select count(*)::int from ${accessCodes}
        where ${accessCodes.batchId} = ${codeBatches.id} and ${accessCodes.isRedeemed}
      )`,
    })
    .from(codeBatches)
    .innerJoin(lmsPackages, eq(lmsPackages.id, codeBatches.packageId))
    .orderBy(desc(codeBatches.createdAt));
}

export async function listBatchCodes(batchId: string) {
  const rows = await db
    .select()
    .from(accessCodes)
    .where(eq(accessCodes.batchId, batchId))
    .orderBy(accessCodes.code);

  return rows.map((r) => ({ ...r, printed: formatCode(r.code) }));
}

export async function markBatchExported(batchId: string, actorId: string) {
  await db
    .update(codeBatches)
    .set({ exportedAt: new Date() })
    .where(eq(codeBatches.id, batchId));

  await logActivity({
    actorId,
    action: "codes.batch_exported",
    entity: "code_batch",
    entityId: batchId,
  });
}

export type CodeLookup = {
  found: boolean;
  /** What the operator typed, after normalisation. Shown so a typo is visible. */
  normalised: string;
  printed?: string;
  state?: "unused" | "redeemed" | "void";
  packageTitleEn?: string | null;
  batchLabel?: string | null;
  batchPrefix?: string | null;
  durationDays?: number | null;
  createdAt?: Date;
  redeemedAt?: Date | null;
  voidedAt?: Date | null;
  voidReason?: string | null;
  orderReference?: string | null;
  holder?: {
    userId: string;
    name: string;
    email: string;
    phone: string | null;
    entitlementStatus: string | null;
    expiresAt: Date | null;
  } | null;
  codeId?: string;
};

/**
 * The support desk question, answered in one query: a student is on the phone
 * reading a code off a card, and someone needs to know whether it works, and
 * if not, who already used it.
 *
 * Input is normalised the same way redemption normalises it, so what the
 * operator types matches what the student typed, dashes, case, and the
 * `O`/`0` and `I`/`1` confusions included.
 */
export async function lookupCode(rawCode: string): Promise<CodeLookup> {
  const normalised = normaliseCode(rawCode);
  if (!normalised) return { found: false, normalised };

  const [row] = await db
    .select({
      id: accessCodes.id,
      code: accessCodes.code,
      isRedeemed: accessCodes.isRedeemed,
      redeemedAt: accessCodes.redeemedAt,
      voidedAt: accessCodes.voidedAt,
      voidReason: accessCodes.voidReason,
      durationDays: accessCodes.durationDays,
      createdAt: accessCodes.createdAt,
      packageTitleEn: lmsPackages.titleEn,
      batchLabel: codeBatches.label,
      batchPrefix: codeBatches.prefix,
      orderReference: orders.reference,
      holderId: users.id,
      holderName: users.name,
      holderEmail: users.email,
      holderPhone: userProfiles.phone,
      entitlementStatus: entitlements.status,
      entitlementExpiresAt: entitlements.expiresAt,
    })
    .from(accessCodes)
    .leftJoin(lmsPackages, eq(lmsPackages.id, accessCodes.packageId))
    .leftJoin(codeBatches, eq(codeBatches.id, accessCodes.batchId))
    .leftJoin(orders, eq(orders.id, accessCodes.orderId))
    .leftJoin(users, eq(users.id, accessCodes.redeemedByUserId))
    .leftJoin(userProfiles, eq(userProfiles.userId, accessCodes.redeemedByUserId))
    // The entitlement this code produced, not merely one the holder has.
    //
    // `source_id` is text rather than uuid because it is polymorphic: it holds
    // a code id, a request id, or an admin's user id, and user ids are text.
    // Postgres will not compare text to uuid, so the cast is explicit and
    // belongs on the uuid side.
    .leftJoin(
      entitlements,
      and(
        eq(entitlements.source, "code"),
        sql`${entitlements.sourceId} = ${accessCodes.id}::text`,
      ),
    )
    .where(eq(accessCodes.code, normalised))
    .limit(1);

  if (!row) return { found: false, normalised };

  return {
    found: true,
    normalised,
    codeId: row.id,
    printed: formatCode(row.code),
    state: row.voidedAt ? "void" : row.isRedeemed ? "redeemed" : "unused",
    packageTitleEn: row.packageTitleEn,
    batchLabel: row.batchLabel,
    batchPrefix: row.batchPrefix,
    durationDays: row.durationDays,
    createdAt: row.createdAt,
    redeemedAt: row.redeemedAt,
    voidedAt: row.voidedAt,
    voidReason: row.voidReason,
    orderReference: row.orderReference,
    holder: row.holderId
      ? {
          userId: row.holderId,
          name: row.holderName ?? "",
          email: row.holderEmail ?? "",
          phone: row.holderPhone,
          entitlementStatus: row.entitlementStatus,
          expiresAt: row.entitlementExpiresAt,
        }
      : null,
  };
}
