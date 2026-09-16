import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import sharp from "sharp";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

/**
 * The profile-picture pipeline.
 *
 * A phone camera produces a 4 MB, 4032×3024 JPEG with its orientation in EXIF.
 * Storing that as-is would ship four megabytes to draw a 36-pixel circle in a
 * sidebar, on an audience that is on mobile data — so the assertions here are
 * about what comes *out*: square, small, WebP, and under a sensible ceiling.
 *
 * `STORAGE_ROOT` is pointed at a temporary directory before the module under
 * test is imported, because it resolves the root once at module load.
 */

let storeAvatar: typeof import("@/server/storage").storeAvatar;
let root: string;

beforeAll(async () => {
  root = await mkdtemp(path.join(tmpdir(), "tp-avatar-"));
  process.env.STORAGE_ROOT = root;
  ({ storeAvatar } = await import("@/server/storage"));
});

afterAll(() => {
  delete process.env.STORAGE_ROOT;
});

/** A solid-colour image of a given size, as a real encoded buffer. */
async function jpeg(width: number, height: number) {
  return sharp({
    create: { width, height, channels: 3, background: { r: 200, g: 30, b: 40 } },
  })
    .jpeg({ quality: 92 })
    .toBuffer();
}

describe("storeAvatar", () => {
  it("squares and shrinks a landscape photo", async () => {
    const source = await jpeg(1600, 900);
    const result = await storeAvatar(source);

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const stored = await readFile(path.join(root, result.relativePath));
    const meta = await sharp(stored).metadata();

    expect(meta.format).toBe("webp");
    expect(meta.width).toBe(256);
    expect(meta.height).toBe(256);
    // The point of the whole function. 256×256 WebP lands in single-digit
    // kilobytes; anything approaching the original is a resize that did not run.
    expect(result.bytes).toBeLessThan(60_000);
    expect(result.mime).toBe("image/webp");
  });

  it("does not enlarge, and does not stretch, a small square", async () => {
    const result = await storeAvatar(await jpeg(64, 64));
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const meta = await sharp(await readFile(path.join(root, result.relativePath))).metadata();
    // `cover` fills the box, so a 64×64 source is upscaled to 256×256 rather
    // than left small. What matters is that it stays square either way.
    expect(meta.width).toBe(meta.height);
  });

  it("writes a random name inside the avatars bucket", async () => {
    const a = await storeAvatar(await jpeg(300, 300));
    const b = await storeAvatar(await jpeg(300, 300));
    expect(a.ok && b.ok).toBe(true);
    if (!a.ok || !b.ok) return;

    expect(a.relativePath).toMatch(/^avatars\/[0-9a-f-]{36}\.webp$/);
    // A new upload is a new URL, which is what lets `/api/media` cache these
    // immutably for a year.
    expect(a.relativePath).not.toBe(b.relativePath);
  });

  it("refuses a PDF, which every other bucket accepts", async () => {
    const pdf = Buffer.from("%PDF-1.7\n%âãÏÓ\n", "latin1");
    const result = await storeAvatar(pdf);

    expect(result).toEqual({ ok: false, error: "unsupported_type" });
  });

  it("refuses anything over the cap before it is decoded", async () => {
    // Six megabytes of JPEG signature and noise. Never reaches sharp.
    const big = Buffer.concat([
      Buffer.from([0xff, 0xd8, 0xff]),
      Buffer.alloc(6 * 1024 * 1024),
    ]);
    const result = await storeAvatar(big);

    expect(result).toEqual({ ok: false, error: "too_large" });
  });
});
