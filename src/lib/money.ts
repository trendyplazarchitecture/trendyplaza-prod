/**
 * Money is DZD centimes in `integer`, everywhere, end to end. `numeric`
 * returns a string from the driver and a float cannot hold a price. Nothing
 * divides by 100 except the formatter below.
 */
export const CENTIMES = 100;

export function toCentimes(dinars: number): number {
  return Math.round(dinars * CENTIMES);
}

export function toDinars(centimes: number): number {
  return centimes / CENTIMES;
}

/**
 * Prices in Algeria are quoted in whole dinars. Arabic uses the same Western
 * digits here (`ar-DZ` with `latn`), because that is how prices are written on
 * Algerian shopfronts and invoices, and Eastern Arabic numerals would read as
 * a foreign convention.
 */
export function formatDzd(centimes: number, locale: "fr" | "ar" = "fr"): string {
  const value = new Intl.NumberFormat(
    locale === "ar" ? "ar-DZ-u-nu-latn" : "fr-DZ",
    { maximumFractionDigits: centimes % CENTIMES === 0 ? 0 : 2 },
  ).format(toDinars(centimes));

  return locale === "ar" ? `${value} دج` : `${value} DA`;
}

/** Percent as whole points, amount as centimes. Never returns more than the subtotal. */
export function applyDiscount(
  subtotalCentimes: number,
  kind: "percent" | "amount",
  value: number,
): number {
  const discount =
    kind === "percent"
      ? Math.round((subtotalCentimes * value) / 100)
      : value;
  return Math.min(Math.max(discount, 0), subtotalCentimes);
}
