import { Readable } from "node:stream";

import { PUBLIC_BUCKETS, openRange, statStored } from "@/server/storage";
import type { Bucket } from "@/server/storage";

/**
 * The public half of the storage root: shop images and profile pictures.
 *
 * `src/lib/media.ts` has pointed at this path since the product creator
 * shipped, and the route was never written, so every image an admin uploaded
 * 404'd while the seeded ones under `public/products/` kept working. That is
 * why it looked fine.
 *
 * It is deliberately a narrow door, not a file server:
 *
 *   - only the buckets in `PUBLIC_BUCKETS` are reachable
 *   - the segments are checked one by one, so no `..` reaches the filesystem
 *   - `resolveStoredPath` refuses anything resolving outside the root anyway
 *
 * Receipts and resources are not served here and never will be. They go
 * through routes that check a permission or an entitlement first.
 */

/** No `..`, no separators, no dotfiles. A stored name is `<uuid>.<ext>`. */
const SEGMENT = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;

export async function GET(
  _request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;

  // Exactly `<bucket>/<file>`. Nothing in these buckets nests.
  if (path.length !== 2) return new Response(null, { status: 404 });

  const [bucket, name] = path;
  if (!PUBLIC_BUCKETS.includes(bucket as Bucket)) {
    return new Response(null, { status: 404 });
  }
  if (!SEGMENT.test(name)) return new Response(null, { status: 404 });

  const file = await statStored(`${bucket}/${name}`);
  if (!file) return new Response(null, { status: 404 });

  return new Response(
    Readable.toWeb(openRange(file.absolute, 0, file.size - 1)) as unknown as ReadableStream,
    {
      status: 200,
      headers: {
        // Everything in these buckets is written as WebP by `storeUpload` and
        // `storeAvatar`, under a random name that is never reused.
        "content-type": "image/webp",
        "content-length": String(file.size),
        // Immutable, because a new upload is a new UUID. Replacing a product
        // image changes the URL, so a year in a CDN cannot serve a stale one.
        "cache-control": "public, max-age=31536000, immutable",
        "x-content-type-options": "nosniff",
      },
    },
  );
}
