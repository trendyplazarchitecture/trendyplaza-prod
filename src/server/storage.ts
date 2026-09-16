import "server-only";

import { createReadStream } from "node:fs";
import { mkdir, rename, stat, unlink, writeFile } from "node:fs/promises";
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
  "posts",
  "software",
  "library",
] as const;
export type Bucket = (typeof BUCKETS)[number];

/**
 * The buckets whose contents are meant to be seen by anyone: shop images,
 * profile pictures, testimonial screenshots, "meet the team" photos, and
 * news/events post covers.
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
  "posts",
  "software",
  "library",
];

/**
 * Magic bytes, not the extension. A file named `receipt.jpg` can be anything,
 * and the extension is attacker-controlled.
 */
/**
 * Magic bytes, not just the extension. A file named `receipt.jpg` can be anything,
 * and the extension is attacker-controlled. For container formats like ZIP (which
 * OOXML documents like .docx and .pptx use) or text-based formats (.dxf), the
 * declared name acts as a discriminator after magic-byte confirmation.
 */
export type SniffedType = { mime: string; ext: string };

const RASTER_IMAGE_SIGNATURES: { mime: string; ext: string; test: (b: Buffer) => boolean }[] = [
  { mime: "image/jpeg", ext: "jpg", test: (b) => b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  {
    mime: "image/png",
    ext: "png",
    test: (b) => b.length >= 8 && b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  },
  {
    mime: "image/webp",
    ext: "webp",
    test: (b) => b.length >= 12 && b.subarray(0, 4).toString() === "RIFF" && b.subarray(8, 12).toString() === "WEBP",
  },
];

export function sniff(buffer: Buffer, declaredName?: string): SniffedType | null {
  // 1. Raster images
  const raster = RASTER_IMAGE_SIGNATURES.find((s) => s.test(buffer));
  if (raster) return raster;

  // 2. PDF
  if (buffer.length >= 5 && buffer.subarray(0, 5).toString() === "%PDF-") {
    return { mime: "application/pdf", ext: "pdf" };
  }

  // 3. AutoCAD DWG (starts with AC10xx version header e.g. AC1015, AC1018, AC1024, AC1027, AC1032)
  if (buffer.length >= 6 && buffer.subarray(0, 4).toString() === "AC10") {
    return { mime: "image/vnd.dwg", ext: "dwg" };
  }

  // 4. AutoCAD DXF (Binary or ASCII)
  if (buffer.length >= 18 && buffer.subarray(0, 18).toString() === "AutoCAD Binary DXF") {
    return { mime: "image/vnd.dxf", ext: "dxf" };
  }
  const cleanExt = declaredName?.toLowerCase().split(".").pop() ?? "";
  if (cleanExt === "dxf" && buffer.length > 0) {
    // ASCII DXF starts with group codes (e.g. 0\nSECTION or 999\n comments)
    const headerSnippet = buffer.subarray(0, Math.min(buffer.length, 512)).toString("ascii");
    if (/^\s*0\s*\r?\n/m.test(headerSnippet) || /^\s*999\s*\r?\n/m.test(headerSnippet) || headerSnippet.includes("SECTION")) {
      return { mime: "image/vnd.dxf", ext: "dxf" };
    }
  }

  // 5. ZIP containers: Office Open XML (.pptx, .docx, .xlsx) and general .zip
  if (
    buffer.length >= 4 &&
    buffer[0] === 0x50 &&
    buffer[1] === 0x4b &&
    (buffer[2] === 0x03 || buffer[2] === 0x05 || buffer[2] === 0x07) &&
    (buffer[3] === 0x04 || buffer[3] === 0x06 || buffer[3] === 0x08)
  ) {
    if (cleanExt === "pptx") {
      return { mime: "application/vnd.openxmlformats-officedocument.presentationml.presentation", ext: "pptx" };
    }
    if (cleanExt === "docx") {
      return { mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", ext: "docx" };
    }
    if (cleanExt === "xlsx") {
      return { mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", ext: "xlsx" };
    }

    // Inspect internal paths inside the ZIP buffer if no matching declared extension
    const sample = buffer.subarray(0, Math.min(buffer.length, 4096)).toString("latin1");
    if (sample.includes("ppt/")) {
      return { mime: "application/vnd.openxmlformats-officedocument.presentationml.presentation", ext: "pptx" };
    }
    if (sample.includes("word/")) {
      return { mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", ext: "docx" };
    }
    if (sample.includes("xl/")) {
      return { mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", ext: "xlsx" };
    }

    return { mime: "application/zip", ext: "zip" };
  }

  // 6. Legacy Microsoft Office OLE Compound File Binary (.doc, .ppt, .xls)
  if (buffer.length >= 8 && buffer.subarray(0, 4).equals(Buffer.from([0xd0, 0xcf, 0x11, 0xe0]))) {
    if (cleanExt === "ppt") {
      return { mime: "application/vnd.ms-powerpoint", ext: "ppt" };
    }
    if (cleanExt === "xls") {
      return { mime: "application/vnd.ms-excel", ext: "xls" };
    }
    return { mime: "application/msword", ext: "doc" };
  }

  return null;
}

/** Determines if a resource can be rendered natively in a browser object or image tag */
export function isInlinePreviewable(mime: string | null | undefined): boolean {
  if (!mime) return false;
  return (
    mime === "application/pdf" ||
    mime === "image/jpeg" ||
    mime === "image/png" ||
    mime === "image/webp"
  );
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
 * dimension. PDFs, Office documents and CAD drawings pass through unchanged.
 */
export async function storeUpload(
  bucket: Bucket,
  file: { buffer: Buffer; declaredName?: string },
  options: { maxBytes?: number; convertImages?: boolean } = {},
): Promise<StoreResult> {
  const maxBytes = options.maxBytes ?? MAX_RECEIPT_BYTES;
  if (file.buffer.byteLength > maxBytes) return { ok: false, error: "too_large" };

  const signature = sniff(file.buffer, file.declaredName);
  if (!signature) return { ok: false, error: "unsupported_type" };

  let bytes = file.buffer;
  let { mime, ext } = signature;

  const isRasterImage = mime === "image/jpeg" || mime === "image/png" || mime === "image/webp";
  if (options.convertImages !== false && isRasterImage) {
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
  const isRaster = signature?.mime === "image/jpeg" || signature?.mime === "image/png" || signature?.mime === "image/webp";
  if (!signature || !isRaster) {
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
 * The widths the public media route will produce. An allow-list, not a free
 * parameter: `?w=` is reachable by anyone, and an open one is an invitation
 * to make the server resize a 2000px original into a thousand distinct files.
 */
export const IMAGE_WIDTHS = [240, 320, 480, 640, 960, 1280] as const;
export type ImageWidth = (typeof IMAGE_WIDTHS)[number];

export function isImageWidth(value: number): value is ImageWidth {
  return (IMAGE_WIDTHS as readonly number[]).includes(value);
}

/**
 * A width-limited copy of a stored image, generated once and then read from
 * disk like any other file.
 *
 * Uploads are stored at up to 2000px (`storeUpload`), which is right for the
 * original and about six times more than a product grid cell on a phone
 * actually paints — roughly 250 KB per thumbnail, on an audience that is on
 * mobile data. The derivative lives under `_derived/<width>/` inside the
 * storage root, so it is covered by the same path containment as everything
 * else, and it is never a bucket, so nothing can request it directly.
 *
 * Written to a temporary name and renamed into place: two requests for the
 * same missing width arrive together on a cold cache, and a half-written file
 * served as an image is a broken image that then caches for a year.
 */
export async function statResizedImage(relativePath: string, width: ImageWidth) {
  const derivedPath = path.posix.join("_derived", String(width), relativePath);
  const cached = await statStored(derivedPath);
  if (cached) return cached;

  const source = await statStored(relativePath);
  if (!source) return null;

  const absolute = resolveStoredPath(derivedPath);
  if (!absolute) return null;

  try {
    const bytes = await sharp(source.absolute)
      .rotate()
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 78 })
      .toBuffer();

    // An original already narrower than the requested width comes back the
    // same size or bigger after a re-encode. Serve the original instead.
    if (bytes.byteLength >= source.size) return source;

    await mkdir(path.dirname(absolute), { recursive: true });
    const temporary = `${absolute}.${randomUUID()}.tmp`;
    await writeFile(temporary, bytes);
    await rename(temporary, absolute);
    return { absolute, size: bytes.byteLength };
  } catch {
    // A corrupt or non-raster file is not worth a 500: the full-size original
    // is still a correct answer to the request.
    return source;
  }
}

/**
 * A read stream over a byte range. A 100 MB PDF read fully into memory blocks
 * the event loop and defeats the viewer's own paging.
 */
export function openRange(absolute: string, start: number, end: number) {
  return createReadStream(absolute, { start, end });
}

/**
 * Removes a stored file from disk. Best-effort: a row whose file is already
 * gone (or was never on this disk -- restored from a backup taken between
 * upload and delete, say) purges cleanly rather than blocking on ENOENT.
 *
 * Callers only reach this after the database row purge has already
 * committed. Deleting the bytes first and the row second would leave a
 * resource that still resolves but 404s the moment a student opens it, if
 * the row delete then failed for any reason.
 */
export async function deleteStored(relativePath: string): Promise<void> {
  const absolute = resolveStoredPath(relativePath);
  if (!absolute) return;
  try {
    await unlink(absolute);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
}
