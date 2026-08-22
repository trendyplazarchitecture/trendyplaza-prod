import { pgTable, text } from "drizzle-orm/pg-core";
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
