import "server-only";

import { cache } from "react";
import { db } from "@/db";
import { appSettings } from "@/db/schema";
import { requirePermission } from "./session";
import { logActivity } from "./activity";

/**
 * Site-wide values the client edits from the admin, not a developer from a
 * redeploy.
 *
 * Before this, the Instagram handle and the phone number were typed directly
 * into `SiteFooter.tsx` and `SiteHeader.tsx`'s mobile menu — the same string,
 * twice, and a third time on the about page's contact block. Changing a
 * number meant a developer finding every copy and editing all of them
 * together, or missing one and having the site disagree with itself about
 * its own phone number.
 *
 * Every key here has a hardcoded fallback, so a fresh database with no row
 * yet — a first `db:reset`, before anyone has opened `/admin/settings` — still
 * renders something rather than a blank contact block.
 */

export const SETTING_KEYS = ["instagram", "phone", "email", "ripNumber"] as const;
export type SettingKey = (typeof SETTING_KEYS)[number];

const DEFAULTS: Record<SettingKey, string> = {
  instagram: "trendyplaza_architecture",
  phone: "+213555000000",
  email: "contact@trendyplaza.dz",
  ripNumber: "",
};

const LABELS: Record<SettingKey, string> = {
  instagram: "Instagram handle",
  phone: "Phone / WhatsApp number",
  email: "Contact email",
  ripNumber: "Baridimob RIP number",
};

export const SETTING_META: { key: SettingKey; label: string; placeholder: string }[] =
  SETTING_KEYS.map((key) => ({ key, label: LABELS[key], placeholder: DEFAULTS[key] }));

export type SiteSettings = Record<SettingKey, string>;

/**
 * Read on every page that needs a contact channel — the footer, the header's
 * mobile menu, the about page, the contact page. Deduplicated per request by
 * `cache`, so five components asking for it on one page cost one query.
 */
export const getSiteSettings = cache(async (): Promise<SiteSettings> => {
  try {
    const rows = await db.select().from(appSettings);
    const byKey = new Map(rows.map((r) => [r.key, r]));

    const out = {} as SiteSettings;
    for (const key of SETTING_KEYS) {
      out[key] = byKey.get(key)?.valueEn?.trim() || DEFAULTS[key];
    }
    return out;
  } catch (err) {
    console.error("Failed to query app_settings, falling back to defaults:", err);
    return DEFAULTS;
  }
});

export type SaveSettingsInput = Partial<Record<SettingKey, string>>;

/**
 * One upsert per key. `settings.manage` was already reserved for exactly this
 * screen when the RIP number task was scoped, and never built until now.
 */
export async function saveSiteSettings(input: SaveSettingsInput) {
  const actor = await requirePermission("settings.manage");

  const entries = Object.entries(input).filter(
    (entry): entry is [SettingKey, string] =>
      SETTING_KEYS.includes(entry[0] as SettingKey) && typeof entry[1] === "string",
  );
  if (entries.length === 0) return;

  for (const [key, value] of entries) {
    const trimmed = value.trim();
    await db
      .insert(appSettings)
      .values({ key, valueEn: trimmed, updatedBy: actor.id })
      .onConflictDoUpdate({
        target: appSettings.key,
        set: { valueEn: trimmed, updatedAt: new Date(), updatedBy: actor.id },
      });
  }

  await logActivity({
    actorId: actor.id,
    action: "settings.updated",
    entity: "app_settings",
    after: Object.fromEntries(entries),
  });
}

