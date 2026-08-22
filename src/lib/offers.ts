/**
 * Quantity offers, resolved.
 *
 * This is money, and three places need the same answer: the product page that
 * advertises the offer, the cart that previews the total, and `placeOrder`
 * which is the only one that counts. A pure function they all call is the only
 * way they cannot drift apart, and it is the reason this file has no database
 * import and can be tested without one.
 *
 * Everything here is DZD centimes in integers, as everywhere else.
 */

export type OfferKind = "percent" | "unit_price";

export type Offer = {
  minQuantity: number;
  kind: OfferKind;
  /** Percent as whole points (10 = 10%), unit price as centimes. */
  value: number;
};

export type PricedLine = {
  /** The list price of one unit, before any offer. */
  listUnitDzd: number;
  /** What one unit actually costs at this quantity. */
  unitDzd: number;
  quantity: number;
  /** `unitDzd * quantity`. */
  totalDzd: number;
  /** What the offer saves against the list price, across the whole line. */
  savingDzd: number;
  /** The tier that applied, or null when none did. */
  applied: Offer | null;
};

/**
 * The best tier at this quantity, or null.
 *
 * `minQuantity` is a threshold, not an exact count: tiers at 2, 3 and 5 mean
 * someone buying four gets the 3+ tier. That is what a customer expects and
 * what the person behind the counter would do.
 *
 * "Best" is measured in resulting unit price, not in the order the client
 * happened to enter the rows. A client who sets a worse deal at a higher
 * quantity by mistake does not get to charge a customer more for buying more.
 */
export function bestOffer(
  offers: readonly Offer[],
  quantity: number,
  listUnitDzd: number,
): Offer | null {
  let best: Offer | null = null;
  let bestUnit = listUnitDzd;

  for (const offer of offers) {
    if (!Number.isFinite(offer.minQuantity) || offer.minQuantity < 2) continue;
    if (quantity < offer.minQuantity) continue;

    const unit = unitPriceUnder(offer, listUnitDzd);
    // An offer that does not beat the list price is not an offer. Ties keep
    // the first one, so the resolution is stable.
    if (unit < bestUnit) {
      bestUnit = unit;
      best = offer;
    }
  }

  return best;
}

/** One unit under one offer, clamped so an offer can never make a price negative. */
function unitPriceUnder(offer: Offer, listUnitDzd: number): number {
  if (offer.kind === "unit_price") {
    return clamp(Math.round(offer.value), 0, listUnitDzd);
  }

  const percent = clamp(offer.value, 0, 100);
  return clamp(Math.round((listUnitDzd * (100 - percent)) / 100), 0, listUnitDzd);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Prices one cart line. The single entry point; nothing else multiplies a
 * price by a quantity.
 */
export function priceLine(
  listUnitDzd: number,
  quantity: number,
  offers: readonly Offer[] = [],
): PricedLine {
  const applied = bestOffer(offers, quantity, listUnitDzd);
  const unitDzd = applied ? unitPriceUnder(applied, listUnitDzd) : listUnitDzd;

  return {
    listUnitDzd,
    unitDzd,
    quantity,
    totalDzd: unitDzd * quantity,
    savingDzd: (listUnitDzd - unitDzd) * quantity,
    applied,
  };
}

/**
 * What the product page advertises before anything is in the cart: each tier
 * with the price it lands on, cheapest quantity first.
 *
 * Tiers that do not beat the list price are dropped rather than displayed as
 * an offer that saves nothing.
 */
export function offerLadder(
  listUnitDzd: number,
  offers: readonly Offer[],
): { minQuantity: number; unitDzd: number; totalDzd: number; savingDzd: number }[] {
  return offers
    .filter((o) => o.minQuantity >= 2)
    .map((o) => {
      const unitDzd = unitPriceUnder(o, listUnitDzd);
      return {
        minQuantity: o.minQuantity,
        unitDzd,
        totalDzd: unitDzd * o.minQuantity,
        savingDzd: (listUnitDzd - unitDzd) * o.minQuantity,
      };
    })
    .filter((tier) => tier.savingDzd > 0)
    .sort((a, b) => a.minQuantity - b.minQuantity);
}
