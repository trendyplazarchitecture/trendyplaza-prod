import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { close, db, prepareDatabase, schema, seedMinimal } from "./helpers/db";
import { lookupCode, redeemCode, voidCode } from "@/server/codes";
import { normaliseCode } from "@/lib/codes";

/**
 * The support desk tool. Its whole value is answering "who used this card",
 * so the test that matters is that the holder comes back attached to the
 * right code, and that a typed-in code with the wrong shape still finds it.
 */

let user: { id: string; name: string; email: string };
let pkg: { id: string };

async function insertCode(code: string) {
  const [row] = await db
    .insert(schema.accessCodes)
    .values({ code: normaliseCode(code), packageId: pkg.id, durationDays: 180 })
    .returning();
  return row;
}

beforeEach(async () => {
  await prepareDatabase();
  const seeded = await seedMinimal();
  user = seeded.user;
  pkg = seeded.pkg;
});

afterAll(async () => {
  await close();
});

describe("code lookup", () => {
  it("reports an unused code as usable, with no holder", async () => {
    await insertCode("TPS1UNUSED000001");

    const result = await lookupCode("TPS1UNUSED000001");

    expect(result.found).toBe(true);
    expect(result.state).toBe("unused");
    expect(result.holder).toBeNull();
    expect(result.durationDays).toBe(180);
  });

  it("names the student who redeemed it", async () => {
    await insertCode("TPS1TAKEN0000001");
    await redeemCode("TPS1TAKEN0000001", user.id);

    const result = await lookupCode("TPS1TAKEN0000001");

    expect(result.state).toBe("redeemed");
    expect(result.holder?.userId).toBe(user.id);
    expect(result.holder?.email).toBe(user.email);
    // The entitlement this code produced, not merely one the holder happens
    // to have.
    expect(result.holder?.entitlementStatus).toBe("active");
    expect(result.redeemedAt).toBeInstanceOf(Date);
  });

  it("finds a code typed with dashes, lower case and confusable characters", async () => {
    await insertCode("TPS1READABLE2345");

    // What an operator types after hearing it read aloud down a phone.
    const result = await lookupCode("  tpsi-read-able2-345 ");

    expect(result.found).toBe(true);
    // "READABLE" contains an L, which folds to 1. Asserting against the
    // fold rather than a hand-typed literal is the point: the stored code and
    // the typed code go through the same function.
    expect(result.normalised).toBe(normaliseCode("TPS1READABLE2345"));
  });

  it("reports a voided code with its reason", async () => {
    const row = await insertCode("TPS1VOIDED000002");
    await voidCode(row.id, "Card damaged in the box", user.id);

    const result = await lookupCode("TPS1VOIDED000002");

    expect(result.state).toBe("void");
    expect(result.voidReason).toBe("Card damaged in the box");
  });

  it("reports a miss without inventing a record", async () => {
    const result = await lookupCode("TPS1NOTHINGHERE0");

    expect(result.found).toBe(false);
    // The normalised form comes back so the operator can read it against the
    // card and spot their own typo.
    expect(result.normalised).toBe(normaliseCode("TPS1NOTHINGHERE0"));
    expect(result.holder).toBeUndefined();
  });

  it("returns a miss rather than throwing on empty input", async () => {
    expect((await lookupCode("   ")).found).toBe(false);
  });
});
