"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Check, Clock, Loader2, ShieldQuestion, X } from "lucide-react";
import { toast } from "sonner";
import { reviewStaffAccessRequestAction } from "@/server/actions/access-requests";
import type { PendingStaffAccessRequest } from "@/server/access-requests";
import { PERMISSION_DETAILS, type Permission } from "@/lib/permissions";
import { Button } from "@/components/ui/button";

export function AccessRequestsPanel({
  requests,
}: {
  requests: PendingStaffAccessRequest[];
}) {
  const t = useTranslations("admin.accessRequests");
  const td = useTranslations("admin.dashboard");
  const router = useRouter();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (requests.length === 0) return null;

  function handleReview(requestId: string, approved: boolean) {
    setActiveId(requestId);
    startTransition(async () => {
      const res = await reviewStaffAccessRequestAction({ requestId, approved });
      if (res.ok) {
        toast.success(res.message);
        router.refresh();
      } else {
        toast.error(res.message);
      }
      setActiveId(null);
    });
  }

  function relativeTime(date: Date) {
    const mins = Math.round((Date.now() - new Date(date).getTime()) / 60000);
    if (mins < 1) return td("justNow");
    if (mins < 60) return td("minutesAgo", { count: mins });
    const hours = Math.round(mins / 60);
    if (hours < 24) return td("hoursAgo", { count: hours });
    return td("daysAgo", { count: Math.round(hours / 24) });
  }

  return (
    <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 sm:p-5">
      <div className="flex items-center gap-2 text-destructive">
        <ShieldQuestion className="h-5 w-5" aria-hidden="true" />
        <h2 className="text-sm font-semibold tracking-tight">
          {t("panelTitle", { count: requests.length })}
        </h2>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{t("panelHint")}</p>

      <ul className="mt-4 divide-y divide-border/60 rounded-lg border border-border bg-card">
        {requests.map((req) => {
          const detail = PERMISSION_DETAILS[req.permission as Permission];
          const loadingThis = isPending && activeId === req.id;

          return (
            <li
              key={req.id}
              className="flex flex-wrap items-center justify-between gap-4 p-3.5 sm:p-4"
            >
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-sm">{req.userName}</span>
                  <span className="text-xs text-muted-foreground">
                    <bdi dir="ltr">({req.userEmail})</bdi>
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="rounded bg-primary/10 px-2 py-0.5 font-medium text-primary-press">
                    {detail?.labelEn ?? req.permission}
                  </span>
                  <span className="font-mono text-[11px] text-muted-foreground">
                    [{req.permission}]
                  </span>
                  <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Clock className="h-3 w-3" aria-hidden="true" />
                    {relativeTime(req.createdAt)}
                  </span>
                </div>

                {req.note && (
                  <p className="text-xs italic text-muted-foreground">
                    &ldquo;{req.note}&rdquo;
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={loadingThis}
                  onClick={() => handleReview(req.id, false)}
                  className="gap-1 text-xs text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                >
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                  {t("deny")}
                </Button>

                <Button
                  size="sm"
                  disabled={loadingThis}
                  onClick={() => handleReview(req.id, true)}
                  className="gap-1 text-xs bg-emerald-600 font-medium text-white hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500"
                >
                  {loadingThis ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                  ) : (
                    <Check className="h-3.5 w-3.5" aria-hidden="true" />
                  )}
                  {t("acceptAndGrant")}
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
