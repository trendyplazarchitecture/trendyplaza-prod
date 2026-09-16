import { PlayCircle } from "lucide-react";

import { PageHead } from "@/components/admin/AdminChrome";
import { ComingSoon } from "@/components/admin/ComingSoon";
import { PermissionGate } from "@/components/admin/PermissionGate";
import { requireStaffOrNotFound } from "@/server/session";

export const dynamic = "force-dynamic";

export default async function AdminCoursesPage() {
  const user = await requireStaffOrNotFound();
  if (!user.permissions.has("courses.manage")) {
    return (
      <div className="space-y-6">
        <PageHead title="Courses & videos" />
        <PermissionGate permission="courses.manage" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHead title="Courses & videos" />
      <ComingSoon Icon={PlayCircle} />
    </div>
  );
}
