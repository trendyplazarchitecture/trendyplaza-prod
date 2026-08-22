import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

/**
 * A connection built on demand, for scripts and tests that run outside the
 * Next.js process. Application code imports the singleton from `src/db`
 * instead, which is marked `server-only`.
 */
export function createDb(url: string, options: { max?: number } = {}) {
  const client = postgres(url, { max: options.max ?? 5 });
  return {
    db: drizzle(client, { schema, casing: "snake_case" }),
    client,
    async close() {
      await client.end();
    },
  };
}

export { schema };
