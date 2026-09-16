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
  getCarryOn,
  listMyProgress,
  recordView,
} from "@/server/progress";

/**
 * Reading progress, the write path behind the student dashboard.
 *
 * Two properties matter more than the counting. First, "complete" has to be
 * recomputed rather than incremented, because the client adds resources to
 * live modules and a module that grows must stop being finished. Second,
 * progress outlives an entitlement, and the dashboard must never offer a way
 * back into content the student no longer holds: the link would 403 and the
 * student would think the site was broken rather than that their pack ran out.
 */

let user: { id: string };
let pkg: { id: string };
let tree: Awaited<ReturnType<typeof seedContentTree>>;

/** A second resource inside the L2 module, so a module can be part-read. */
async function addResourceToL2(title = "Second lecture") {
  const [row] = await db
    .insert(schema.resources)
    .values({
      moduleId: tree.years.L2.moduleId,
      resourceTypeId: tree.resourceType.id,
      titleEn: title,
      source: "file",
      filePath: `resources/${crypto.randomUUID()}.pdf`,
    })
    .returning();
  return row;
}

async function entitleToL2() {
  await addScope(pkg.id, "year", tree.years.L2.yearId);
  await db
    .insert(schema.entitlements)
    .values({ userId: user.id, packageId: pkg.id, source: "admin", status: "active" });
}

async function progressRow() {
  const [row] = await db
    .select()
    .from(schema.moduleProgress)
    .where(eq(schema.moduleProgress.userId, user.id));
  return row;
}

beforeEach(async () => {
  await prepareDatabase();
  const seeded = await seedMinimal();
  user = seeded.user;
  pkg = seeded.pkg;
  tree = await seedContentTree();
  await entitleToL2();
});

afterAll(async () => {
  await close();
});

describe("recordView", () => {
  it("writes the event and opens the module's progress", async () => {
    await recordView(user.id, tree.years.L2.resourceId, tree.years.L2.moduleId);

    const views = await db.select().from(schema.resourceViews);
    expect(views).toHaveLength(1);

    const row = await progressRow();
    expect(row.viewedCount).toBe(1);
    expect(row.lastResourceId).toBe(tree.years.L2.resourceId);
  });

  it("counts every open, not every distinct resource", async () => {
    // Opening the same file three times is three views. The dashboard shows
    // distinct resources seen; the counter is for the admin.
    for (let i = 0; i < 3; i += 1) {
      await recordView(user.id, tree.years.L2.resourceId, tree.years.L2.moduleId);
    }

    expect(await db.select().from(schema.resourceViews)).toHaveLength(3);
    expect((await progressRow()).viewedCount).toBe(3);
  });

  it("marks a module complete when its only resource is opened", async () => {
    await recordView(user.id, tree.years.L2.resourceId, tree.years.L2.moduleId);

    expect((await progressRow()).completedAt).toBeInstanceOf(Date);
  });

  it("does not mark complete while a resource is unread", async () => {
    await addResourceToL2();
    await recordView(user.id, tree.years.L2.resourceId, tree.years.L2.moduleId);

    expect((await progressRow()).completedAt).toBeNull();
  });

  it("un-completes a module that gains a resource", async () => {
    // The case that makes recomputing worth it. The client adds a TD to a
    // module in October; a student who finished it in September has not read
    // the new one, and the dashboard must stop claiming they have.
    await recordView(user.id, tree.years.L2.resourceId, tree.years.L2.moduleId);
    expect((await progressRow()).completedAt).toBeInstanceOf(Date);

    const extra = await addResourceToL2();
    // Any subsequent view recomputes. Opening the original again is enough.
    await recordView(user.id, tree.years.L2.resourceId, tree.years.L2.moduleId);
    expect((await progressRow()).completedAt).toBeNull();

    await recordView(user.id, extra.id, tree.years.L2.moduleId);
    expect((await progressRow()).completedAt).toBeInstanceOf(Date);
  });

  it("ignores a hidden or archived resource when deciding completeness", async () => {
    const hidden = await addResourceToL2("Draft, not for students");
    await db
      .update(schema.resources)
      .set({ isVisible: false })
      .where(eq(schema.resources.id, hidden.id));

    await recordView(user.id, tree.years.L2.resourceId, tree.years.L2.moduleId);

    // The student cannot open it, so it cannot be what keeps them at 99%.
    expect((await progressRow()).completedAt).toBeInstanceOf(Date);
  });
});

describe("listMyProgress", () => {
  it("reports seen against total", async () => {
    await addResourceToL2();
    await recordView(user.id, tree.years.L2.resourceId, tree.years.L2.moduleId);

    const [row] = await listMyProgress(user.id, "en");
    expect(row.total).toBe(2);
    expect(row.seen).toBe(1);
    expect(row.completedAt).toBeNull();
    expect(row.moduleName).toBe("L2 Atelier");
  });

  it("does not double-count a resource opened twice", async () => {
    await addResourceToL2();
    await recordView(user.id, tree.years.L2.resourceId, tree.years.L2.moduleId);
    await recordView(user.id, tree.years.L2.resourceId, tree.years.L2.moduleId);

    const [row] = await listMyProgress(user.id, "en");
    expect(row.seen).toBe(1);
  });

  it("drops a module the student is no longer entitled to", async () => {
    await recordView(user.id, tree.years.L2.resourceId, tree.years.L2.moduleId);
    expect(await listMyProgress(user.id, "en")).toHaveLength(1);

    await db
      .update(schema.entitlements)
      .set({ status: "revoked" })
      .where(eq(schema.entitlements.userId, user.id));

    // The rows stay in the database; the dashboard stops offering them.
    expect(await listMyProgress(user.id, "en")).toHaveLength(0);
    expect(await db.select().from(schema.moduleProgress)).toHaveLength(1);
  });

  it("drops a module whose branch was archived", async () => {
    await recordView(user.id, tree.years.L2.resourceId, tree.years.L2.moduleId);
    await db
      .update(schema.modules)
      .set({ archivedAt: new Date() })
      .where(eq(schema.modules.id, tree.years.L2.moduleId));

    expect(await listMyProgress(user.id, "en")).toHaveLength(0);
  });

  it("returns nothing for a student who has read nothing", async () => {
    expect(await listMyProgress(user.id, "en")).toEqual([]);
  });
});

describe("getCarryOn", () => {
  it("returns the most recently opened resource", async () => {
    const second = await addResourceToL2();
    await recordView(user.id, tree.years.L2.resourceId, tree.years.L2.moduleId);
    await recordView(user.id, second.id, tree.years.L2.moduleId);

    const carry = await getCarryOn(user.id, "en");
    expect(carry?.resourceId).toBe(second.id);
    expect(carry?.moduleName).toBe("L2 Atelier");
    expect(carry?.universitySlug).toBe(tree.university.slug);
  });

  it("skips a resource in a module the student no longer holds", async () => {
    // Read L3 while entitled to it, then lose it and read L2.
    await addScope(pkg.id, "year", tree.years.L3.yearId);
    await recordView(user.id, tree.years.L2.resourceId, tree.years.L2.moduleId);
    await recordView(user.id, tree.years.L3.resourceId, tree.years.L3.moduleId);
    expect((await getCarryOn(user.id, "en"))?.moduleId).toBe(tree.years.L3.moduleId);

    await db
      .delete(schema.packageContents)
      .where(eq(schema.packageContents.scopeId, tree.years.L3.yearId));

    // Falls back to the most recent one they can still open, rather than
    // offering a link that 403s.
    expect((await getCarryOn(user.id, "en"))?.moduleId).toBe(tree.years.L2.moduleId);
  });

  it("returns null for a student who has read nothing", async () => {
    expect(await getCarryOn(user.id, "en")).toBeNull();
  });

  it("returns null when the resource was archived after being read", async () => {
    await recordView(user.id, tree.years.L2.resourceId, tree.years.L2.moduleId);
    await db
      .update(schema.resources)
      .set({ archivedAt: new Date() })
      .where(eq(schema.resources.id, tree.years.L2.resourceId));

    expect(await getCarryOn(user.id, "en")).toBeNull();
  });
});
