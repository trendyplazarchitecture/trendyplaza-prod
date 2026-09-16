import { PageHead } from "@/components/admin/AdminChrome";
import { SettingsEditor } from "@/components/admin/SettingsEditor";
import { PermissionGate } from "@/components/admin/PermissionGate";
import { requireStaffOrNotFound } from "@/server/session";
import { getSiteSettings } from "@/server/settings";

export const dynamic = "force-dynamic";

/**
 * The values that used to be typed into two or three components at once.
 *
 * Gated on `settings.manage`, the permission that was already reserved for
 * this screen when the RIP-number task was first scoped and never built.
 */
export default async function AdminSettingsPage() {
  const user = await requireStaffOrNotFound();
  if (!user.permissions.has("settings.manage")) {
    return (
      <div className="space-y-6">
        <PageHead title="Settings" />
        <PermissionGate permission="settings.manage" />
      </div>
    );
  }

  const settings = await getSiteSettings();

  return (
    <div className="space-y-6">
      <PageHead
        title="Settings"
        meta="Site-wide values. A save here is live on the site immediately, no redeploy."
      />
      <SettingsEditor settings={settings} />
    </div>
  );
}
