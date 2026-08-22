import { pingDatabase } from "@/server/health";

/**
 * Liveness for Docker and for Caddy's upstream check.
 *
 * It answers whether this container can serve a request that touches the
 * database, because that is the failure that matters: a Node process that is
 * up and cannot reach Postgres serves 500s to every page, and a health check
 * that only proves the process is running would call that healthy and keep it
 * in rotation.
 *
 * No version, no uptime, no table counts. It is unauthenticated, so it says
 * "ok" or it does not answer at all. Caddy refuses it from the outside.
 */
export const dynamic = "force-dynamic";

const HEADERS = { "content-type": "text/plain", "cache-control": "no-store" };

export async function GET() {
  const ok = await pingDatabase();
  return new Response(ok ? "ok" : "db", { status: ok ? 200 : 503, headers: HEADERS });
}
