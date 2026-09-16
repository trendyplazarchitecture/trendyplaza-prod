import "server-only";

import { headers } from "next/headers";
import { db } from "@/db";
import { activityLog } from "@/db/schema";
import type { Executor } from "@/db";

/**
 * The client called this crucial once moderators exist: who confirmed the
 * order, who voided the code, who changed the price. Every mutating server
 * action writes one row.
 */
export async function logActivity(input: {
  actorId: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  before?: unknown;
  after?: unknown;
  tx?: Executor;
}) {
  let ip: string | null = null;
  try {
    const h = await headers();
    ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  } catch {
    // Called outside a request (a script, a test). The row is still worth writing.
  }

  await (input.tx ?? db).insert(activityLog).values({
    actorId: input.actorId,
    action: input.action,
    entity: input.entity,
    entityId: input.entityId ?? null,
    before: input.before ?? null,
    after: input.after ?? null,
    ip,
  });
}
