import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";
import { close, db, prepareDatabase, schema, seedMinimal } from "./helpers/db";

/**
 * NextPhase/03-library — the streaming route is the only path from the web
 * to a library item's file, so it is tested the same way
 * `resource-access.test.ts` tests `/api/resource/[id]`: called with a
 * Request, asserted on status and headers. `resolveLibraryItemAccess`
 * returns the same discriminated union as `resolveResourceAccess` and is
 * covered separately, without HTTP.
 *
 * The one real difference from the university tree: gating is per-item
 * (`isGated`), not always required. An ungated item must open for a
 * signed-in user holding no entitlement at all — that is the behaviour this
 * plan actually adds, so it gets its own describe block.
 */

const currentUser = vi.hoisted(() => ({
  value: null as { id: string; state: "on_hold" | "active" | "suspended" } | null,
}));

vi.mock("@/server/session", () => ({
  getCurrentUser: async () => currentUser.value,
}));

const { GET } = await import("../app/api/library-item/[id]/route");
const { resolveLibraryItemAccess } = await import("@/server/library-items");

const STORAGE_ROOT = path.resolve(process.env.STORAGE_ROOT ?? "./.storage");
const written: string[] = [];

let user: { id: string };
let pkg: { id: string };
let categoryId: string;

async function writeStoredFile(relativePath: string, contents: string) {
  const absolute = path.join(STORAGE_ROOT, relativePath);
  await mkdir(path.dirname(absolute), { recursive: true });
  await writeFile(absolute, contents);
  written.push(absolute);
}

function request(range?: string) {
  return new Request("http://localhost/api/library-item/x", {
    headers: range ? { range } : undefined,
  }) as never;
}

function call(id: string, range?: string) {
  return GET(request(range), { params: Promise.resolve({ id }) });
}

/** `truncateAll` (`helpers/db.ts`) clears every table between tests, `library_categories` included — unlike the migration's own one-time seed insert, a category has to exist per test. */
async function createCategory() {
  const [row] = await db
    .insert(schema.libraryCategories)
    .values({ key: "book", labelEn: "Books & eBooks" })
    .returning();
  return row.id;
}

async function createItem(overrides: Partial<typeof schema.libraryItems.$inferInsert> = {}) {
  const filePath = `resources/${crypto.randomUUID()}.pdf`;
  const [row] = await db
    .insert(schema.libraryItems)
    .values({
      categoryId,
      titleEn: "Test Book",
      descriptionEn: "A test book.",
      source: "file",
      filePath,
      mimeType: "application/pdf",
      sizeBytes: 22,
      isGated: true,
      ...overrides,
    })
    .returning();
  if (row.source === "file" && row.filePath) {
    await writeStoredFile(row.filePath, "%PDF-1.7 library bytes");
  }
  return row;
}

async function grantAccess() {
  await db
    .insert(schema.entitlements)
    .values({ userId: user.id, packageId: pkg.id, source: "admin", status: "active" });
}

beforeEach(async () => {
  await prepareDatabase();
  const seeded = await seedMinimal();
  user = seeded.user;
  pkg = seeded.pkg;
  categoryId = await createCategory();
  currentUser.value = { id: user.id, state: "active" };
});

afterAll(async () => {
  await Promise.all(written.map((f) => rm(f, { force: true })));
  await close();
});

describe("library item route status codes", () => {
  it("answers 401 with no body when nobody is signed in", async () => {
    const item = await createItem();
    currentUser.value = null;

    const response = await call(item.id);

    expect(response.status).toBe(401);
    expect(response.body).toBeNull();
  });

  it("answers 403 for a gated item without an active entitlement", async () => {
    const item = await createItem({ isGated: true });

    const response = await call(item.id);

    expect(response.status).toBe(403);
  });

  it("answers 200 for a gated item with an active entitlement", async () => {
    const item = await createItem({ isGated: true });
    await grantAccess();

    const response = await call(item.id);

    expect(response.status).toBe(200);
    expect(await response.text()).toBe("%PDF-1.7 library bytes");
  });

  it("answers 200 for an ungated item even holding no entitlement at all", async () => {
    const item = await createItem({ isGated: false });

    const response = await call(item.id);

    expect(response.status).toBe(200);
  });

  it("answers 403 for a suspended account even on an ungated item", async () => {
    const item = await createItem({ isGated: false });
    currentUser.value = { id: user.id, state: "suspended" };

    const response = await call(item.id);

    expect(response.status).toBe(403);
  });

  it("answers 404 for an id that is not a uuid", async () => {
    const response = await call("../../etc/passwd");

    expect(response.status).toBe(404);
  });

  it("answers 404 for a uuid that matches nothing", async () => {
    const response = await call(crypto.randomUUID());

    expect(response.status).toBe(404);
  });

  it("answers 404 for an archived item even with an entitlement", async () => {
    const item = await createItem({ isGated: true });
    await grantAccess();
    await db.update(schema.libraryItems).set({ archivedAt: new Date() }).where(eq(schema.libraryItems.id, item.id));

    const response = await call(item.id);

    expect(response.status).toBe(404);
  });

  it("answers 404 for a hidden item even with an entitlement", async () => {
    const item = await createItem({ isGated: true });
    await grantAccess();
    await db.update(schema.libraryItems).set({ isVisible: false }).where(eq(schema.libraryItems.id, item.id));

    const response = await call(item.id);

    expect(response.status).toBe(404);
  });

  it("answers 404 for a link item, so the id cannot probe the filesystem", async () => {
    const item = await createItem({
      isGated: false,
      source: "link",
      filePath: null,
      externalUrl: "https://example.dz/free-cad-pack",
    });

    const response = await call(item.id);

    expect(response.status).toBe(404);
  });

  it("answers 404 when a stored path tries to escape the storage root", async () => {
    const item = await createItem({ isGated: false, filePath: "../../../etc/passwd" });

    const response = await call(item.id);

    expect(response.status).toBe(404);
  });

  it("streams the file with the expected security headers", async () => {
    const item = await createItem({ isGated: false });

    const response = await call(item.id);

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("application/pdf");
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(response.headers.get("content-disposition")).toBe("inline");
  });

  it("serves the requested byte range as 206", async () => {
    const item = await createItem({ isGated: false });

    const response = await call(item.id, "bytes=0-4");

    expect(response.status).toBe(206);
    expect(await response.text()).toBe("%PDF-");
  });

  it("sets an attachment only where an admin turned allow_download on", async () => {
    const item = await createItem({ isGated: false, allowDownload: true });

    const response = await call(item.id);

    expect(response.headers.get("content-disposition")).toBe("attachment");
  });

  it("closes the file the moment a gated item's entitlement is revoked", async () => {
    const item = await createItem({ isGated: true });
    await grantAccess();
    expect((await call(item.id)).status).toBe(200);

    await db.update(schema.entitlements).set({ status: "revoked" }).where(eq(schema.entitlements.userId, user.id));

    expect((await call(item.id)).status).toBe(403);
  });
});

describe("resolveLibraryItemAccess", () => {
  it("separates not_found from forbidden from ok", async () => {
    const gated = await createItem({ isGated: true });
    const ungated = await createItem({ isGated: false });

    expect(await resolveLibraryItemAccess(user.id, crypto.randomUUID())).toEqual({ status: "not_found" });
    expect((await resolveLibraryItemAccess(user.id, gated.id)).status).toBe("forbidden");
    expect((await resolveLibraryItemAccess(user.id, ungated.id)).status).toBe("ok");
  });
});
