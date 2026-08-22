import "server-only";

import { sql } from "drizzle-orm";
import { db } from "@/db";

/**
 * One statement, no tables.
 *
 * It answers the question the health check is actually asking: can this
 * container reach Postgres. Counting rows would answer a different question
 * and would put a query on an unauthenticated endpoint.
 */
export async function pingDatabase(): Promise<boolean> {
  try {
    await db.execute(sql`select 1`);
    return true;
  } catch {
    return false;
  }
}
