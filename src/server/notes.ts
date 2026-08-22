import "server-only";

import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { orders, userNotes, users } from "@/db/schema";

/**
 * Internal notes on a student or an order.
 *
 * "Doesn't pick up" on Tuesday and "wrong number" on Thursday are two facts.
 * `orders.internal_note` is one overwritable column, which loses the history
 * and lets two agents overwrite each other, so notes are a log instead.
 *
 * `subject_id` carries no foreign key, because it points at one of two tables
 * depending on `subject_type` — the same shape as `package_contents.scope_id`.
 * The pairing is therefore validated here, before anything is written, rather
 * than trusted.
 */

export type NoteSubject = "student" | "order";

export type Note = {
  id: string;
  body: string;
  createdAt: Date;
  authorName: string | null;
};

export async function listNotes(
  subjectType: NoteSubject,
  subjectId: string,
): Promise<Note[]> {
  const rows = await db
    .select({
      id: userNotes.id,
      body: userNotes.body,
      createdAt: userNotes.createdAt,
      authorName: users.name,
    })
    .from(userNotes)
    .leftJoin(users, eq(users.id, userNotes.authorId))
    .where(
      and(
        eq(userNotes.subjectType, subjectType),
        eq(userNotes.subjectId, subjectId),
        isNull(userNotes.archivedAt),
      ),
    )
    .orderBy(desc(userNotes.createdAt));

  return rows;
}

/**
 * Confirms the subject exists before a note is hung off it.
 *
 * Without a foreign key there is nothing else stopping a typo, or a posted id,
 * creating a note attached to nothing. A note nobody can ever see again is
 * worse than a refusal.
 */
export async function subjectExists(
  subjectType: NoteSubject,
  subjectId: string,
): Promise<boolean> {
  if (subjectType === "student") {
    const [row] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, subjectId))
      .limit(1);
    return Boolean(row);
  }

  const [row] = await db
    .select({ id: orders.id })
    .from(orders)
    .where(eq(orders.id, subjectId))
    .limit(1);
  return Boolean(row);
}

/** How many live notes each subject has. Drives the count on a list row. */
export async function countNotes(subjectType: NoteSubject, subjectIds: string[]) {
  const counts = new Map<string, number>();
  if (subjectIds.length === 0) return counts;

  const rows = await db
    .select({ subjectId: userNotes.subjectId })
    .from(userNotes)
    .where(and(eq(userNotes.subjectType, subjectType), isNull(userNotes.archivedAt)));

  for (const row of rows) {
    if (!subjectIds.includes(row.subjectId)) continue;
    counts.set(row.subjectId, (counts.get(row.subjectId) ?? 0) + 1);
  }

  return counts;
}
