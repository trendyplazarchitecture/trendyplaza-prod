import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { close, db, prepareDatabase, schema, seedMinimal } from "./helpers/db";
import { redeemCode, voidCode } from "@/server/codes";
import { normaliseCode } from "@/lib/codes";

/**
 * Item 1 in _AI_CONTEXT/08_TESTING.md, and the most important test in the
 * project. A read-then-write redemption passes every manual test and fails the
 * first time two tabs are open.
 */

let user: { id: string };
let pkg: { id: string };

/**
 * Codes are stored in canonical form. `generateCode` guarantees that in
 * production; the fixture goes through the same fold so the test cannot pass
 * against data the application would never write.
 */
async function insertCode(code: string, overrides: Record<string, unknown> = {}) {
  const [row] = await db
    .insert(schema.accessCodes)
    .values({
      code: normaliseCode(code),
      packageId: pkg.id,
      durationDays: 180,
      ...overrides,
    })
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

describe("code redemption", () => {
  it("produces exactly one entitlement under concurrent redemption", async () => {
    await insertCode("TPS1CONCURRENT01");

    const attempts = 8;
    const results = await Promise.all(
      Array.from({ length: attempts }, () =>
        redeemCode("TPS1CONCURRENT01", user.id),
      ),
    );

    const succeeded = results.filter((r) => r.ok);
    const refused = results.filter((r) => !r.ok);

    expect(succeeded).toHaveLength(1);
    expect(refused).toHaveLength(attempts - 1);
    // Every refusal is a clean, named reason, not a thrown error.
    for (const r of refused) {
      expect(r.ok).toBe(false);
      if (!r.ok) {
        expect(["already_redeemed", "already_entitled"]).toContain(r.reason);
      }
    }

    const rows = await db
      .select()
      .from(schema.entitlements)
      .where(eq(schema.entitlements.userId, user.id));
    expect(rows).toHaveLength(1);
  });

  it("refuses a second redemption and says why", async () => {
    await insertCode("TPS1SECONDTRY001");

    const first = await redeemCode("TPS1SECONDTRY001", user.id);
    const second = await redeemCode("TPS1SECONDTRY001", user.id);

    expect(first.ok).toBe(true);
    expect(second).toEqual({ ok: false, reason: "already_redeemed" });
  });

  it("refuses a voided code", async () => {
    const row = await insertCode("TPS1VOIDED000001");
    await voidCode(row.id, "Carte perdue", user.id);

    const result = await redeemCode("TPS1VOIDED000001", user.id);
    expect(result).toEqual({ ok: false, reason: "voided" });
  });

  it("refuses an unknown code", async () => {
    const result = await redeemCode("TPS1NOSUCHCODE00", user.id);
    expect(result).toEqual({ ok: false, reason: "not_found" });
  });

  it("accepts a code typed with dashes, lower case and confusable characters", async () => {
    // Stored form has no separators; the student reads `I` off the card where
    // the code carries a `1`.
    await insertCode("TPS1READABLE2345");

    const result = await redeemCode("tpsi-read-able2-345", user.id);
    expect(result.ok).toBe(true);
  });

  it("leaves a code unused when the holder already owns the package", async () => {
    await insertCode("TPS1FIRSTCODE001");
    await insertCode("TPS1SECONDCODE02");

    expect((await redeemCode("TPS1FIRSTCODE001", user.id)).ok).toBe(true);

    const second = await redeemCode("TPS1SECONDCODE02", user.id);
    expect(second).toEqual({ ok: false, reason: "already_entitled" });

    // The refusal must not burn the card: it goes back in the box unused.
    const [row] = await db
      .select()
      .from(schema.accessCodes)
      .where(eq(schema.accessCodes.code, normaliseCode("TPS1SECONDCODE02")));
    expect(row.isRedeemed).toBe(false);
    expect(row.redeemedByUserId).toBeNull();
  });
});
