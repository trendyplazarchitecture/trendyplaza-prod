import "server-only";

import { cache } from "react";
import { and, asc, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { softwareTools } from "@/db/schema";
import type { Locale } from "@/lib/i18n-content";
import { pick } from "@/lib/i18n-content";

/**
 * The Software Hub directory (NextPhase/02-software-hub) — every entry links
 * out to a vendor; nothing here is hosted. See that plan for why (Shape C,
 * `00-shared/DATA_MODEL_DECISIONS.md`).
 */

/** Public read: visible applications with their visible plugins nested under them. */
export const listSoftwareTools = cache(async (locale: Locale) => {
  const rows = await db
    .select()
    .from(softwareTools)
    .where(and(eq(softwareTools.isVisible, true), isNull(softwareTools.archivedAt)))
    .orderBy(asc(softwareTools.position));

  const shaped = rows.map((r) => ({
    id: r.id,
    kind: r.kind,
    slug: r.slug,
    name: r.nameEn,
    description: pick(locale, { en: r.descriptionEn, ar: r.descriptionAr, fr: r.descriptionFr }),
    logoPath: r.logoPath,
    officialUrl: r.officialUrl,
    studentLicenseUrl: r.studentLicenseUrl,
    parentToolId: r.parentToolId,
  }));

  const plugins = shaped.filter((t) => t.kind === "plugin");
  const applications = shaped
    .filter((t) => t.kind === "application")
    .map((app) => ({ ...app, plugins: plugins.filter((p) => p.parentToolId === app.id) }));
  // A plugin whose application was hidden or archived independently — still
  // shown, just not nested under anything, rather than silently dropped.
  const orphanPlugins = plugins.filter(
    (p) => !applications.some((app) => app.id === p.parentToolId),
  );

  return { applications, orphanPlugins };
});

export type SoftwareDirectory = Awaited<ReturnType<typeof listSoftwareTools>>;

export async function getSoftwareToolBySlug(slug: string, locale: Locale) {
  const [row] = await db
    .select()
    .from(softwareTools)
    .where(
      and(eq(softwareTools.slug, slug), eq(softwareTools.isVisible, true), isNull(softwareTools.archivedAt)),
    )
    .limit(1);
  if (!row) return null;

  return {
    id: row.id,
    kind: row.kind,
    slug: row.slug,
    name: row.nameEn,
    description: pick(locale, { en: row.descriptionEn, ar: row.descriptionAr, fr: row.descriptionFr }),
    logoPath: row.logoPath,
    officialUrl: row.officialUrl,
    studentLicenseUrl: row.studentLicenseUrl,
  };
}

/** Every row an admin can act on, archived included, applications and plugins both — the editor groups them client-side. */
export async function listAdminSoftwareTools() {
  return db.select().from(softwareTools).orderBy(asc(softwareTools.position));
}

/** For the parent-tool picker in the form: visible, unarchived applications only — a plugin cannot itself have a parent. */
export async function listApplicationsForPicker() {
  return db
    .select({ id: softwareTools.id, nameEn: softwareTools.nameEn })
    .from(softwareTools)
    .where(
      and(
        eq(softwareTools.kind, "application"),
        isNull(softwareTools.archivedAt),
      ),
    )
    .orderBy(asc(softwareTools.position));
}
