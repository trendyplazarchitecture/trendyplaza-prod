import "server-only";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error("DATABASE_URL is not set. Copy .env.example to .env.local.");
}

/**
 * Next dev reloads modules on every edit. Without this the process opens a
 * fresh pool per reload and walks into Postgres's default 100 connection
 * ceiling within a few minutes of work.
 */
const globalForDb = globalThis as unknown as {
  tpClient?: ReturnType<typeof postgres>;
};

const client =
  globalForDb.tpClient ??
  postgres(url, {
    max: 10,
    idle_timeout: 20,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.tpClient = client;
}

export const db = drizzle(client, { schema, casing: "snake_case" });
export { schema };

export type Db = typeof db;
export type Transaction = Parameters<Parameters<Db["transaction"]>[0]>[0];

/**
 * Anything that can run a statement. Helpers called both inside and outside a
 * transaction take this, so a caller never has to choose between duplicating
 * the helper and losing atomicity.
 */
export type Executor = Db | Transaction;
