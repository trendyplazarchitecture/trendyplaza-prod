import { PageHead } from "@/components/admin/AdminChrome";
import { TeamEditor } from "@/components/admin/TeamEditor";
import { PermissionGate } from "@/components/admin/PermissionGate";
import { requireStaffOrNotFound } from "@/server/session";
import { listArchivedStaff, listPromotable, listStaff } from "@/server/team";
import { listPendingStaffAccessRequests } from "@/server/access-requests";
import { listRolePresets } from "@/server/roles";

export const dynamic = "force-dynamic";

/**
 * The team, and what each of them can reach.
 *
 * Gated on `users.manage`. Staff members without `users.manage` will see
 * a PermissionGate to request access from administrators.
 */
export default async function AdminTeamPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const actor = await requireStaffOrNotFound();

  if (!actor.permissions.has("users.manage")) {
    return (
      <div className="space-y-6">
        <PageHead
          title="Team Management"
          meta="Permissions and staff role configurations."
        />
        <PermissionGate permission="users.manage" />
      </div>
    );
  }

  const { q } = await searchParams;
  const [staff, archivedStaff, candidates, accessRequests, rolePresets] = await Promise.all([
    listStaff(),
    listArchivedStaff(),
    listPromotable(q),
    listPendingStaffAccessRequests(),
    listRolePresets(),
  ]);

  return (
    <div className="space-y-6">
      <PageHead
        title="Team & Access Control"
        meta="Permissions are read on every request, so any change takes effect immediately."
      />

      <TeamEditor
        staff={staff}
        archivedStaff={archivedStaff}
        candidates={candidates.map((c) => ({ id: c.id, name: c.name, email: c.email }))}
        accessRequests={accessRequests}
        rolePresets={rolePresets}
        currentUserId={actor.id}
      />
    </div>
  );
}
