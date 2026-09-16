import { Wrench } from "lucide-react";

import { PageHead } from "@/components/admin/AdminChrome";
import { ComingSoon } from "@/components/admin/ComingSoon";
import { PermissionGate } from "@/components/admin/PermissionGate";
import { requireStaffOrNotFound } from "@/server/session";

export const dynamic = "force-dynamic";

/**
 * NextPhase/05-services — scoped in `05-services/PLAN.md`, not started. The
 * nav entry (`AdminNav.tsx`, gated on `services.manage`) and both
 * permissions (`services.manage`, `services.review`) were reserved ahead of
 * the build, per this codebase's usual pattern — so until now this route had
 * no file at all and 404'd instead of reading as "not built yet". Same
 * template as `admin/library` and `admin/courses`.
 */
export default async function AdminServicesPage() {
  const user = await requireStaffOrNotFound();
  if (!user.permissions.has("services.manage")) {
    return (
      <div className="space-y-6">
        <PageHead title="Services" />
        <PermissionGate permission="services.manage" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHead title="Services" />
      <ComingSoon Icon={Wrench} />
    </div>
  );
}
