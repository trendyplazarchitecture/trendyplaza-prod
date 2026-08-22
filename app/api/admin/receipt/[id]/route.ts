import { NextResponse } from "next/server";
import { createReadStream } from "node:fs";
import { Readable } from "node:stream";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { accessRequests } from "@/db/schema";
import { requirePermission } from "@/server/session";
import { statStored } from "@/server/storage";

/**
 * Serves an uploaded Baridimob receipt to a permitted admin.
 *
 * Receipts hold a student's name, their bank details and their handwriting.
 * They live outside the web root and the only way to one is this route, which
 * checks a permission before touching the disk. The row id is the handle; the
 * stored filename is random and never appears in a URL.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await requirePermission("students.view");

  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const [row] = await db
    .select({ path: accessRequests.receiptPath, mime: accessRequests.receiptMime })
    .from(accessRequests)
    .where(eq(accessRequests.id, id))
    .limit(1);

  if (!row) return new NextResponse("Not found", { status: 404 });

  // statStored refuses any path that escapes STORAGE_ROOT, so a traversal
  // sequence that somehow reached the column cannot be read.
  const file = await statStored(row.path);
  if (!file) return new NextResponse("Not found", { status: 404 });

  const stream = Readable.toWeb(
    createReadStream(file.absolute),
  ) as unknown as ReadableStream;

  return new NextResponse(stream, {
    headers: {
      "Content-Type": row.mime ?? "application/octet-stream",
      "Content-Length": String(file.size),
      // Inline, never an attachment. An admin looks at it; they do not need a
      // copy of a customer's bank slip in their downloads folder.
      "Content-Disposition": "inline",
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
