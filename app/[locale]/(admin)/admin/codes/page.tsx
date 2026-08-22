import { PageHead } from "@/components/admin/AdminChrome";
import { CodeBatches, type BatchRow } from "@/components/admin/CodeBatches";
import { PermissionGate } from "@/components/admin/PermissionGate";
import { requireStaffOrNotFound } from "@/server/session";
import { listBatches } from "@/server/codes";
import { listPackages } from "@/server/catalogue";
import { pick, type Locale } from "@/lib/i18n-content";

export const dynamic = "force-dynamic";

export default async function AdminCodesPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const user = await requireStaffOrNotFound();
  if (!user.permissions.has("codes.generate")) {
    return (
      <div className="space-y-6">
        <PageHead title="Access Codes" />
        <PermissionGate permission="codes.generate" />
      </div>
    );
  }
  const { locale } = await params;

  const [batches, packages] = await Promise.all([listBatches(), listPackages(locale)]);

  const rows: BatchRow[] = batches.map((b) => ({
    id: b.id,
    label: b.label,
    prefix: b.prefix,
    quantity: b.quantity,
    redeemedCount: b.redeemedCount,
    durationDays: b.durationDays,
    createdAt: b.createdAt,
    exportedAt: b.exportedAt,
    packageTitle: pick(locale, { fr: b.packageTitleFr, ar: b.packageTitleAr }),
  }));

  return (
    <div className="space-y-6">
      <PageHead
        title="Access codes"
        meta="Generated in batches, printed onto cards, sealed into packs. A code is never tied to an order."
      />
      <CodeBatches rows={rows} packages={packages} />
    </div>
  );
}
