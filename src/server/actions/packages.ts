"use server";

import { revalidatePath } from "next/cache";
import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { lmsPackages, packageContents } from "@/db/schema";
import { requirePermission } from "@/server/session";
import { logActivity } from "@/server/activity";
import { toCentimes } from "@/lib/money";
import type { ActionResult } from "./orders";

export type { ActionResult };

/**
 * Package authoring.
 *
 * A package is the sellable/redeemable unit of LMS access: a title, a price,
 * a duration, and exactly one scope into the content tree — the same
 * university/year/semester/module chain `src/server/entitlements.ts` resolves
 * down from at grant time. Price is typed in dinars and converted to
 * centimes here, the same rule as products.
 */
const packageInput = z.object({
  id: z.string().uuid().optional(),
  titleEn: z.string().trim().min(1).max(200),
  titleAr: z.string().trim().max(200).nullable().optional(),
  titleFr: z.string().trim().max(200).nullable().optional(),
  descriptionEn: z.string().trim().max(1200).nullable().optional(),
  descriptionAr: z.string().trim().max(1200).nullable().optional(),
  descriptionFr: z.string().trim().max(1200).nullable().optional(),
  /** In dinars, as typed. */
  price: z.coerce.number().min(0).max(10_000_000),
  durationDays: z.coerce.number().int().min(1).max(3650).nullable().optional(),
  scopeType: z.enum(["university", "year", "semester", "module"]),
  scopeId: z.string().uuid(),
});

export async function savePackageAction(formData: FormData): Promise<ActionResult> {
  const actor = await requirePermission("packages.manage");

  const raw = {
    id: (formData.get("id") as string) || undefined,
    titleEn: formData.get("titleEn"),
    titleAr: (formData.get("titleAr") as string) || null,
    titleFr: (formData.get("titleFr") as string) || null,
    descriptionEn: (formData.get("descriptionEn") as string) || null,
    descriptionAr: (formData.get("descriptionAr") as string) || null,
    descriptionFr: (formData.get("descriptionFr") as string) || null,
    price: formData.get("price"),
    durationDays: (formData.get("durationDays") as string) || null,
    scopeType: formData.get("scopeType"),
    scopeId: formData.get("scopeId"),
  };

  const parsed = packageInput.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      message:
        parsed.error.issues[0]?.message ??
        "Check the fields: an English title, a price and what it opens are needed.",
    };
  }
  const data = parsed.data;

  // Visibility is not part of this form — it toggles from the list, after
  // the row exists — so an update must never touch it here, or every edit
  // would silently relist a package someone had deliberately hidden.
  const values = {
    titleEn: data.titleEn,
    titleAr: data.titleAr ?? null,
    titleFr: data.titleFr ?? null,
    descriptionEn: data.descriptionEn ?? null,
    descriptionAr: data.descriptionAr ?? null,
    descriptionFr: data.descriptionFr ?? null,
    priceDzd: toCentimes(data.price),
    defaultDurationDays: data.durationDays ?? null,
  };

  const packageId = await db.transaction(async (tx) => {
    let id = data.id;
    if (id) {
      await tx.update(lmsPackages).set(values).where(eq(lmsPackages.id, id));
      // Replaced, not merged: a package holds exactly one scope, so the
      // old one is gone the moment a new one is chosen.
      await tx.delete(packageContents).where(eq(packageContents.packageId, id));
    } else {
      const [row] = await tx
        .insert(lmsPackages)
        .values({ ...values, isVisible: true })
        .returning();
      id = row.id;
    }

    await tx.insert(packageContents).values({
      packageId: id,
      scopeType: data.scopeType,
      scopeId: data.scopeId,
    });

    return id;
  });

  await logActivity({
    actorId: actor.id,
    action: data.id ? "packages.updated" : "packages.created",
    entity: "package",
    entityId: packageId,
    after: { titleEn: data.titleEn, scopeType: data.scopeType, scopeId: data.scopeId },
  });

  revalidatePath("/admin/packages");
  revalidatePath("/admin/codes");
  return { ok: true, message: data.id ? "Package saved." : "Package created." };
}

const idInput = z.object({ packageId: z.string().uuid() });

export async function setPackageVisibilityAction(
  input: z.infer<typeof idInput> & { isVisible: boolean },
): Promise<ActionResult> {
  const actor = await requirePermission("packages.manage");
  const { packageId } = idInput.parse(input);

  await db
    .update(lmsPackages)
    .set({ isVisible: input.isVisible })
    .where(eq(lmsPackages.id, packageId));

  await logActivity({
    actorId: actor.id,
    action: input.isVisible ? "packages.listed" : "packages.unlisted",
    entity: "package",
    entityId: packageId,
  });

  revalidatePath("/admin/packages");
  revalidatePath("/admin/codes");
  return { ok: true, message: input.isVisible ? "Visible to buyers." : "Hidden from buyers." };
}

/**
 * Archive, never delete. Code batches and entitlements hold a foreign key to
 * this row — removing it would break every grant that already points at it.
 * `listPackages` (the storefront/code-batch read) already filters archived
 * rows out, so this only stops it being offered again.
 */
export async function archivePackageAction(input: z.infer<typeof idInput>): Promise<ActionResult> {
  const actor = await requirePermission("packages.manage");
  const { packageId } = idInput.parse(input);

  await db
    .update(lmsPackages)
    .set({ archivedAt: new Date(), isVisible: false })
    .where(and(eq(lmsPackages.id, packageId), isNull(lmsPackages.archivedAt)));

  await logActivity({
    actorId: actor.id,
    action: "packages.archived",
    entity: "package",
    entityId: packageId,
  });

  revalidatePath("/admin/packages");
  revalidatePath("/admin/codes");
  return {
    ok: true,
    message: "Archived. Codes and entitlements that already point at it keep working.",
  };
}

export async function restorePackageAction(input: z.infer<typeof idInput>): Promise<ActionResult> {
  const actor = await requirePermission("packages.manage");
  const { packageId } = idInput.parse(input);

  await db.update(lmsPackages).set({ archivedAt: null }).where(eq(lmsPackages.id, packageId));

  await logActivity({
    actorId: actor.id,
    action: "packages.restored",
    entity: "package",
    entityId: packageId,
  });

  revalidatePath("/admin/packages");
  revalidatePath("/admin/codes");
  return { ok: true, message: "Restored, and still hidden until you list it." };
}
