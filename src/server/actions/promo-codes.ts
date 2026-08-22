"use server";

import { revalidatePath } from "next/cache";
import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { promoCodeProducts, promoCodes } from "@/db/schema";
import { requirePermission } from "@/server/session";
import { logActivity } from "@/server/activity";
import { toCentimes } from "@/lib/money";
import type { ActionResult } from "./orders";

export type { ActionResult };

/**
 * Promo code authoring.
 *
 * A separate module from `products.ts` per `01_RULES.md`'s one-data-access-
 * module-per-domain rule: this is its own thing with its own scope logic,
 * not a product setting.
 */
const promoCodeInput = z.object({
  id: z.string().uuid().optional(),
  code: z
    .string()
    .trim()
    .min(3)
    .max(40)
    .toUpperCase()
    .regex(/^[A-Z0-9-]+$/, "Letters, numbers and hyphens only"),
  kind: z.enum(["percent", "amount"]),
  /** Percent as typed (1-100), or an amount in dinars as typed. */
  value: z.coerce.number().positive(),
  scopeType: z.enum(["cart", "category", "product", "products"]),
  categoryId: z.string().uuid().optional(),
  productId: z.string().uuid().optional(),
  startsAt: z.string().trim().optional(),
  endsAt: z.string().trim().optional(),
  maxUses: z.coerce.number().int().positive().optional(),
  isActive: z.coerce.boolean().default(true),
});

export type SavePromoCodeResult =
  | { ok: true; message: string; id: string }
  | { ok: false; message: string };

export async function savePromoCodeAction(formData: FormData): Promise<SavePromoCodeResult> {
  const actor = await requirePermission("promoCodes.manage");

  const parsed = promoCodeInput.safeParse({
    id: (formData.get("id") as string) || undefined,
    code: formData.get("code"),
    kind: formData.get("kind"),
    value: formData.get("value"),
    scopeType: formData.get("scopeType"),
    categoryId: (formData.get("categoryId") as string) || undefined,
    productId: (formData.get("productId") as string) || undefined,
    startsAt: (formData.get("startsAt") as string) || undefined,
    endsAt: (formData.get("endsAt") as string) || undefined,
    maxUses: (formData.get("maxUses") as string) || undefined,
    isActive: formData.get("isActive") === "true",
  });
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "A code needs a value and a scope.",
    };
  }
  const data = parsed.data;

  if (data.kind === "percent" && data.value > 100) {
    return { ok: false, message: "A percentage discount cannot be over 100." };
  }
  if (data.scopeType === "category" && !data.categoryId) {
    return { ok: false, message: "Pick a category for a category-scoped code." };
  }
  if (data.scopeType === "product" && !data.productId) {
    return { ok: false, message: "Pick a product for a product-scoped code." };
  }

  const values = {
    code: data.code,
    kind: data.kind,
    value: data.kind === "percent" ? Math.round(data.value) : toCentimes(data.value),
    scopeType: data.scopeType,
    categoryId: data.scopeType === "category" ? data.categoryId! : null,
    // A single-product code keeps using this column; the multi-product case
    // is set separately via setPromoCodeProductsAction once the row exists.
    productId: data.scopeType === "product" ? data.productId! : null,
    startsAt: data.startsAt ? new Date(data.startsAt) : null,
    endsAt: data.endsAt ? new Date(data.endsAt) : null,
    maxUses: data.maxUses ?? null,
    isActive: data.isActive,
  };

  try {
    let id = data.id;
    if (id) {
      await db.update(promoCodes).set(values).where(eq(promoCodes.id, id));
    } else {
      const [row] = await db.insert(promoCodes).values(values).returning({ id: promoCodes.id });
      id = row.id;
    }

    await logActivity({
      actorId: actor.id,
      action: data.id ? "promo_codes.updated" : "promo_codes.created",
      entity: "promo_code",
      entityId: id,
      after: { code: values.code, scopeType: values.scopeType },
    });

    revalidatePath("/admin/promo-codes");
    revalidatePath("/admin/products");
    return { ok: true, message: data.id ? "Promo code saved." : "Promo code added.", id };
  } catch (error) {
    // Drizzle/postgres puts the real driver error (with constraint_name) on
    // error.cause, not in the top-level message string. See
    // NextPhase/06-category-creator-500-fix/PLAN.md.
    const cause = error instanceof Error ? (error.cause as { constraint_name?: string } | undefined) : undefined;
    if (cause?.constraint_name === "promo_codes_code_unique") {
      return { ok: false, message: `The code "${data.code}" is already taken. Pick another.` };
    }
    throw error;
  }
}

/**
 * Replaces the full set of products a `scopeType = 'products'` code
 * discounts. Delete-all-then-reinsert rather than diffing: this table is a
 * handful of rows per promo, and a diff buys nothing here that a
 * transaction doesn't already give for free.
 */
export async function setPromoCodeProductsAction(input: {
  promoCodeId: string;
  productIds: string[];
}): Promise<ActionResult> {
  const actor = await requirePermission("promoCodes.manage");
  const { promoCodeId, productIds } = z
    .object({ promoCodeId: z.string().uuid(), productIds: z.array(z.string().uuid()).max(200) })
    .parse(input);

  await db.transaction(async (tx) => {
    // eslint-disable-next-line no-restricted-syntax -- join rows replaced on save, same reasoning as packageContents
    await tx.delete(promoCodeProducts).where(eq(promoCodeProducts.promoCodeId, promoCodeId));
    if (productIds.length > 0) {
      await tx
        .insert(promoCodeProducts)
        .values(productIds.map((productId) => ({ promoCodeId, productId })));
    }
  });

  await logActivity({
    actorId: actor.id,
    action: "promo_codes.products_updated",
    entity: "promo_code",
    entityId: promoCodeId,
    after: { count: productIds.length },
  });

  revalidatePath("/admin/promo-codes");
  return { ok: true, message: `Scoped to ${productIds.length} product${productIds.length === 1 ? "" : "s"}.` };
}

const promoCodeIdInput = z.object({ promoCodeId: z.string().uuid() });

export async function archivePromoCodeAction(
  input: z.infer<typeof promoCodeIdInput>,
): Promise<ActionResult> {
  const actor = await requirePermission("promoCodes.manage");
  const { promoCodeId } = promoCodeIdInput.parse(input);

  await db
    .update(promoCodes)
    .set({ archivedAt: new Date(), isActive: false })
    .where(and(eq(promoCodes.id, promoCodeId), isNull(promoCodes.archivedAt)));

  await logActivity({
    actorId: actor.id,
    action: "promo_codes.archived",
    entity: "promo_code",
    entityId: promoCodeId,
  });

  revalidatePath("/admin/promo-codes");
  return { ok: true, message: "Archived. Past orders that used it are unaffected." };
}

export async function restorePromoCodeAction(
  input: z.infer<typeof promoCodeIdInput>,
): Promise<ActionResult> {
  const actor = await requirePermission("promoCodes.manage");
  const { promoCodeId } = promoCodeIdInput.parse(input);

  await db.update(promoCodes).set({ archivedAt: null }).where(eq(promoCodes.id, promoCodeId));

  await logActivity({
    actorId: actor.id,
    action: "promo_codes.restored",
    entity: "promo_code",
    entityId: promoCodeId,
  });

  revalidatePath("/admin/promo-codes");
  return { ok: true, message: "Restored. Still inactive until you switch it on." };
}

/**
 * A real delete, guarded: refuses once the code was actually redeemed
 * (`used_count > 0`), since `orders.promo_code_id` then points at it. The
 * `RESTRICT` foreign key would catch this at the database anyway; checked
 * here first only to give a message that explains why instead of a raw
 * constraint error.
 */
export async function deletePromoCodeAction(
  input: z.infer<typeof promoCodeIdInput>,
): Promise<ActionResult> {
  const actor = await requirePermission("promoCodes.manage");
  const { promoCodeId } = promoCodeIdInput.parse(input);

  const [row] = await db
    .select({ usedCount: promoCodes.usedCount, code: promoCodes.code })
    .from(promoCodes)
    .where(eq(promoCodes.id, promoCodeId))
    .limit(1);

  if (!row) return { ok: false, message: "That code no longer exists." };
  if (row.usedCount > 0) {
    return {
      ok: false,
      message: `${row.usedCount} order${row.usedCount === 1 ? "" : "s"} already used this code. Archive it instead.`,
    };
  }

  await db.transaction(async (tx) => {
    // eslint-disable-next-line no-restricted-syntax -- join rows for a never-used code carry no history
    await tx.delete(promoCodeProducts).where(eq(promoCodeProducts.promoCodeId, promoCodeId));
    // eslint-disable-next-line no-restricted-syntax -- a never-used code carries no order history
    await tx.delete(promoCodes).where(eq(promoCodes.id, promoCodeId));
  });

  await logActivity({
    actorId: actor.id,
    action: "promo_codes.deleted",
    entity: "promo_code",
    entityId: promoCodeId,
    after: { code: row.code },
  });

  revalidatePath("/admin/promo-codes");
  return { ok: true, message: "Deleted." };
}
