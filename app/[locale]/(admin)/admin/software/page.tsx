import { getTranslations } from "next-intl/server";

import { PageHead } from "@/components/admin/AdminChrome";
import { SoftwareManager } from "@/components/admin/SoftwareManager";
import { CarouselManager } from "@/components/admin/CarouselManager";
import { PermissionGate } from "@/components/admin/PermissionGate";
import { MaintenanceToggle } from "@/components/admin/MaintenanceToggle";
import { requireStaffOrNotFound } from "@/server/session";
import { listAdminSoftwareTools } from "@/server/software";
import { listAdminCarouselLogos } from "@/server/software-carousel";
import { getSiteSettings } from "@/server/settings";
import { isSectionUnderMaintenance } from "@/server/maintenance";

export const dynamic = "force-dynamic";

export default async function AdminSoftwarePage() {
  const t = await getTranslations("admin.software");
  const user = await requireStaffOrNotFound();
  if (!user.permissions.has("software.manage")) {
    return (
      <div className="space-y-6">
        <PageHead title={t("pageTitle")} />
        <PermissionGate permission="software.manage" />
      </div>
    );
  }

  const [rows, carouselRows, settings, isMaintenance] = await Promise.all([
    listAdminSoftwareTools(),
    listAdminCarouselLogos(),
    getSiteSettings(),
    isSectionUnderMaintenance("software-hub"),
  ]);
  const live = rows.filter((r) => r.isVisible && !r.archivedAt).length;

  return (
    <div className="space-y-6">
      <PageHead
        title={t("pageTitle")}
        meta={t("pageMeta", { count: rows.length, live })}
        action={<MaintenanceToggle section="software-hub" isActive={isMaintenance} />}
      />
      <SoftwareManager rows={rows} />
      <CarouselManager rows={carouselRows} speedSeconds={Number(settings.softwareCarouselSpeed) || 30} />
    </div>
  );
}
