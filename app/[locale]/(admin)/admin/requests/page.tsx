import { Link } from "../../../../../i18n/navigation";

import { PageHead } from "@/components/admin/AdminChrome";
import { RequestReview, type RequestRow } from "@/components/admin/RequestReview";
import { PermissionGate } from "@/components/admin/PermissionGate";
import { requireStaffOrNotFound } from "@/server/session";
import { listAccessRequests } from "@/server/access-requests";
import { pick, type Locale } from "@/lib/i18n-content";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const TABS = [
  { key: "pending", label: "Waiting" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
] as const;

export default async function AdminRequestsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ status?: string }>;
}) {
  const user = await requireStaffOrNotFound();
  if (!user.permissions.has("students.view")) {
    return (
      <div className="space-y-6">
        <PageHead title="Access Requests" />
        <PermissionGate permission="students.view" />
      </div>
    );
  }

  const { locale } = await params;
  const sp = await searchParams;
  const status = TABS.some((t) => t.key === sp.status)
    ? (sp.status as "pending" | "approved" | "rejected")
    : "pending";

  const raw = await listAccessRequests(status);

  const rows: RequestRow[] = raw.map((r) => ({
    id: r.id,
    status: r.status,
    createdAt: r.createdAt,
    amountClaimedDzd: r.amountClaimedDzd,
    receiptPath: r.receiptPath,
    receiptMime: r.receiptMime,
    userName: r.userName,
    userEmail: r.userEmail,
    userPhone: r.userPhone,
    packageTitle: pick(locale, { fr: r.packageTitleFr, ar: r.packageTitleAr }),
    packagePriceDzd: r.packagePriceDzd,
    packageDurationDays: r.packageDurationDays,
    rejectionReason: r.rejectionReasonFr,
  }));

  return (
    <div className="space-y-6">
      <PageHead
        title="Access requests"
        meta="Students who paid by Baridimob and are waiting on a decision. Nothing auto-approves."
      />

      <div className="flex flex-wrap gap-1.5">
        {TABS.map((tab) => {
          const active = status === tab.key;
          return (
            <Link
              key={tab.key}
              href={`/admin/requests?status=${tab.key}`}
              aria-current={active ? "page" : undefined}
              className={cn(
                "ui-dense rounded-md border px-3 py-1.5 text-xs font-medium transition-colors duration-150",
                active
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-card text-muted-foreground hover:border-foreground/30 hover:text-foreground",
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      <RequestReview rows={rows} />
    </div>
  );
}
