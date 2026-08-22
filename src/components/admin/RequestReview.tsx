"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Check, ExternalLink, Loader2, X } from "lucide-react";
import { toast } from "sonner";

import {
  approveRequestAction,
  rejectRequestAction,
  type ActionResult,
} from "@/server/actions/access";
import { REQUEST_TONE, StatusPill } from "./StatusPill";
import { Empty } from "./AdminChrome";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatDzd } from "@/lib/money";

export type RequestRow = {
  id: string;
  status: string;
  createdAt: Date;
  amountClaimedDzd: number | null;
  receiptPath: string;
  receiptMime: string | null;
  userName: string;
  userEmail: string;
  userPhone: string | null;
  packageTitle: string;
  packagePriceDzd: number;
  packageDurationDays: number | null;
  rejectionReason: string | null;
};

/**
 * Receipt review, one card per request.
 *
 * The receipt itself is the decision, so it is shown at a size an admin can
 * actually read a transfer amount off, next to the figure the student claimed
 * and the figure the package costs. The client explicitly asked for judgement
 * rather than a fixed rule, so nothing here auto-approves on a matching
 * amount; the mismatch is just made obvious.
 */
export function RequestReview({ rows }: { rows: RequestRow[] }) {
  const t = useTranslations("admin.requestReview");
  const STATUS_LABEL: Record<string, string> = {
    pending: t("statusWaiting"),
    approved: t("statusApproved"),
    rejected: t("statusRejected"),
  };
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<RequestRow | null>(null);
  const [reason, setReason] = useState("");
  const [isPending, startTransition] = useTransition();

  function run(id: string, fn: () => Promise<ActionResult>) {
    setBusyId(id);
    startTransition(async () => {
      try {
        const result = await fn();
        if (result.ok) {
          toast.success(result.message);
          router.refresh();
        } else {
          toast.error(result.message);
        }
      } catch {
        toast.error(t("genericError"));
      } finally {
        setBusyId(null);
      }
    });
  }

  if (rows.length === 0) {
    return <Empty title={t("emptyTitle")} hint={t("emptyHint")} />;
  }

  return (
    <>
      <ul className="grid gap-4 lg:grid-cols-2">
        {rows.map((row) => {
          const busy = busyId === row.id && isPending;
          const claimed = row.amountClaimedDzd;
          // Not a rule, a flag. The admin still decides.
          const mismatch = claimed !== null && claimed !== row.packagePriceDzd;

          return (
            <li
              key={row.id}
              className="flex flex-col overflow-hidden rounded-lg border border-border bg-card"
            >
              <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{row.userName}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {row.userEmail}
                    {row.userPhone && (
                      <>
                        {" · "}
                        <bdi dir="ltr">{row.userPhone}</bdi>
                      </>
                    )}
                  </p>
                </div>
                <StatusPill tone={REQUEST_TONE[row.status] ?? "halted"}>
                  {STATUS_LABEL[row.status] ?? row.status}
                </StatusPill>
              </div>

              <div className="grid gap-4 p-4 sm:grid-cols-[1fr_auto]">
                <dl className="space-y-2 text-sm">
                  <div className="flex gap-2">
                    <dt className="w-24 shrink-0 text-muted-foreground">{t("package")}</dt>
                    <dd className="font-medium">{row.packageTitle}</dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="w-24 shrink-0 text-muted-foreground">{t("price")}</dt>
                    <dd className="figures font-medium">{formatDzd(row.packagePriceDzd)}</dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="w-24 shrink-0 text-muted-foreground">{t("theySent")}</dt>
                    <dd
                      className={
                        mismatch
                          ? "figures font-semibold text-primary-press"
                          : "figures font-medium"
                      }
                    >
                      {claimed === null ? t("notStated") : formatDzd(claimed)}
                      {mismatch && (
                        <span className="ms-2 text-xs font-normal">{t("doesNotMatch")}</span>
                      )}
                    </dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="w-24 shrink-0 text-muted-foreground">{t("sent")}</dt>
                    <dd>
                      {row.createdAt.toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </dd>
                  </div>
                  {row.rejectionReason && (
                    <div className="flex gap-2">
                      <dt className="w-24 shrink-0 text-muted-foreground">{t("reason")}</dt>
                      <dd className="text-muted-foreground">{row.rejectionReason}</dd>
                    </div>
                  )}
                </dl>

                {/* The receipt is served through a permission-checked route,
                    never from a public path. */}
                <a
                  href={`/api/admin/receipt/${row.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative block h-32 w-32 shrink-0 overflow-hidden rounded border border-border bg-paper"
                >
                  {row.receiptMime?.startsWith("image/") ? (
                    <img
                      src={`/api/admin/receipt/${row.id}`}
                      alt={t("receiptAlt", { name: row.userName })}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                      PDF
                    </span>
                  )}
                  <span className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 bg-foreground/75 py-1 text-[11px] font-medium text-background opacity-0 transition-opacity group-hover:opacity-100">
                    <ExternalLink className="h-3 w-3" aria-hidden="true" />
                    {t("fullSize")}
                  </span>
                </a>
              </div>

              {row.status === "pending" && (
                <div className="flex items-center gap-2 border-t border-border bg-paper/60 px-4 py-3">
                  <Button
                    size="sm"
                    disabled={busy}
                    onClick={() =>
                      run(row.id, () => approveRequestAction({ requestId: row.id }))
                    }
                    className="gap-1.5"
                  >
                    {busy ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                    ) : (
                      <Check className="h-3.5 w-3.5" aria-hidden="true" />
                    )}
                    {t("approve")}
                    {row.packageDurationDays && (
                      <span className="font-normal opacity-80">
                        · {t("durationDaysShort", { count: row.packageDurationDays })}
                      </span>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busy}
                    onClick={() => {
                      setReason("");
                      setRejectTarget(row);
                    }}
                    className="gap-1.5"
                  >
                    <X className="h-3.5 w-3.5" aria-hidden="true" />
                    {t("reject")}
                  </Button>
                  <p className="ms-auto text-xs text-muted-foreground">{t("approvingOpensNote")}</p>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <Dialog open={rejectTarget !== null} onOpenChange={(o) => !o && setRejectTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("rejectTitle", { name: rejectTarget?.userName ?? "" })}</DialogTitle>
            <DialogDescription>{t("rejectDescription")}</DialogDescription>
          </DialogHeader>

          <div className="space-y-1.5">
            <label htmlFor="reject-reason" className="text-sm font-medium">
              {t("reason")}
            </label>
            <Textarea
              id="reject-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t("reasonPlaceholder")}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectTarget(null)}>
              {t("keepItWaiting")}
            </Button>
            <Button
              disabled={reason.trim().length < 3}
              onClick={() => {
                const target = rejectTarget;
                if (!target) return;
                setRejectTarget(null);
                run(target.id, () =>
                  rejectRequestAction({ requestId: target.id, reasonEn: reason.trim() }),
                );
              }}
            >
              {t("sendRejection")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
