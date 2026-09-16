"use server";

import { revalidatePath } from "next/cache";
import { and, eq, isNull, max, sql } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { softwareTools } from "@/db/schema";
import { requirePermission } from "@/server/session";
import { storeUpload } from "@/server/storage";
import { logActivity } from "@/server/activity";
import { CAROUSEL_LOGO_FILES } from "@/lib/carousel-logos";
import type { ActionResult } from "./orders";

export type { ActionResult };

const REVALIDATE_PATHS = ["/admin/software", "/software-hub"] as const;

function revalidateSoftware() {
  for (const path of REVALIDATE_PATHS) revalidatePath(path);
}

function slugify(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const saveInput = z.object({
  id: z.string().uuid().optional(),
  kind: z.enum(["application", "plugin"]),
  nameEn: z.string().trim().min(1).max(120),
  descriptionEn: z.string().trim().min(1).max(1000),
  descriptionAr: z.string().trim().max(1000).nullable(),
  descriptionFr: z.string().trim().max(1000).nullable(),
  officialUrl: z.string().trim().url().max(500),
  studentLicenseUrl: z.string().trim().url().max(500).nullable(),
  parentToolId: z.string().uuid().nullable(),
  isVisible: z.boolean(),
});

/**
 * One form, one action, both kinds — a plugin is an application row with
 * `kind = 'plugin'` and a `parentToolId`, not a different shape. Template:
 * `saveRosterMemberAction` (`src/server/actions/roster.ts`).
 */
export async function saveSoftwareToolAction(formData: FormData): Promise<ActionResult> {
  const actor = await requirePermission("software.manage");

  const field = (name: string) => {
    const value = formData.get(name);
    const trimmed = typeof value === "string" ? value.trim() : "";
    return trimmed || null;
  };

  const parsed = saveInput.safeParse({
    id: (formData.get("id") as string) || undefined,
    kind: formData.get("kind"),
    nameEn: formData.get("nameEn"),
    descriptionEn: field("descriptionEn"),
    descriptionAr: field("descriptionAr"),
    descriptionFr: field("descriptionFr"),
    officialUrl: field("officialUrl"),
    studentLicenseUrl: field("studentLicenseUrl"),
    parentToolId: formData.get("kind") === "plugin" ? field("parentToolId") : null,
    isVisible: formData.get("isVisible") !== "off",
  });
  if (!parsed.success) {
    return {
      ok: false,
      message:
        parsed.error.issues[0]?.message ??
        "A name, a description, and a real official URL are needed.",
    };
  }
  const data = parsed.data;

  if (data.kind === "plugin" && !data.parentToolId) {
    return { ok: false, message: "A plugin needs the application it belongs to." };
  }

  const file = formData.get("logo");
  const removeLogo = formData.get("removeLogo") === "on";
  const logoAsset = field("logoAsset");
  // `undefined` means "leave the current logo alone" (the update below only
  // touches logoPath when this is not undefined); `null` means "clear it" --
  // two different intents a single optional field cannot express on its own.
  let logoPath: string | null | undefined;
  if (file instanceof File && file.size > 0) {
    const stored = await storeUpload(
      "software",
      { buffer: Buffer.from(await file.arrayBuffer()) },
      { maxBytes: 4 * 1024 * 1024, convertImages: true },
    );
    if (!stored.ok) {
      return {
        ok: false,
        message:
          stored.error === "too_large"
            ? "That logo is over 4 MB."
            : "That file is not an image this can read (JPEG, PNG or WebP) — pick one of the vendor logos below instead if this is an SVG.",
      };
    }
    logoPath = stored.relativePath;
  } else if (logoAsset) {
    // The client's own pre-vetted vendor SVGs — the same files the carousel
    // draws from — rather than a fresh upload. `storeUpload` cannot accept
    // SVG at all (see its own doc comment), so a tool that wants, say, the
    // real AutoCAD icon reuses the already-scanned static file instead of
    // asking for a raster re-export. Validated against the fixed list, not
    // trusted as a free-form path.
    const known = CAROUSEL_LOGO_FILES.some((f) => f.file === logoAsset);
    if (!known) {
      return { ok: false, message: "That is not a recognised vendor logo." };
    }
    logoPath = `seed/${logoAsset}`;
  } else if (removeLogo) {
    logoPath = null;
  }

  const values = {
    kind: data.kind,
    nameEn: data.nameEn,
    descriptionEn: data.descriptionEn,
    descriptionAr: data.descriptionAr,
    descriptionFr: data.descriptionFr,
    officialUrl: data.officialUrl,
    studentLicenseUrl: data.studentLicenseUrl,
    parentToolId: data.parentToolId,
    isVisible: data.isVisible,
  };

  let id = data.id;
  if (id) {
    await db
      .update(softwareTools)
      .set(logoPath !== undefined ? { ...values, logoPath } : values)
      .where(eq(softwareTools.id, id));
  } else {
    // A slug is never shown, never edited — it exists for a future detail
    // route (§6 of the plan) and needs to be unique today regardless.
    const baseSlug = slugify(data.nameEn) || "tool";
    let slug = baseSlug;
    for (let suffix = 2; ; suffix++) {
      const [clash] = await db
        .select({ id: softwareTools.id })
        .from(softwareTools)
        .where(eq(softwareTools.slug, slug))
        .limit(1);
      if (!clash) break;
      slug = `${baseSlug}-${suffix}`;
    }

    const [row] = await db.select({ value: max(softwareTools.position) }).from(softwareTools);
    const [created] = await db
      .insert(softwareTools)
      .values({ ...values, slug, logoPath: logoPath ?? null, position: (row?.value ?? 0) + 1, clickCount: 0 })
      .returning();
    id = created.id;
  }

  await logActivity({
    actorId: actor.id,
    action: data.id ? "software_tool.updated" : "software_tool.created",
    entity: "software_tool",
    entityId: id,
    after: { nameEn: data.nameEn, kind: data.kind },
  });

  revalidateSoftware();
  return { ok: true, message: "Saved." };
}

const idInput = z.object({ toolId: z.string().uuid() });

export async function archiveSoftwareToolAction(input: z.infer<typeof idInput>): Promise<ActionResult> {
  const actor = await requirePermission("software.manage");
  const { toolId } = idInput.parse(input);

  await db.update(softwareTools).set({ archivedAt: new Date() }).where(eq(softwareTools.id, toolId));

  await logActivity({
    actorId: actor.id,
    action: "software_tool.archived",
    entity: "software_tool",
    entityId: toolId,
  });

  revalidateSoftware();
  return { ok: true, message: "Deleted." };
}

const visibleInput = z.object({ toolId: z.string().uuid(), isVisible: z.boolean() });

export async function setSoftwareToolVisibleAction(
  input: z.infer<typeof visibleInput>,
): Promise<ActionResult> {
  const actor = await requirePermission("software.manage");
  const data = visibleInput.parse(input);

  await db.update(softwareTools).set({ isVisible: data.isVisible }).where(eq(softwareTools.id, data.toolId));

  await logActivity({
    actorId: actor.id,
    action: data.isVisible ? "software_tool.shown" : "software_tool.hidden",
    entity: "software_tool",
    entityId: data.toolId,
  });

  revalidateSoftware();
  return { ok: true, message: data.isVisible ? "Now showing on the hub." : "Hidden." };
}

const reorderInput = z.object({ toolIds: z.array(z.string().uuid()).max(200) });

export async function reorderSoftwareToolsAction(
  input: z.infer<typeof reorderInput>,
): Promise<ActionResult> {
  const actor = await requirePermission("software.manage");
  const { toolIds } = reorderInput.parse(input);

  await db.transaction(async (tx) => {
    for (const [index, id] of toolIds.entries()) {
      await tx
        .update(softwareTools)
        .set({ position: index + 1 })
        .where(and(eq(softwareTools.id, id), isNull(softwareTools.archivedAt)));
    }
  });

  await logActivity({ actorId: actor.id, action: "software_tool.reordered", entity: "software_tool" });

  revalidateSoftware();
  return { ok: true, message: "Order saved." };
}

/**
 * A `HEAD` request per external link, flagging anything that doesn't answer
 * 2xx. On demand from the admin screen, not a cron — no job scheduler exists
 * in this stack, and one is not being added for five applications' worth of
 * links. See the plan's "Link health" note.
 */
export async function checkSoftwareLinksAction(): Promise<{
  ok: true;
  broken: { id: string; nameEn: string; url: string; status: number | null }[];
}> {
  await requirePermission("software.manage");

  const rows = await db
    .select({
      id: softwareTools.id,
      nameEn: softwareTools.nameEn,
      officialUrl: softwareTools.officialUrl,
      studentLicenseUrl: softwareTools.studentLicenseUrl,
    })
    .from(softwareTools)
    .where(isNull(softwareTools.archivedAt));

  const checks: { id: string; nameEn: string; url: string }[] = [];
  for (const r of rows) {
    checks.push({ id: r.id, nameEn: r.nameEn, url: r.officialUrl });
    if (r.studentLicenseUrl) checks.push({ id: r.id, nameEn: r.nameEn, url: r.studentLicenseUrl });
  }

  const results = await Promise.all(
    checks.map(async (c) => {
      try {
        const response = await fetch(c.url, { method: "HEAD", signal: AbortSignal.timeout(8000) });
        return { ...c, status: response.status, ok: response.ok };
      } catch {
        return { ...c, status: null, ok: false };
      }
    }),
  );

  return { ok: true, broken: results.filter((r) => !r.ok).map(({ id, nameEn, url, status }) => ({ id, nameEn, url, status })) };
}

const clickInput = z.object({ toolId: z.string().uuid() });

/**
 * The only unauthenticated write in this file — any signed-in-or-not visitor
 * on `/software-hub` can call this by clicking a link. It only ever
 * increments a counter on a row that already exists and is visible; there is
 * nothing here for that to leak or corrupt, so it skips `requirePermission`
 * on purpose. Drives the admin's popularity sort and badge, never the
 * public order — see the doc comment on `clickCount` in `db/schema/software.ts`.
 */
export async function recordSoftwareToolClickAction(
  input: z.infer<typeof clickInput>,
): Promise<{ ok: true } | { ok: false }> {
  try {
    const { toolId } = clickInput.parse(input);
    await db
      .update(softwareTools)
      .set({ clickCount: sql`${softwareTools.clickCount} + 1` })
      .where(and(eq(softwareTools.id, toolId), eq(softwareTools.isVisible, true), isNull(softwareTools.archivedAt)));
    return { ok: true };
  } catch {
    return { ok: false };
  }
}
