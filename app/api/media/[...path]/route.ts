import { PUBLIC_BUCKETS, isImageWidth, openRange, statResizedImage, statStored } from "@/server/storage";
import type { Bucket } from "@/server/storage";
import { nodeToWebStream } from "@/server/streams";

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
  request: Request,
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

  /*
   * `?w=` asks for a width-limited copy. Originals are stored at up to 2000px
   * and a product cell paints about 400 — serving the original was most of
   * this page's weight on a phone. An unknown or unlisted width simply falls
   * back to the original rather than 404ing, so an old cached URL keeps
   * working.
   */
  const requested = Number(new URL(request.url).searchParams.get("w"));
  const file =
    Number.isInteger(requested) && isImageWidth(requested)
      ? await statResizedImage(`${bucket}/${name}`, requested)
      : await statStored(`${bucket}/${name}`);
  if (!file) return new Response(null, { status: 404 });

  return new Response(
    nodeToWebStream(openRange(file.absolute, 0, file.size - 1)),
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
