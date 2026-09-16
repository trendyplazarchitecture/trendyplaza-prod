"use server";

import { revalidatePath } from "next/cache";
import { and, eq, isNotNull, isNull, max } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { homepageSoftwareLogos } from "@/db/schema";
import { requirePermission } from "@/server/session";
import { logActivity } from "@/server/activity";
import { saveSiteSettings } from "@/server/settings";
import { CAROUSEL_LOGO_FILES } from "@/lib/carousel-logos";
import type { ActionResult } from "./orders";

export type { ActionResult };

const REVALIDATE_PATHS = ["/admin/software", "/software-hub", "/", "/about"] as const;

function revalidateCarousel() {
  for (const path of REVALIDATE_PATHS) revalidatePath(path);
}

const fileNames = CAROUSEL_LOGO_FILES.map((f) => f.file);
const saveInput = z.object({
  id: z.string().uuid().optional(),
  nameEn: z.string().trim().min(1).max(120),
  logoPath: z.enum(fileNames as [string, ...string[]]),
  isVisible: z.boolean(),
});

export async function saveCarouselLogoAction(formData: FormData): Promise<ActionResult> {
  const actor = await requirePermission("software.manage");

  const parsed = saveInput.safeParse({
    id: (formData.get("id") as string) || undefined,
    nameEn: formData.get("nameEn"),
    logoPath: formData.get("logoPath"),
    isVisible: formData.get("isVisible") !== "off",
  });
  if (!parsed.success) {
    return { ok: false, message: "A name and a logo are needed." };
  }
  const data = parsed.data;
  const values = { nameEn: data.nameEn, logoPath: data.logoPath, isVisible: data.isVisible };

  let id = data.id;
  if (id) {
    await db.update(homepageSoftwareLogos).set(values).where(eq(homepageSoftwareLogos.id, id));
  } else {
    const [row] = await db.select({ value: max(homepageSoftwareLogos.position) }).from(homepageSoftwareLogos);
    const [created] = await db
      .insert(homepageSoftwareLogos)
      .values({ ...values, position: (row?.value ?? 0) + 1 })
      .returning();
    id = created.id;
  }

  await logActivity({
    actorId: actor.id,
    action: data.id ? "carousel_logo.updated" : "carousel_logo.created",
    entity: "carousel_logo",
    entityId: id,
    after: { nameEn: data.nameEn },
  });

  revalidateCarousel();
  return { ok: true, message: "Saved." };
}

const idInput = z.object({ logoId: z.string().uuid() });

/**
 * Soft delete then an immediate hard purge from the same confirmation, not
 * a 30-day trash entry — this is decorative marketing content nothing else
 * in the schema references, the same narrow exception `roster_members`
 * already sets (`_AI_CONTEXT/04_DATA.md`'s deletion policy footnote), not a
 * new one invented here.
 */
export async function archiveCarouselLogoAction(input: z.infer<typeof idInput>): Promise<ActionResult> {
  const actor = await requirePermission("software.manage");
  const { logoId } = idInput.parse(input);

  await db
    .update(homepageSoftwareLogos)
    .set({ archivedAt: new Date() })
    .where(eq(homepageSoftwareLogos.id, logoId));

  await logActivity({ actorId: actor.id, action: "carousel_logo.archived", entity: "carousel_logo", entityId: logoId });

  revalidateCarousel();
  return { ok: true, message: "Removed from the carousel." };
}

export async function restoreCarouselLogoAction(input: z.infer<typeof idInput>): Promise<ActionResult> {
  const actor = await requirePermission("software.manage");
  const { logoId } = idInput.parse(input);

  await db.update(homepageSoftwareLogos).set({ archivedAt: null }).where(eq(homepageSoftwareLogos.id, logoId));

  await logActivity({ actorId: actor.id, action: "carousel_logo.restored", entity: "carousel_logo", entityId: logoId });

  revalidateCarousel();
  return { ok: true, message: "Restored." };
}

export async function purgeCarouselLogoAction(input: z.infer<typeof idInput>): Promise<ActionResult> {
  const actor = await requirePermission("software.manage");
  const { logoId } = idInput.parse(input);

  const [row] = await db
    .select({ id: homepageSoftwareLogos.id, nameEn: homepageSoftwareLogos.nameEn })
    .from(homepageSoftwareLogos)
    .where(and(eq(homepageSoftwareLogos.id, logoId), isNotNull(homepageSoftwareLogos.archivedAt)));
  if (!row) return { ok: false, message: "That logo is not in the removed list." };

  // eslint-disable-next-line no-restricted-syntax -- decorative content nothing else references, see the doc comment above.
  await db
    .delete(homepageSoftwareLogos)
    .where(and(eq(homepageSoftwareLogos.id, logoId), isNotNull(homepageSoftwareLogos.archivedAt)));

  await logActivity({
    actorId: actor.id,
    action: "carousel_logo.purged",
    entity: "carousel_logo",
    entityId: logoId,
    before: { nameEn: row.nameEn },
  });

  revalidateCarousel();
  return { ok: true, message: "Removed for good." };
}

const visibleInput = z.object({ logoId: z.string().uuid(), isVisible: z.boolean() });

export async function setCarouselLogoVisibleAction(
  input: z.infer<typeof visibleInput>,
): Promise<ActionResult> {
  const actor = await requirePermission("software.manage");
  const data = visibleInput.parse(input);

  await db
    .update(homepageSoftwareLogos)
    .set({ isVisible: data.isVisible })
    .where(eq(homepageSoftwareLogos.id, data.logoId));

  await logActivity({
    actorId: actor.id,
    action: data.isVisible ? "carousel_logo.shown" : "carousel_logo.hidden",
    entity: "carousel_logo",
    entityId: data.logoId,
  });

  revalidateCarousel();
  return { ok: true, message: data.isVisible ? "Now in the carousel." : "Hidden." };
}

const reorderInput = z.object({ logoIds: z.array(z.string().uuid()).max(200) });

export async function reorderCarouselLogosAction(
  input: z.infer<typeof reorderInput>,
): Promise<ActionResult> {
  const actor = await requirePermission("software.manage");
  const { logoIds } = reorderInput.parse(input);

  await db.transaction(async (tx) => {
    for (const [index, id] of logoIds.entries()) {
      await tx
        .update(homepageSoftwareLogos)
        .set({ position: index + 1 })
        .where(and(eq(homepageSoftwareLogos.id, id), isNull(homepageSoftwareLogos.archivedAt)));
    }
  });

  await logActivity({ actorId: actor.id, action: "carousel_logo.reordered", entity: "carousel_logo" });

  revalidateCarousel();
  return { ok: true, message: "Order saved." };
}

const speedInput = z.object({ seconds: z.coerce.number().min(5).max(120) });

export async function saveCarouselSpeedAction(input: z.infer<typeof speedInput>): Promise<ActionResult> {
  const parsed = speedInput.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Pick a duration between 5 and 120 seconds." };

  await saveSiteSettings({ softwareCarouselSpeed: String(parsed.data.seconds) });
  revalidateCarousel();
  return { ok: true, message: "Speed saved." };
}
