import { Search } from "lucide-react";

import { PageHead } from "@/components/admin/AdminChrome";
import { StudentsTable, type StudentRow } from "@/components/admin/StudentsTable";
import { Input } from "@/components/ui/input";
import { PermissionGate } from "@/components/admin/PermissionGate";
import { hasPermission, requireStaffOrNotFound } from "@/server/session";
import { listStudents } from "@/server/admin";

export const dynamic = "force-dynamic";

export default async function AdminStudentsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    sort?: string;
    direction?: "asc" | "desc";
    page?: string;
  }>;
}) {
  const user = await requireStaffOrNotFound();
  if (!user.permissions.has("students.view")) {
    return (
      <div className="space-y-6">
        <PageHead title="Students" />
        <PermissionGate permission="students.view" />
      </div>
    );
  }

  const canManage = await hasPermission("students.manage");
  const canDelete = await hasPermission("students.delete");

  const { q, sort, direction, page } = await searchParams;
  const result = await listStudents({ search: q, sort, direction, page });

  const rows: StudentRow[] = result.rows.map((r) => ({
    userId: r.userId,
    name: r.name,
    email: r.email,
    phone: r.phone,
    level: r.level,
    state: r.state,
    entitlementId: r.entitlementId,
    entitlementStatus: r.entitlementStatus,
    expiresAt: r.expiresAt,
    isExpired: Boolean(r.isExpired),
    packageTitle: r.packageTitleEn,
  }));

  return (
    <div className="space-y-6">
      <PageHead
        title="Students"
        meta="Pausing or revoking takes effect on their next page load, because every course page re-checks."
      />

      <form action="/admin/students" className="relative max-w-sm">
        <Search
          className="pointer-events-none absolute start-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        {/* Carried through, so searching does not silently reset the sort. */}
        {sort && <input type="hidden" name="sort" value={sort} />}
        {direction && <input type="hidden" name="direction" value={direction} />}
        <Input
          name="q"
          defaultValue={q ?? ""}
          placeholder="Name or email"
          aria-label="Search students"
          className="h-9 ps-8 text-sm"
        />
      </form>

      <StudentsTable
        rows={rows}
        canManage={canManage}
        canDelete={canDelete}
        total={result.total}
        page={result.page}
        perPage={result.perPage}
        sort={result.sort}
        direction={result.direction}
      />
    </div>
  );
}
