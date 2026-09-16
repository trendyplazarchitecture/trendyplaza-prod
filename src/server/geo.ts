import "server-only";

import { cache } from "react";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { communes, shippingRates, wilayas } from "@/db/schema";
import type { Locale } from "@/lib/i18n-content";
import { pick } from "@/lib/i18n-content";

/**
 * The wilaya count is read, never asserted. It was 48, then 58, and has been
 * 69 since Loi 26-06 of April 2026. Anything that hard-codes it is wrong
 * within a year.
 */
export const listWilayas = cache(async (locale: Locale) => {
  const rows = await db
    .select({
      code: wilayas.code,
      nameFr: wilayas.nameFr,
      nameAr: wilayas.nameAr,
      homeDzd: shippingRates.homeDzd,
      deskDzd: shippingRates.deskDzd,
      isAvailable: shippingRates.isAvailable,
    })
    .from(wilayas)
    .leftJoin(shippingRates, eq(shippingRates.wilayaCode, wilayas.code))
    .orderBy(asc(wilayas.code));

  return rows.map((r) => ({
    code: r.code,
    name: pick(locale, { ar: r.nameAr, fr: r.nameFr }),
    homeDzd: r.homeDzd ?? null,
    deskDzd: r.deskDzd ?? null,
    isAvailable: r.isAvailable ?? false,
  }));
});

export const listCommunes = cache(async (wilayaCode: number, locale: Locale) => {
  const rows = await db
    .select()
    .from(communes)
    .where(eq(communes.wilayaCode, wilayaCode))
    .orderBy(asc(communes.nameFr));

  return rows.map((r) => ({
    id: r.id,
    name: pick(locale, { ar: r.nameAr, fr: r.nameFr }),
  }));
});

/**
 * The single source of truth for a shipping cost. The checkout action
 * recomputes with this rather than trusting the figure the browser posted,
 * because a server action is a public endpoint and the price is money.
 */
export async function getShippingCost(
  wilayaCode: number,
  deliveryType: "home" | "desk",
): Promise<number | null> {
  const [rate] = await db
    .select()
    .from(shippingRates)
    .where(eq(shippingRates.wilayaCode, wilayaCode))
    .limit(1);

  if (!rate || !rate.isAvailable) return null;
  return deliveryType === "home" ? rate.homeDzd : rate.deskDzd;
}

/** Join on the code, never the name: commune transliterations vary. */
export async function communeBelongsToWilaya(
  communeId: number,
  wilayaCode: number,
): Promise<boolean> {
  const [row] = await db
    .select({ wilayaCode: communes.wilayaCode })
    .from(communes)
    .where(eq(communes.id, communeId))
    .limit(1);

  return row?.wilayaCode === wilayaCode;
}
