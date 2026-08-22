import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { and, eq, isNull } from "drizzle-orm";
import {
  close,
  db,
  prepareDatabase,
  schema,
  seedContentTree,
  seedMinimal,
} from "./helpers/db";

/**
 * The server-action layer, which until now had no tests at all.
 *
 * That gap is how `setUserPermissionsAction` shipped validating a `text` id as
 * a uuid and rejecting every real account: the module under it was tested, the
 * action on top of it was not. These cover the actions themselves, permission
 * check and Zod parsing included.
 *
 * The session is stubbed, exactly as in `tests/resource-access.test.ts`.
 * Everything downstream is real.
 */

/**
 * `revalidatePath` is Next telling its own cache to drop a route. It needs a
 * request context that does not exist outside the server, and it is not the
 * behaviour under test: whether the row was written is.
 */
vi.mock("next/cache", () => ({
  revalidatePath: () => {},
  revalidateTag: () => {},
}));

const actor = vi.hoisted(() => ({
  value: null as { id: string; state: string; permissions: Set<string> } | null,
}));

vi.mock("@/server/session", async () => {
  const { AuthError } = await vi.importActual<typeof import("@/server/session")>(
    "@/server/session",
  );
  return {
    AuthError,
    getCurrentUser: async () => actor.value,
    requireUser: async () => {
      if (!actor.value) throw new AuthError("unauthenticated", "Sign in required.");
      return actor.value;
    },
    requirePermission: async (permission: string) => {
      if (!actor.value) throw new AuthError("unauthenticated", "Sign in required.");
      if (!actor.value.permissions.has(permission)) {
        throw new AuthError("forbidden", `Missing permission: ${permission}`);
      }
      return actor.value;
    },
  };
});

const { duplicateModuleAction, reorderResourcesAction } = await import(
  "@/server/actions/content"
);

let admin: { id: string };
let tree: Awaited<ReturnType<typeof seedContentTree>>;

async function resourcesIn(moduleId: string) {
  return db
    .select()
    .from(schema.resources)
    .where(and(eq(schema.resources.moduleId, moduleId), isNull(schema.resources.archivedAt)))
    .orderBy(schema.resources.position);
}

beforeEach(async () => {
  await prepareDatabase();
  const seeded = await seedMinimal();
  admin = seeded.user;
  tree = await seedContentTree();
  actor.value = {
    id: admin.id,
    state: "active",
    permissions: new Set(["content.manage"]),
  };
});

afterAll(async () => {
  await close();
});

describe("duplicateModuleAction", () => {
  it("copies the module and its resources into another semester", async () => {
    const result = await duplicateModuleAction({
      moduleId: tree.years.L2.moduleId,
      targetSemesterId: tree.years.L3.semesterId,
    });

    expect(result.ok).toBe(true);

    const copies = await db
      .select()
      .from(schema.modules)
      .where(eq(schema.modules.semesterId, tree.years.L3.semesterId));

    // The original L3 module, plus the copy.
    expect(copies).toHaveLength(2);
    const copy = copies.find((m) => m.id !== tree.years.L3.moduleId)!;
    expect(copy.nameEn).toBe("L2 Atelier");
    expect(await resourcesIn(copy.id)).toHaveLength(1);
  });

  it("arrives hidden, so it can be renamed before students see it", async () => {
    await duplicateModuleAction({
      moduleId: tree.years.L2.moduleId,
      targetSemesterId: tree.years.L3.semesterId,
    });

    const copy = (
      await db
        .select()
        .from(schema.modules)
        .where(eq(schema.modules.semesterId, tree.years.L3.semesterId))
    ).find((m) => m.id !== tree.years.L3.moduleId)!;

    expect(copy.isVisible).toBe(false);
  });

  it("copies rather than shares, so editing one does not change the other", async () => {
    // The rule in 02_DOMAIN.md: reuse is a copy of the resources, never a
    // shared reference, or one university editing their material silently
    // rewrites another's.
    await duplicateModuleAction({
      moduleId: tree.years.L2.moduleId,
      targetSemesterId: tree.years.L3.semesterId,
    });

    const copy = (
      await db
        .select()
        .from(schema.modules)
        .where(eq(schema.modules.semesterId, tree.years.L3.semesterId))
    ).find((m) => m.id !== tree.years.L3.moduleId)!;

    const [copied] = await resourcesIn(copy.id);
    await db
      .update(schema.resources)
      .set({ titleEn: "Renamed on the copy" })
      .where(eq(schema.resources.id, copied.id));

    const [original] = await resourcesIn(tree.years.L2.moduleId);
    expect(original.titleEn).toBe("L2 lecture");
    expect(original.id).not.toBe(copied.id);
  });

  it("points both rows at the same stored file rather than duplicating bytes", async () => {
    await duplicateModuleAction({
      moduleId: tree.years.L2.moduleId,
      targetSemesterId: tree.years.L3.semesterId,
    });

    const copy = (
      await db
        .select()
        .from(schema.modules)
        .where(eq(schema.modules.semesterId, tree.years.L3.semesterId))
    ).find((m) => m.id !== tree.years.L3.moduleId)!;

    const [original] = await resourcesIn(tree.years.L2.moduleId);
    const [copied] = await resourcesIn(copy.id);

    // Deliberate: the bytes are immutable and nothing ever writes to a stored
    // file, so copying a 200 MB course pack per university would fill the disk
    // to no purpose.
    expect(copied.filePath).toBe(original.filePath);
  });

  it("leaves the source module untouched", async () => {
    await duplicateModuleAction({
      moduleId: tree.years.L2.moduleId,
      targetSemesterId: tree.years.L3.semesterId,
    });

    const [source] = await db
      .select()
      .from(schema.modules)
      .where(eq(schema.modules.id, tree.years.L2.moduleId));

    expect(source.isVisible).toBe(true);
    expect(source.semesterId).toBe(tree.years.L2.semesterId);
    expect(await resourcesIn(tree.years.L2.moduleId)).toHaveLength(1);
  });

  it("refuses a module that does not exist", async () => {
    const result = await duplicateModuleAction({
      moduleId: crypto.randomUUID(),
      targetSemesterId: tree.years.L3.semesterId,
    });

    expect(result).toEqual({ ok: false, message: "That module no longer exists." });
  });

  it("refuses an archived target semester", async () => {
    await db
      .update(schema.semesters)
      .set({ archivedAt: new Date() })
      .where(eq(schema.semesters.id, tree.years.L3.semesterId));

    const result = await duplicateModuleAction({
      moduleId: tree.years.L2.moduleId,
      targetSemesterId: tree.years.L3.semesterId,
    });

    expect(result.ok).toBe(false);
  });

  it("refuses an account without content.manage", async () => {
    actor.value = { id: admin.id, state: "active", permissions: new Set(["orders.view"]) };

    await expect(
      duplicateModuleAction({
        moduleId: tree.years.L2.moduleId,
        targetSemesterId: tree.years.L3.semesterId,
      }),
    ).rejects.toThrow(/content.manage/);
  });

  it("refuses a signed-out caller", async () => {
    actor.value = null;

    await expect(
      duplicateModuleAction({
        moduleId: tree.years.L2.moduleId,
        targetSemesterId: tree.years.L3.semesterId,
      }),
    ).rejects.toThrow(/Sign in/);
  });
});

describe("reorderResourcesAction", () => {
  it("writes the order it was given", async () => {
    const extra = await db
      .insert(schema.resources)
      .values({
        moduleId: tree.years.L2.moduleId,
        resourceTypeId: tree.resourceType.id,
        titleEn: "Second",
        source: "file",
        filePath: `resources/${crypto.randomUUID()}.pdf`,
        position: 5,
      })
      .returning();

    const before = await resourcesIn(tree.years.L2.moduleId);
    const reversed = [...before].reverse().map((r) => r.id);

    const result = await reorderResourcesAction({
      moduleId: tree.years.L2.moduleId,
      resourceIds: reversed,
    });

    expect(result.ok).toBe(true);
    const after = await resourcesIn(tree.years.L2.moduleId);
    expect(after.map((r) => r.id)).toEqual(reversed);
    expect(after[0].id).toBe(extra[0].id);
  });

  it("will not move a resource that belongs to another module", async () => {
    // The module id is in the WHERE clause, so a posted id from elsewhere
    // matches nothing rather than being silently renumbered into this module.
    const [l3] = await resourcesIn(tree.years.L3.moduleId);

    await reorderResourcesAction({
      moduleId: tree.years.L2.moduleId,
      resourceIds: [l3.id],
    });

    const [after] = await db
      .select()
      .from(schema.resources)
      .where(eq(schema.resources.id, l3.id));
    expect(after.moduleId).toBe(tree.years.L3.moduleId);
    expect(after.position).toBe(l3.position);
  });

  it("refuses an account without content.manage", async () => {
    actor.value = { id: admin.id, state: "active", permissions: new Set() };

    await expect(
      reorderResourcesAction({ moduleId: tree.years.L2.moduleId, resourceIds: [] }),
    ).rejects.toThrow(/content.manage/);
  });
});
