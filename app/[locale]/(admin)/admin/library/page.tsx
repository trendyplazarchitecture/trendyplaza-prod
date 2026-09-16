import { PageHead } from "@/components/admin/AdminChrome";
import { PermissionGate } from "@/components/admin/PermissionGate";
import { MaintenanceToggle } from "@/components/admin/MaintenanceToggle";
import { LibraryManager } from "@/components/admin/LibraryManager";
import { requireStaffOrNotFound } from "@/server/session";
import { listAdminLibraryCategories, listAdminLibraryItems, listAllTagsForPicker } from "@/server/library-items";
import { isSectionUnderMaintenance } from "@/server/maintenance";

export const dynamic = "force-dynamic";

export default async function AdminLibraryPage() {
  const user = await requireStaffOrNotFound();
  if (!user.permissions.has("library.manage")) {
    return (
      <div className="space-y-6">
        <PageHead title="Library" />
        <PermissionGate permission="library.manage" />
      </div>
    );
  }

  const [rows, tagOptions, categories, isMaintenance] = await Promise.all([
    listAdminLibraryItems(),
    listAllTagsForPicker(),
    listAdminLibraryCategories(),
    isSectionUnderMaintenance("digital-library"),
  ]);

  return (
    <div className="space-y-6">
      <PageHead
        title="Library"
        action={<MaintenanceToggle section="digital-library" isActive={isMaintenance} />}
      />
      <LibraryManager rows={rows} tagOptions={tagOptions} categories={categories} />
    </div>
  );
}
