import { NextResponse, type NextRequest } from "next/server";

import { requirePermission } from "@/server/session";
import { listOrders } from "@/server/orders";
import { logActivity } from "@/server/activity";
import { toDinars } from "@/lib/money";

/**
 * Orders as CSV, for the courier hand-off and for the client's own books.
 *
 * Two things make this work in the real world:
 *
 * 1. **A UTF-8 BOM.** Excel on Windows reads a BOM-less UTF-8 CSV as the
 *    system codepage, so every French accent and every Arabic name becomes
 *    mojibake on the client's first export. The three bytes are the fix.
 * 2. **CRLF line endings**, for the same reason.
 *
 * Prices are written in dinars, not centimes, because a human opens this.
 */
const COLUMNS = [
  "Reference",
  "Date",
  "Customer",
  "Phone",
  "Wilaya",
  "Commune",
  "Delivery",
  "Items",
  "Total DZD",
  "Status",
] as const;

function cell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  // A leading =, +, - or @ makes Excel treat the cell as a formula. Customer
  // names and notes are user input, so they get a guard.
  const guarded = /^[=+\-@]/.test(s) ? `'${s}` : s;
  return /[",\r\n;]/.test(guarded) ? `"${guarded.replace(/"/g, '""')}"` : guarded;
}

export async function GET(request: NextRequest) {
  // Exporting the whole customer list is a bigger act than reading one order.
  const actor = await requirePermission("orders.view");

  const status = request.nextUrl.searchParams.get("status") ?? undefined;
  const orders = await listOrders({
    status: status ? [status as "pending"] : undefined,
    limit: 5000,
  });

  const rows = orders.map((o) =>
    [
      o.reference,
      o.createdAt.toISOString().slice(0, 10),
      o.customerName,
      o.phone,
      o.wilayaNameFr,
      o.communeNameFr,
      o.deliveryType === "home" ? "Home" : "Stop desk",
      o.itemCount,
      toDinars(o.totalDzd),
      o.status,
    ]
      .map(cell)
      .join(","),
  );

  const csv = "﻿" + [COLUMNS.join(","), ...rows].join("\r\n") + "\r\n";

  await logActivity({
    actorId: actor.id,
    action: "orders.exported",
    entity: "order",
    after: { count: rows.length, status: status ?? "all" },
  });

  const stamp = new Date().toISOString().slice(0, 10);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="tp-orders-${stamp}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
