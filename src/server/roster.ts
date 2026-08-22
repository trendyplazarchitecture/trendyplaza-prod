import "server-only";

import { cache } from "react";
import { and, asc, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { rosterMembers } from "@/db/schema";
import type { Locale } from "@/lib/i18n-content";
import { pick } from "@/lib/i18n-content";

/** "Meet the team", on the About page. Client-managed, same as testimonials. */
export const listRoster = cache(async (locale: Locale) => {
  const rows = await db
    .select()
    .from(rosterMembers)
    .where(and(eq(rosterMembers.isVisible, true), isNull(rosterMembers.archivedAt)))
    .orderBy(asc(rosterMembers.position));

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    role: pick(locale, { en: r.roleEn, ar: r.roleAr, fr: r.roleFr }),
    imagePath: r.imagePath,
  }));
});

export type RosterMember = Awaited<ReturnType<typeof listRoster>>[number];

/** Every roster row an admin can act on, archived included, so restore is possible. */
export async function listAdminRoster() {
  return db.select().from(rosterMembers).orderBy(asc(rosterMembers.position));
}
