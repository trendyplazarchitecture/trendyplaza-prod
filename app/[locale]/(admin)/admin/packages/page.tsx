import { PageHead } from "@/components/admin/AdminChrome";
import { PackagesManager } from "@/components/admin/PackagesManager";
import { PermissionGate } from "@/components/admin/PermissionGate";
import { requireStaffOrNotFound } from "@/server/session";
import { listAdminPackages, getPackageScopeTree } from "@/server/admin";

export const dynamic = "force-dynamic";

export default async function AdminPackagesPage() {
  const user = await requireStaffOrNotFound();
  if (!user.permissions.has("packages.manage")) {
    return (
      <div className="space-y-6">
        <PageHead title="Packages" />
        <PermissionGate permission="packages.manage" />
      </div>
    );
  }

  const [rows, tree] = await Promise.all([listAdminPackages(), getPackageScopeTree()]);

  const live = rows.filter((p) => p.isVisible && !p.archivedAt).length;

  return (
    <div className="space-y-6">
      <PageHead
        title="Packages"
        meta={`${rows.length} package${rows.length === 1 ? "" : "s"}, ${live} offered on new orders and code batches.`}
      />
      <PackagesManager rows={rows} tree={tree} />
    </div>
  );
}
