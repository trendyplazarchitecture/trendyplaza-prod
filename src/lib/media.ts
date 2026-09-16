/**
 * Product images are the one kind of upload that is genuinely public: it is a
 * shop, and the point is that anyone can see them.
 *
 * Seed fixtures ship in `public/products/`. Anything an admin uploads goes to
 * STORAGE_ROOT and is served through a route, because `public/uploads` is
 * banned by the enforcement checks in _AI_CONTEXT/01_RULES.md and because
 * uploads need magic-byte validation and WebP conversion on the way in.
 *
 * Resources and receipts never come through here. They go through
 * `/api/resource/[id]`, which checks an entitlement first.
 */
export function productImageUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  if (path.startsWith("seed/")) return `/products/${path.slice("seed/".length)}`;
  return `/api/media/products/${path.replace(/^products\//, "")}`;
}

/**
 * A profile picture. Public for the same reason a product image is: it is
 * drawn in the student's own sidebar and nowhere secret, the filename is a
 * UUID, and the alternative is an entitlement check on every page's chrome.
 *
 * Better Auth writes a full URL into `users.image` for a social sign-in, so
 * both shapes have to survive this function.
 */
export function avatarUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `/api/media/avatars/${path.replace(/^avatars\//, "")}`;
}

/**
 * A testimonial screenshot. Public for the same reason a product image is:
 * it is a marketing strip on the home page, the filename is a UUID, and the
 * alternative is an entitlement check on a page nobody has to sign in to see.
 *
 * Same `seed/` convention as `productImageUrl`, for the demo fixtures.
 */
export function testimonialImageUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  if (path.startsWith("seed/")) return `/testimonials/${path.slice("seed/".length)}`;
  return `/api/media/testimonials/${path.replace(/^testimonials\//, "")}`;
}

/** A "meet the team" photo, public for the same reason a testimonial is. */
export function rosterImageUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  if (path.startsWith("seed/")) return `/roster/${path.slice("seed/".length)}`;
  return `/api/media/roster/${path.replace(/^roster\//, "")}`;
}

/** Cover image for announcements, events and news posts. Public Shape B media. */
export function postCoverImageUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  if (path.startsWith("seed/")) return `/posts/${path.slice("seed/".length)}`;
  return `/api/media/posts/${path.replace(/^posts\//, "")}`;
}

/**
 * A Software Hub entry's logo — public Shape B media, same reasoning as a
 * product image.
 *
 * Same `seed/` convention as the other resolvers above, but for a different
 * reason: raster upload (`storeUpload`) cannot accept SVG at all — it only
 * sniffs JPEG/PNG/WebP, by design (arbitrary admin-uploaded SVG needs real
 * sanitization first, see `carousel-logos.ts`'s doc comment). A tool whose
 * real logo the client already vetted as an SVG for the carousel — AutoCAD's
 * own icon, say — would otherwise have no way to use it here. `seed/<file>`
 * points at that same pre-vetted, already-scanned file in
 * `public/software-logos/` instead of asking for a fresh raster upload.
 */
export function softwareLogoUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  if (path.startsWith("seed/")) return `/software-logos/${path.slice("seed/".length)}`;
  return `/api/media/software/${path.replace(/^software\//, "")}`;
}

/** A library item's cover thumbnail (NextPhase/03-library) — public Shape B media, same reasoning as a product image. */
export function libraryCoverUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  if (path.startsWith("seed/")) return `/library-covers/${path.slice("seed/".length)}`;
  return `/api/media/library/${path.replace(/^library\//, "")}`;
}

/**
 * A `srcset` for an uploaded image, using the width-limited copies the media
 * route generates (`?w=`). Returns `undefined` for anything that route does
 * not serve — a seeded file under `public/`, or an external URL — so the
 * caller can spread it and get a plain `src` in those cases.
 *
 * Pair it with a `sizes` that describes the slot, or the browser assumes the
 * image is the full viewport width and picks the largest candidate, which is
 * the problem this is here to solve.
 */
export function mediaSrcSet(
  url: string | null | undefined,
  widths: readonly number[],
): string | undefined {
  if (!url || !url.startsWith("/api/media/")) return undefined;
  return widths.map((width) => `${url}?w=${width} ${width}w`).join(", ");
}
