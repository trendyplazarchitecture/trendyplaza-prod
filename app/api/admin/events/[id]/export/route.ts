import { NextResponse, type NextRequest } from "next/server";

import { requirePermission } from "@/server/session";
import { getPostById, listEventRegistrations } from "@/server/posts";
import { logActivity } from "@/server/activity";

const COLUMNS = [
  "Registered At",
  "Name",
  "Phone",
  "Email",
  "University",
  "Status",
  "Notes",
] as const;

function cell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  const guarded = /^[=+\-@]/.test(s) ? `'${s}` : s;
  return /[",\r\n;]/.test(guarded) ? `"${guarded.replace(/"/g, '""')}"` : guarded;
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const actor = await requirePermission("posts.manage");
  const { id } = await context.params;

  const event = await getPostById(id);

  if (!event) {
    return new NextResponse("Event not found", { status: 404 });
  }

  const attendees = await listEventRegistrations(id);

  const rows = attendees.map((a) =>
    [
      a.createdAt.toISOString().slice(0, 19).replace("T", " "),
      a.name,
      a.phone,
      a.email,
      a.university ?? "",
      a.status,
      a.notes ?? "",
    ]
      .map(cell)
      .join(","),
  );

  const csv = "\uFEFF" + [COLUMNS.join(","), ...rows].join("\r\n") + "\r\n";

  await logActivity({
    actorId: actor.id,
    action: "posts.attendees_exported",
    entity: "event_registration",
    entityId: id,
    after: { count: rows.length, eventTitle: event.titleEn },
  });

  const cleanSlug = event.slug || id.slice(0, 8);
  const stamp = new Date().toISOString().slice(0, 10);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="attendees-${cleanSlug}-${stamp}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
