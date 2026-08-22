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
