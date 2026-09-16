import { describe, expect, it } from "vitest";
import { bestOffer, offerLadder, priceLine, type Offer } from "@/lib/offers";

/**
 * Quantity offers. Not one of the thirteen in `08_TESTING.md`, because they did
 * not exist when that list was written, but it is money and it is arithmetic
 * three screens depend on agreeing about, so it is tested to the same standard.
 *
 * 2500 DA is 250000 centimes throughout.
 */

const LIST = 250000;

const tiers: Offer[] = [
  { minQuantity: 2, kind: "percent", value: 10 },
  { minQuantity: 3, kind: "unit_price", value: 180000 },
];

describe("bestOffer", () => {
  it("returns nothing below the lowest threshold", () => {
    expect(bestOffer(tiers, 1, LIST)).toBeNull();
  });

  it("takes the tier at exactly its threshold", () => {
    expect(bestOffer(tiers, 2, LIST)?.minQuantity).toBe(2);
    expect(bestOffer(tiers, 3, LIST)?.minQuantity).toBe(3);
  });

  it("treats a threshold as at-or-above, not an exact count", () => {
    // Four packs gets the 3+ deal. Anything else is a shop that punishes
    // someone for buying more.
    expect(bestOffer(tiers, 4, LIST)?.minQuantity).toBe(3);
    expect(bestOffer(tiers, 20, LIST)?.minQuantity).toBe(3);
  });

  it("picks the cheapest outcome, not the last row entered", () => {
    // The client enters a worse deal at a higher quantity by mistake. A
    // customer buying five must not pay more than one buying three.
    const muddled: Offer[] = [
      { minQuantity: 3, kind: "unit_price", value: 180000 },
      { minQuantity: 5, kind: "percent", value: 5 },
    ];
    expect(bestOffer(muddled, 5, LIST)?.minQuantity).toBe(3);
  });

  it("ignores a tier that does not beat the list price", () => {
    expect(bestOffer([{ minQuantity: 2, kind: "percent", value: 0 }], 5, LIST)).toBeNull();
    expect(
      bestOffer([{ minQuantity: 2, kind: "unit_price", value: LIST }], 5, LIST),
    ).toBeNull();
    expect(
      bestOffer([{ minQuantity: 2, kind: "unit_price", value: LIST + 50000 }], 5, LIST),
    ).toBeNull();
  });

  it("ignores a threshold below two, which is a discount not an offer", () => {
    expect(bestOffer([{ minQuantity: 1, kind: "percent", value: 50 }], 5, LIST)).toBeNull();
    expect(bestOffer([{ minQuantity: 0, kind: "percent", value: 50 }], 5, LIST)).toBeNull();
  });

  it("returns nothing when there are no tiers", () => {
    expect(bestOffer([], 10, LIST)).toBeNull();
  });
});

describe("priceLine", () => {
  it("charges the list price when nothing applies", () => {
    const line = priceLine(LIST, 1, tiers);
    expect(line.unitDzd).toBe(LIST);
    expect(line.totalDzd).toBe(LIST);
    expect(line.savingDzd).toBe(0);
    expect(line.applied).toBeNull();
  });

  it("applies a percent tier per unit", () => {
    const line = priceLine(LIST, 2, tiers);
    expect(line.unitDzd).toBe(225000);
    expect(line.totalDzd).toBe(450000);
    expect(line.savingDzd).toBe(50000);
  });

  it("applies a unit-price tier", () => {
    const line = priceLine(LIST, 3, tiers);
    expect(line.unitDzd).toBe(180000);
    expect(line.totalDzd).toBe(540000);
    expect(line.savingDzd).toBe(210000);
  });

  it("never returns a negative price or a saving above the list total", () => {
    const absurd: Offer[] = [{ minQuantity: 2, kind: "percent", value: 500 }];
    const line = priceLine(LIST, 2, absurd);
    expect(line.unitDzd).toBe(0);
    expect(line.totalDzd).toBe(0);
    expect(line.savingDzd).toBe(LIST * 2);
  });

  it("keeps everything in whole centimes", () => {
    // 33% of 2500 DA does not divide cleanly. A fraction of a centime in a
    // price column is how a total stops reconciling.
    const line = priceLine(LIST, 3, [{ minQuantity: 3, kind: "percent", value: 33 }]);
    expect(Number.isInteger(line.unitDzd)).toBe(true);
    expect(Number.isInteger(line.totalDzd)).toBe(true);
    expect(line.totalDzd).toBe(line.unitDzd * 3);
  });

  it("works with no tiers at all", () => {
    const line = priceLine(LIST, 4);
    expect(line.totalDzd).toBe(LIST * 4);
    expect(line.savingDzd).toBe(0);
  });
});

describe("offerLadder", () => {
  it("advertises each tier with the price it lands on, cheapest quantity first", () => {
    const ladder = offerLadder(LIST, [...tiers].reverse());

    expect(ladder).toEqual([
      { minQuantity: 2, unitDzd: 225000, totalDzd: 450000, savingDzd: 50000 },
      { minQuantity: 3, unitDzd: 180000, totalDzd: 540000, savingDzd: 210000 },
    ]);
  });

  it("drops a tier that saves nothing rather than advertising it", () => {
    const ladder = offerLadder(LIST, [
      { minQuantity: 2, kind: "percent", value: 0 },
      { minQuantity: 3, kind: "unit_price", value: 180000 },
    ]);

    expect(ladder).toHaveLength(1);
    expect(ladder[0].minQuantity).toBe(3);
  });

  it("returns nothing when a product has no offers", () => {
    expect(offerLadder(LIST, [])).toEqual([]);
  });
});
