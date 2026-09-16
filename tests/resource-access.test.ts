import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
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

/**
 * Items 10 and 11 in _AI_CONTEXT/08_TESTING.md, the two verified by hand last
 * session and by nothing since.
 *
 * The route is the only path from the web to a resource file, so it is tested
 * as a route: called with a Request, asserted on the status and the headers it
 * answers with. `resolveResourceAccess` returns a discriminated union so the
 * decision can also be tested without HTTP, and both layers are covered below.
 *
 * The session is the one thing stubbed. `getCurrentUser` reads a Better Auth
 * cookie through `next/headers`, which needs a request scope that does not
 * exist here; everything downstream of it is real, including the file on disk.
 */

const currentUser = vi.hoisted(() => ({
  value: null as { id: string; state: "on_hold" | "active" | "suspended" } | null,
}));

vi.mock("@/server/session", () => ({
  getCurrentUser: async () => currentUser.value,
}));

const { GET } = await import("../app/api/resource/[id]/route");
const { resolveResourceAccess, getReadableResource } = await import(
  "@/server/entitlements"
);

const STORAGE_ROOT = path.resolve(process.env.STORAGE_ROOT ?? "./.storage");
const written: string[] = [];

let user: { id: string };
let pkg: { id: string };
let tree: Awaited<ReturnType<typeof seedContentTree>>;

/** A real file under STORAGE_ROOT, because the route stats and streams it. */
async function writeStoredFile(relativePath: string, contents: string) {
  const absolute = path.join(STORAGE_ROOT, relativePath);
  await mkdir(path.dirname(absolute), { recursive: true });
  await writeFile(absolute, contents);
  written.push(absolute);
}

function request(range?: string) {
  return new Request("http://localhost/api/resource/x", {
    headers: range ? { range } : undefined,
  }) as never;
}

function call(id: string, range?: string) {
  return GET(request(range), { params: Promise.resolve({ id }) });
}

/** The L2 resource, its file on disk, and the user entitled to L2. */
async function entitleToL2() {
  await addScope(pkg.id, "year", tree.years.L2.yearId);
  await db
    .insert(schema.entitlements)
    .values({ userId: user.id, packageId: pkg.id, source: "admin", status: "active" });
}

async function l2Resource() {
  const [row] = await db
    .select()
    .from(schema.resources)
    .where(eq(schema.resources.id, tree.years.L2.resourceId));
  return row;
}

beforeEach(async () => {
  await prepareDatabase();
  const seeded = await seedMinimal();
  user = seeded.user;
  pkg = seeded.pkg;
  tree = await seedContentTree();
  currentUser.value = { id: user.id, state: "active" };

  const resource = await l2Resource();
  await writeStoredFile(resource.filePath!, "%PDF-1.7 lecture bytes");
});

afterAll(async () => {
  await Promise.all(written.map((f) => rm(f, { force: true })));
  await close();
});

/* --------------------------------------------------------------------------
 * Item 10. Never 200 with a file to anyone outside the entitled case.
 * ----------------------------------------------------------------------- */

describe("resource route status codes", () => {
  it("answers 401 with no body when nobody is signed in", async () => {
    currentUser.value = null;

    const response = await call(tree.years.L2.resourceId);

    expect(response.status).toBe(401);
    expect(response.body).toBeNull();
  });

  it("answers 401 before it looks the resource up", async () => {
    // A signed-out visitor must not be able to tell a real id from a made-up
    // one by the status they get back.
    currentUser.value = null;

    const real = await call(tree.years.L2.resourceId);
    const invented = await call(crypto.randomUUID());

    expect(real.status).toBe(401);
    expect(invented.status).toBe(401);
  });

  it("answers 403 for a signed-in student outside the package", async () => {
    await entitleToL2();

    const response = await call(tree.years.L3.resourceId);

    expect(response.status).toBe(403);
    expect(response.body).toBeNull();
  });

  it("answers 403 for a signed-in student holding nothing at all", async () => {
    const response = await call(tree.years.L2.resourceId);

    expect(response.status).toBe(403);
  });

  it("answers 403 for a suspended account that is otherwise entitled", async () => {
    await entitleToL2();
    currentUser.value = { id: user.id, state: "suspended" };

    const response = await call(tree.years.L2.resourceId);

    expect(response.status).toBe(403);
  });

  it("answers 404 for an id that is not a uuid", async () => {
    const response = await call("../../etc/passwd");

    expect(response.status).toBe(404);
  });

  it("answers 404 for a uuid that matches nothing", async () => {
    await entitleToL2();

    const response = await call(crypto.randomUUID());

    expect(response.status).toBe(404);
  });

  it("answers 404 for an archived resource the student was entitled to", async () => {
    await entitleToL2();
    await db
      .update(schema.resources)
      .set({ archivedAt: new Date() })
      .where(eq(schema.resources.id, tree.years.L2.resourceId));

    const response = await call(tree.years.L2.resourceId);

    expect(response.status).toBe(404);
  });

  it("answers 404 for a hidden resource the student was entitled to", async () => {
    await entitleToL2();
    await db
      .update(schema.resources)
      .set({ isVisible: false })
      .where(eq(schema.resources.id, tree.years.L2.resourceId));

    const response = await call(tree.years.L2.resourceId);

    expect(response.status).toBe(404);
  });

  it("answers 404 for a link resource, so the id cannot probe the filesystem", async () => {
    await entitleToL2();
    await db
      .update(schema.resources)
      .set({ source: "youtube", filePath: null, externalUrl: "https://youtu.be/x" })
      .where(eq(schema.resources.id, tree.years.L2.resourceId));

    const response = await call(tree.years.L2.resourceId);

    expect(response.status).toBe(404);
  });

  it("answers 404 when the row points at a file that is not on disk", async () => {
    await entitleToL2();
    await db
      .update(schema.resources)
      .set({ filePath: `resources/${crypto.randomUUID()}.pdf` })
      .where(eq(schema.resources.id, tree.years.L2.resourceId));

    const response = await call(tree.years.L2.resourceId);

    expect(response.status).toBe(404);
  });

  it("answers 404 when a stored path tries to escape the storage root", async () => {
    await entitleToL2();
    await db
      .update(schema.resources)
      .set({ filePath: "../../../etc/passwd" })
      .where(eq(schema.resources.id, tree.years.L2.resourceId));

    const response = await call(tree.years.L2.resourceId);

    expect(response.status).toBe(404);
  });

  it("streams the file to an entitled student", async () => {
    await entitleToL2();

    const response = await call(tree.years.L2.resourceId);

    expect(response.status).toBe(200);
    expect(await response.text()).toBe("%PDF-1.7 lecture bytes");
    expect(response.headers.get("content-type")).toBe("application/pdf");
    // Revocation must not be outlived by a copy on a shared proxy.
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
  });

  it("closes the file the moment the entitlement is paused", async () => {
    await entitleToL2();
    expect((await call(tree.years.L2.resourceId)).status).toBe(200);

    await db
      .update(schema.entitlements)
      .set({ status: "paused" })
      .where(eq(schema.entitlements.userId, user.id));

    expect((await call(tree.years.L2.resourceId)).status).toBe(403);
  });

  it("serves the requested byte range as 206", async () => {
    await entitleToL2();

    const response = await call(tree.years.L2.resourceId, "bytes=0-4");

    expect(response.status).toBe(206);
    expect(response.headers.get("content-range")).toBe("bytes 0-4/22");
    expect(await response.text()).toBe("%PDF-");
  });

  it("refuses an unsatisfiable range rather than serving the whole file", async () => {
    await entitleToL2();

    expect((await call(tree.years.L2.resourceId, "bytes=999-1500")).status).toBe(416);
    expect((await call(tree.years.L2.resourceId, "bytes=abc")).status).toBe(416);
  });
});

/* --------------------------------------------------------------------------
 * Item 11. The download flag is the only thing that sets an attachment.
 * ----------------------------------------------------------------------- */

describe("download flag", () => {
  it("never sets an attachment disposition while allow_download is false", async () => {
    await entitleToL2();
    // The column default, asserted rather than assumed: off is what a resource
    // is created as.
    expect((await l2Resource()).allowDownload).toBe(false);

    for (const range of [undefined, "bytes=0-4"]) {
      const response = await call(tree.years.L2.resourceId, range);
      expect(response.headers.get("content-disposition")).toBe("inline");
      expect(response.headers.get("content-disposition")).not.toContain("attachment");
    }
  });

  it("carries no filename on the inline path", async () => {
    await entitleToL2();

    const response = await call(tree.years.L2.resourceId);

    // The stored name is a UUID and the title belongs on the page.
    expect(response.headers.get("content-disposition")).not.toContain("filename");
  });

  it("sets an attachment only where an admin turned the flag on", async () => {
    await entitleToL2();
    await db
      .update(schema.resources)
      .set({ allowDownload: true })
      .where(eq(schema.resources.id, tree.years.L2.resourceId));

    const response = await call(tree.years.L2.resourceId);

    expect(response.headers.get("content-disposition")).toBe("attachment");
  });

  it("keeps the flag per resource rather than per module", async () => {
    await addScope(pkg.id, "university", tree.university.id);
    await db
      .insert(schema.entitlements)
      .values({ userId: user.id, packageId: pkg.id, source: "admin", status: "active" });

    const l3 = await db
      .select()
      .from(schema.resources)
      .where(eq(schema.resources.id, tree.years.L3.resourceId));
    await writeStoredFile(l3[0].filePath!, "%PDF-1.7 other");

    await db
      .update(schema.resources)
      .set({ allowDownload: true })
      .where(eq(schema.resources.id, tree.years.L2.resourceId));

    expect(
      (await call(tree.years.L2.resourceId)).headers.get("content-disposition"),
    ).toBe("attachment");
    expect(
      (await call(tree.years.L3.resourceId)).headers.get("content-disposition"),
    ).toBe("inline");
  });
});

/* --------------------------------------------------------------------------
 * The same decision without HTTP. This is the function the route delegates to,
 * and it is worth pinning separately: anything else that reads a resource has
 * to go through it.
 * ----------------------------------------------------------------------- */

describe("resolveResourceAccess", () => {
  it("separates not_found from forbidden", async () => {
    await entitleToL2();

    expect(await resolveResourceAccess(user.id, crypto.randomUUID())).toEqual({
      status: "not_found",
    });
    expect(
      (await resolveResourceAccess(user.id, tree.years.L3.resourceId)).status,
    ).toBe("forbidden");
    expect(
      (await resolveResourceAccess(user.id, tree.years.L2.resourceId)).status,
    ).toBe("ok");
  });

  it("returns null from getReadableResource for anything but ok", async () => {
    await entitleToL2();

    expect(await getReadableResource(user.id, tree.years.L3.resourceId)).toBeNull();
    expect(await getReadableResource(user.id, crypto.randomUUID())).toBeNull();
    expect(
      (await getReadableResource(user.id, tree.years.L2.resourceId))?.id,
    ).toBe(tree.years.L2.resourceId);
  });
});
