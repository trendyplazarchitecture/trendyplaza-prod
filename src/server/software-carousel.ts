import "server-only";

import { cache } from "react";
import { and, asc, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { homepageSoftwareLogos } from "@/db/schema";

/**
 * The "trusted by" logo strip — homepage, about page, software hub. See the
 * doc comment on `homepageSoftwareLogos` (`db/schema/software.ts`) for why
 * this is a separate table from the Software Hub directory.
 */
export const listCarouselLogos = cache(async () => {
  const rows = await db
    .select()
    .from(homepageSoftwareLogos)
    .where(and(eq(homepageSoftwareLogos.isVisible, true), isNull(homepageSoftwareLogos.archivedAt)))
    .orderBy(asc(homepageSoftwareLogos.position));

  return rows.map((r) => ({ id: r.id, name: r.nameEn, logoPath: r.logoPath }));
});

export type CarouselLogo = Awaited<ReturnType<typeof listCarouselLogos>>[number];

/** Every row an admin can act on, archived included, so restore is possible. */
export async function listAdminCarouselLogos() {
  return db.select().from(homepageSoftwareLogos).orderBy(asc(homepageSoftwareLogos.position));
}
