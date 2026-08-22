import { NextResponse } from "next/server";

import { requirePermission } from "@/server/session";
import { listBatchCodes, markBatchExported } from "@/server/codes";

/**
 * A batch as CSV, for whoever prints the cards.
 *
 * Two columns, on purpose. `code` is the canonical stored form, which is what
 * a support agent types into a lookup. `printed` is the same code grouped in
 * fours, which is what goes on the card, because a student reading sixteen
 * unbroken characters off paper on a phone will lose their place.
 *
 * Exporting marks the batch, so the admin can see at a glance which batches
 * have been to the printer and which are still only in the database.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const actor = await requirePermission("codes.generate");

  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const codes = await listBatchCodes(id);
  if (codes.length === 0) return new NextResponse("Not found", { status: 404 });

  const rows = codes.map((c) =>
    [c.printed, c.code, c.isRedeemed ? "redeemed" : c.voidedAt ? "void" : "unused"].join(","),
  );

  // BOM and CRLF, so Excel on Windows opens it correctly.
  const csv = "﻿" + ["printed,code,state", ...rows].join("\r\n") + "\r\n";

  await markBatchExported(id, actor.id);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="tp-codes-${id.slice(0, 8)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
