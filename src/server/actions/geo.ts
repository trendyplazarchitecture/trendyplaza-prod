"use server";

import { z } from "zod";

import { getShippingCost, listCommunes } from "@/server/geo";
import type { Locale } from "@/lib/i18n-content";

/**
 * Communes, one wilaya at a time.
 *
 * The full dataset is 1,541 rows and 160 KB. Shipping it to a phone on mobile
 * data so a dropdown can filter it locally would spend the entire performance
 * budget on data the visitor will use one row of. Wilayas come down as props,
 * because 69 rows is nothing; communes come down on demand.
 */
const communesInput = z.object({
  wilayaCode: z.coerce.number().int().min(1).max(99),
  locale: z.enum(["en", "ar", "fr"]),
});

export async function communesForWilayaAction(input: z.infer<typeof communesInput>) {
  const { wilayaCode, locale } = communesInput.parse(input);
  return listCommunes(wilayaCode, locale as Locale);
}

const shippingInput = z.object({
  wilayaCode: z.coerce.number().int().min(1).max(99),
  deliveryType: z.enum(["home", "desk"]),
});

/**
 * The authoritative figure. The checkout shows what this returns, and
 * `placeOrder` recomputes it server-side anyway, because a price the browser
 * posted is a price the browser could have edited.
 */
export async function shippingCostAction(input: z.infer<typeof shippingInput>) {
  const { wilayaCode, deliveryType } = shippingInput.parse(input);
  return { costDzd: await getShippingCost(wilayaCode, deliveryType) };
}
