import { PageHead } from "@/components/admin/AdminChrome";
import { RosterManager } from "@/components/admin/RosterManager";
import { PermissionGate } from "@/components/admin/PermissionGate";
import { requireStaffOrNotFound } from "@/server/session";
import { listAdminRoster } from "@/server/roster";

export const dynamic = "force-dynamic";

export default async function AdminRosterPage() {
  const user = await requireStaffOrNotFound();
  if (!user.permissions.has("roster.manage")) {
    return (
      <div className="space-y-6">
        <PageHead title="Meet the team" />
        <PermissionGate permission="roster.manage" />
      </div>
    );
  }

  const rows = await listAdminRoster();
  const live = rows.filter((r) => r.isVisible && !r.archivedAt).length;

  return (
    <div className="space-y-6">
      <PageHead
        title="Meet the team"
        meta={`${rows.length} team member${rows.length === 1 ? "" : "s"}, ${live} showing on the about page.`}
      />
      <RosterManager rows={rows} />
    </div>
  );
}
