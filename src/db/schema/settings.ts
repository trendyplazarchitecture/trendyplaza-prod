import { boolean, pgTable, text } from "drizzle-orm/pg-core";
import { RESTRICT, tsz } from "./_shared";
import { users } from "./identity";

/**
 * Site-wide values the client edits themselves, without a redeploy.
 *
 * Key-value, not a column per setting, or every new setting the client asks
 * for is a migration. Started with the three values behind open item O4-in-
 * spirit — Instagram, phone, email — the same problem `NEXT_PUBLIC_RIP_NUMBER`
 * has: a `NEXT_PUBLIC_` env var is inlined at **build** time, so the client
 * changing their own Instagram handle meant a developer redeploying the site.
 *
 * `value_en/fr/ar` even though today's three values are proper nouns and
 * numbers with no translation to carry — a phone number is a phone number in
 * every locale. The tripled column exists because the RIP number is meant to
 * land here next (O4), and *that* screen's copy does need Arabic and French,
 * so the shape is decided once rather than migrated twice.
 */
export const appSettings = pgTable("app_settings", {
  key: text().primaryKey(),
  valueEn: text(),
  valueFr: text(),
  valueAr: text(),
  updatedAt: tsz("updated_at").notNull().defaultNow(),
  updatedBy: text().references(() => users.id, RESTRICT),
});

/**
 * One switch per public admin-managed page: on, its own page (and only that
 * page) shows "Under maintenance" to everyone except the staff who can edit
 * it — off, it renders normally. `src/lib/maintenance.ts` is the registry of
 * which section keys exist, which permission governs each, and which public
 * path it takes down; add a page there, not here — this table only ever
 * needs a row for a key that has been toggled at least once, never a row per
 * registry entry, so a brand-new section defaults to "not in maintenance"
 * with no seed needed.
 *
 * Deliberately its own table rather than a page's-worth of `app_settings`
 * string keys: the permission that may flip a section is that section's own
 * ("software.manage" for Software Hub), not the blanket `settings.manage`
 * that guards `app_settings` — an editor should be able to take their own
 * page down without asking someone else to hold `settings.manage` too.
 */
export const sectionMaintenance = pgTable("section_maintenance", {
  sectionKey: text("section_key").primaryKey(),
  isActive: boolean("is_active").notNull().default(false),
  updatedAt: tsz("updated_at").notNull().defaultNow(),
  updatedBy: text().references(() => users.id, RESTRICT),
});
