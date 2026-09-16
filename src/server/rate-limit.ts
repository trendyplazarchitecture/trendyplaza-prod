import "server-only";

import { headers } from "next/headers";

/**
 * A fixed-window limiter, in process memory.
 *
 * `01_RULES.md` asks every public endpoint to be rate limited: order lookup,
 * code redemption, checkout, login, access requests. This is the smallest
 * thing that does that honestly.
 *
 * What it is not: shared state. One Node process holds one map, so a second
 * web container would double every allowance, and a restart forgives everyone.
 * That is an acceptable trade at this size, where the deployment is a single
 * container behind Caddy, and it is written down here so nobody discovers it
 * during an incident. Moving to a Postgres table is a contained change: the
 * signature below is the whole surface.
 *
 * It is a brake on scripted abuse, not a defence against a distributed one.
 */

type Window = { count: number; resetAt: number };

const windows = new Map<string, Window>();

/** Stale keys outnumber live ones within minutes on a public endpoint. */
function sweep(now: number) {
  if (windows.size < 5_000) return;
  for (const [key, window] of windows) {
    // An in-memory Map, not a table. The soft-delete rule does not reach it.
    // eslint-disable-next-line no-restricted-syntax
    if (window.resetAt <= now) windows.delete(key);
  }
}

export type RateLimitResult = { ok: true } | { ok: false; retryAfterSeconds: number };

export function rateLimit(
  key: string,
  options: { limit: number; windowSeconds: number },
): RateLimitResult {
  const now = Date.now();
  sweep(now);

  const existing = windows.get(key);

  if (!existing || existing.resetAt <= now) {
    windows.set(key, { count: 1, resetAt: now + options.windowSeconds * 1000 });
    return { ok: true };
  }

  if (existing.count >= options.limit) {
    return {
      ok: false,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }

  existing.count += 1;
  return { ok: true };
}

/**
 * The client address as Caddy reports it.
 *
 * `x-forwarded-for` is trivially spoofable when it reaches the app directly,
 * so this is only trustworthy because the only route in is the reverse proxy,
 * which overwrites it. Never use this value for authorisation, only for
 * throttling.
 */
export async function clientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return h.get("x-real-ip") ?? "unknown";
}

/** `rateLimit` keyed on the caller's address, which is what a public endpoint wants. */
export async function limitByIp(
  bucket: string,
  options: { limit: number; windowSeconds: number },
): Promise<RateLimitResult> {
  return rateLimit(`${bucket}:${await clientIp()}`, options);
}

/** Test seam. Never called by application code. */
export function resetRateLimits() {
  windows.clear();
}
