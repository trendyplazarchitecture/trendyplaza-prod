import "server-only";

import { createReadStream } from "node:fs";
import { mkdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import sharp from "sharp";

/**
 * Everything uploaded lands outside the web root. There is no path under
 * `public/` that reaches a receipt or a resource, and the only read route is
 * entitlement-checked.
 */
const ROOT = path.resolve(process.env.STORAGE_ROOT ?? "./.storage");

export const BUCKETS = [
  "resources",
  "receipts",
  "products",
  "avatars",
  "testimonials",
  "roster",
] as const;
export type Bucket = (typeof BUCKETS)[number];

/**
 * The buckets whose contents are meant to be seen by anyone: shop images,
 * profile pictures, testimonial screenshots and "meet the team" photos.
 * Everything else is entitlement-checked or admin-only, and `/api/media`
 * refuses to serve a bucket that is not named here.
 *
 * Filenames are random UUIDs, so a public bucket is not an enumerable one.
 */
export const PUBLIC_BUCKETS: readonly Bucket[] = [
  "products",
  "avatars",
  "testimonials",
  "roster",
];

/**
 * Magic bytes, not the extension. A file named `receipt.jpg` can be anything,
 * and the extension is attacker-controlled.
 */
const SIGNATURES: { mime: string; ext: string; test: (b: Buffer) => boolean }[] = [
  { mime: "image/jpeg", ext: "jpg", test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  {
    mime: "image/png",
    ext: "png",
    test: (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  },
  { mime: "image/webp", ext: "webp", test: (b) => b.subarray(0, 4).toString() === "RIFF" && b.subarray(8, 12).toString() === "WEBP" },
  { mime: "application/pdf", ext: "pdf", test: (b) => b.subarray(0, 5).toString() === "%PDF-" },
];

export function sniff(buffer: Buffer) {
  return SIGNATURES.find((s) => s.test(buffer)) ?? null;
}

export const MAX_RECEIPT_BYTES = 8 * 1024 * 1024;
export const MAX_RESOURCE_BYTES = 200 * 1024 * 1024;
/** A profile picture is a face at 256 px. Anything over 5 MB is a mistake. */
export const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

export type StoreResult =
  | { ok: true; relativePath: string; mime: string; bytes: number }
  | { ok: false; error: "too_large" | "unsupported_type" };

/**
 * A phone photo of a Baridimob receipt is 4 to 8 MB. Stored unresized it times
 * out on 3G and fills the disk, so images are re-encoded to WebP and capped in
 * dimension. PDFs pass through unchanged.
 */
export async function storeUpload(
  bucket: Bucket,
  file: { buffer: Buffer; declaredName?: string },
  options: { maxBytes?: number; convertImages?: boolean } = {},
): Promise<StoreResult> {
  const maxBytes = options.maxBytes ?? MAX_RECEIPT_BYTES;
  if (file.buffer.byteLength > maxBytes) return { ok: false, error: "too_large" };

  const signature = sniff(file.buffer);
  if (!signature) return { ok: false, error: "unsupported_type" };

  let bytes = file.buffer;
  let { mime, ext } = signature;

  if (options.convertImages !== false && mime.startsWith("image/")) {
    bytes = await sharp(file.buffer)
      .rotate()
      .resize({ width: 2000, height: 2000, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
    mime = "image/webp";
    ext = "webp";
  }

  // Random filename. The original name is attacker-controlled and is never
  // used to build a path.
  const relativePath = path.posix.join(bucket, `${randomUUID()}.${ext}`);
  const absolute = path.join(ROOT, relativePath);
  await mkdir(path.dirname(absolute), { recursive: true });
  await writeFile(absolute, bytes);

  return { ok: true, relativePath, mime, bytes: bytes.byteLength };
}

/**
 * A profile picture, squared and small.
 *
 * Not `storeUpload`: an avatar is drawn at 40 px in a sidebar and 96 px on the
 * profile, so a 2000 px "inside" fit would ship two megabytes to render a
 * thumbnail on a 3G connection. Cropped to a square here rather than in CSS,
 * because the crop is what makes every avatar on the page the same shape.
 *
 * A PDF is a valid upload everywhere else in this file and is not one here.
 */
export async function storeAvatar(buffer: Buffer): Promise<StoreResult> {
  if (buffer.byteLength > MAX_AVATAR_BYTES) return { ok: false, error: "too_large" };

  const signature = sniff(buffer);
  if (!signature || !signature.mime.startsWith("image/")) {
    return { ok: false, error: "unsupported_type" };
  }

  const bytes = await sharp(buffer)
    // Phones write the orientation in EXIF rather than in the pixels, so a
    // portrait selfie arrives sideways without this.
    .rotate()
    .resize({ width: 256, height: 256, fit: "cover", position: "attention" })
    .webp({ quality: 84 })
    .toBuffer();

  const relativePath = path.posix.join("avatars", `${randomUUID()}.webp`);
  const absolute = path.join(ROOT, relativePath);
  await mkdir(path.dirname(absolute), { recursive: true });
  await writeFile(absolute, bytes);

  return { ok: true, relativePath, mime: "image/webp", bytes: bytes.byteLength };
}

/**
 * Resolves a stored path and refuses anything that escapes the root, so a
 * `../../etc/passwd` in a database row cannot be read even if one gets there.
 */
export function resolveStoredPath(relativePath: string): string | null {
  const absolute = path.resolve(ROOT, relativePath);
  const rootWithSep = ROOT.endsWith(path.sep) ? ROOT : ROOT + path.sep;
  return absolute.startsWith(rootWithSep) ? absolute : null;
}

export async function statStored(relativePath: string) {
  const absolute = resolveStoredPath(relativePath);
  if (!absolute) return null;
  try {
    const info = await stat(absolute);
    return info.isFile() ? { absolute, size: info.size } : null;
  } catch {
    return null;
  }
}

/**
 * A read stream over a byte range. A 100 MB PDF read fully into memory blocks
 * the event loop and defeats the viewer's own paging.
 */
export function openRange(absolute: string, start: number, end: number) {
  return createReadStream(absolute, { start, end });
}
