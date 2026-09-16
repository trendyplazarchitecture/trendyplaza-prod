import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import {
  addScope,
  close,
  db,
  prepareDatabase,
  schema,
  seedContentTree,
  seedMinimal,
} from "./helpers/db";
import {
  canReadModule,
  getActiveEntitlements,
  getEntitledModuleIds,
  grantEntitlement,
  listMyEntitlements,
  setEntitlementStatus,
} from "@/server/entitlements";

/**
 * Items 3, 4 and 5 in _AI_CONTEXT/08_TESTING.md.
 *
 * `getEntitledModuleIds` is wrapped in React's `cache`. Outside a request
 * scope that is a pass-through, so a test can pause an entitlement and read
 * again in the same file and see the new answer. This is exactly the behaviour
 * the application relies on: pause takes effect on the next page load because
 * every page re-resolves rather than trusting a session claim.
 */

let user: { id: string };
let pkg: { id: string };
let tree: Awaited<ReturnType<typeof seedContentTree>>;

const DAY = 24 * 60 * 60 * 1000;

/** The admin path, Path C in 02_DOMAIN.md. Straight to a row, no code in between. */
async function grant(overrides: Partial<typeof schema.entitlements.$inferInsert> = {}) {
  const [row] = await db
    .insert(schema.entitlements)
    .values({
      userId: user.id,
      packageId: pkg.id,
      source: "admin",
      status: "active",
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
  tree = await seedContentTree();
});

afterAll(async () => {
  await close();
});

/* --------------------------------------------------------------------------
 * Item 3. The one that matters most.
 * ----------------------------------------------------------------------- */

describe("entitlement scope resolution", () => {
  it("reaches the granted year and no further sideways", async () => {
    await addScope(pkg.id, "year", tree.years.L2.yearId);
    await grant();

    const reachable = await getEntitledModuleIds(user.id);

    expect(reachable.has(tree.years.L2.moduleId)).toBe(true);
    // The negative case, stated on its own because it is the one that costs
    // money when it is wrong: an L2 grant must not open L3.
    expect(reachable.has(tree.years.L3.moduleId)).toBe(false);
    expect(reachable.has(tree.years.L1.moduleId)).toBe(false);
    expect(reachable.size).toBe(1);

    expect(await canReadModule(user.id, tree.years.L2.moduleId)).toBe(true);
    expect(await canReadModule(user.id, tree.years.L3.moduleId)).toBe(false);
  });

  it("reaches every year below a university grant", async () => {
    await addScope(pkg.id, "university", tree.university.id);
    await grant();

    const reachable = await getEntitledModuleIds(user.id);

    expect(reachable.has(tree.years.L1.moduleId)).toBe(true);
    expect(reachable.has(tree.years.L2.moduleId)).toBe(true);
    expect(reachable.has(tree.years.L3.moduleId)).toBe(true);
  });

  it("does not reach a second university under a university grant", async () => {
    const other = await seedContentTree();
    await addScope(pkg.id, "university", tree.university.id);
    await grant();

    const reachable = await getEntitledModuleIds(user.id);

    expect(reachable.has(tree.years.L2.moduleId)).toBe(true);
    expect(reachable.has(other.years.L2.moduleId)).toBe(false);
  });

  it("reaches only the granted module under a module grant", async () => {
    await addScope(pkg.id, "module", tree.years.L2.moduleId);
    await grant();

    const reachable = await getEntitledModuleIds(user.id);

    expect([...reachable]).toEqual([tree.years.L2.moduleId]);
  });

  it("reaches the modules of the granted semester and nothing above it", async () => {
    await addScope(pkg.id, "semester", tree.years.L2.semesterId);
    await grant();

    const reachable = await getEntitledModuleIds(user.id);

    expect(reachable.has(tree.years.L2.moduleId)).toBe(true);
    expect(reachable.has(tree.years.L3.moduleId)).toBe(false);
  });

  it("unions two scopes rather than taking the narrower one", async () => {
    await addScope(pkg.id, "year", tree.years.L1.yearId);
    await addScope(pkg.id, "module", tree.years.L3.moduleId);
    await grant();

    const reachable = await getEntitledModuleIds(user.id);

    expect(reachable.has(tree.years.L1.moduleId)).toBe(true);
    expect(reachable.has(tree.years.L3.moduleId)).toBe(true);
    expect(reachable.has(tree.years.L2.moduleId)).toBe(false);
  });

  it("grants nothing when the user holds no entitlement", async () => {
    await addScope(pkg.id, "university", tree.university.id);

    expect((await getEntitledModuleIds(user.id)).size).toBe(0);
  });

  it("grants nothing when the package has no scopes attached", async () => {
    await grant();

    expect((await getEntitledModuleIds(user.id)).size).toBe(0);
  });

  it("drops a module whose branch has been archived", async () => {
    await addScope(pkg.id, "university", tree.university.id);
    await grant();

    // Archiving the semester, not the module: an archived node anywhere on the
    // chain has to take everything under it out of reach.
    await db
      .update(schema.semesters)
      .set({ archivedAt: new Date() })
      .where(eq(schema.semesters.id, tree.years.L2.semesterId));

    const reachable = await getEntitledModuleIds(user.id);

    expect(reachable.has(tree.years.L2.moduleId)).toBe(false);
    expect(reachable.has(tree.years.L3.moduleId)).toBe(true);
  });
});

/* --------------------------------------------------------------------------
 * Item 4. Expiry is a comparison, never a stored state.
 * ----------------------------------------------------------------------- */

describe("expiry at read time", () => {
  it("reads an entitlement past expires_at as expired with no job having run", async () => {
    // The row still says `active`. Nothing has touched it. This is the state
    // the database is in every morning before any cron would have fired.
    const row = await grant({ expiresAt: new Date(Date.now() - DAY) });
    expect(row.status).toBe("active");

    const [mine] = await listMyEntitlements(user.id, "fr");

    expect(mine.status).toBe("expired");
  });

  it("leaves the stored row alone while reading it as expired", async () => {
    const row = await grant({ expiresAt: new Date(Date.now() - DAY) });
    await listMyEntitlements(user.id, "fr");

    const [stored] = await db
      .select()
      .from(schema.entitlements)
      .where(eq(schema.entitlements.id, row.id));

    // A read is a read. Flipping the column here would be a write on a GET.
    expect(stored.status).toBe("active");
  });

  it("closes access the moment the expiry passes", async () => {
    await addScope(pkg.id, "year", tree.years.L2.yearId);
    await grant({ expiresAt: new Date(Date.now() + DAY) });

    expect(await canReadModule(user.id, tree.years.L2.moduleId)).toBe(true);

    await db
      .update(schema.entitlements)
      .set({ expiresAt: new Date(Date.now() - 1000) })
      .where(eq(schema.entitlements.userId, user.id));

    expect(await canReadModule(user.id, tree.years.L2.moduleId)).toBe(false);
    expect(await getActiveEntitlements(user.id)).toHaveLength(0);
  });

  it("treats a null expiry as unlimited rather than as expired", async () => {
    await addScope(pkg.id, "year", tree.years.L2.yearId);
    await grant({ expiresAt: null });

    const [mine] = await listMyEntitlements(user.id, "fr");

    expect(mine.status).toBe("active");
    expect(mine.expiresAt).toBeNull();
    expect(await canReadModule(user.id, tree.years.L2.moduleId)).toBe(true);
  });

  it("still shows an expired entitlement on the account screen", async () => {
    // An empty page reads as a lost account. The student needs to see that
    // access stopped, and when.
    await grant({ expiresAt: new Date(Date.now() - DAY) });

    const mine = await listMyEntitlements(user.id, "fr");

    expect(mine).toHaveLength(1);
    expect(mine[0].expiresAt).toBeInstanceOf(Date);
  });

  it("computes expiry against the duration a grant was given", async () => {
    const row = await grantEntitlement(
      { userId: user.id, packageId: pkg.id, source: "admin", durationDays: 180 },
      user.id,
    );

    const days = (row.expiresAt!.getTime() - Date.now()) / DAY;
    expect(days).toBeGreaterThan(179);
    expect(days).toBeLessThan(181);
  });
});

/* --------------------------------------------------------------------------
 * Item 5. Pause and revoke.
 * ----------------------------------------------------------------------- */

describe("paused and revoked entitlements", () => {
  beforeEach(async () => {
    await addScope(pkg.id, "year", tree.years.L2.yearId);
  });

  it("denies a paused entitlement on the very next read", async () => {
    const row = await grant();
    expect(await canReadModule(user.id, tree.years.L2.moduleId)).toBe(true);

    await setEntitlementStatus(row.id, "paused", user.id);

    expect(await canReadModule(user.id, tree.years.L2.moduleId)).toBe(false);
    expect((await getEntitledModuleIds(user.id)).size).toBe(0);
  });

  it("denies a revoked entitlement on the very next read", async () => {
    const row = await grant();
    await setEntitlementStatus(row.id, "revoked", user.id);

    expect(await canReadModule(user.id, tree.years.L2.moduleId)).toBe(false);
  });

  it("reopens access when a pause is lifted", async () => {
    const row = await grant();
    await setEntitlementStatus(row.id, "paused", user.id);
    await setEntitlementStatus(row.id, "active", user.id);

    expect(await canReadModule(user.id, tree.years.L2.moduleId)).toBe(true);
  });

  it("reports the paused state to the student rather than hiding the row", async () => {
    const row = await grant();
    await setEntitlementStatus(row.id, "paused", user.id);

    const [mine] = await listMyEntitlements(user.id, "fr");
    expect(mine.status).toBe("paused");
  });

  it("keeps a second live entitlement working when one is revoked", async () => {
    const [otherPkg] = await db
      .insert(schema.lmsPackages)
      .values({ titleEn: "Second pack", priceDzd: 300000 })
      .returning();
    await addScope(otherPkg.id, "year", tree.years.L3.yearId);

    const first = await grant();
    await grant({ packageId: otherPkg.id });

    await setEntitlementStatus(first.id, "revoked", user.id);

    expect(await canReadModule(user.id, tree.years.L2.moduleId)).toBe(false);
    expect(await canReadModule(user.id, tree.years.L3.moduleId)).toBe(true);
  });
});
