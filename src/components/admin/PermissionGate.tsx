"use client";

import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ArrowLeft, CheckCircle2, Loader2, Lock, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { Link } from "../../../i18n/navigation";
import { requestStaffAccessAction } from "@/server/actions/access-requests";
import { PERMISSION_DETAILS, type Permission } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/i18n-content";

export function PermissionGate({
  permission,
  title,
  description,
}: {
  permission: Permission;
  title?: string;
  description?: string;
}) {
  const t = useTranslations("admin.common");
  const locale = useLocale() as Locale;
  const [isPending, startTransition] = useTransition();
  const [requested, setRequested] = useState(false);

  const detail = PERMISSION_DETAILS[permission];
  const localizedLabel =
    locale === "ar" ? detail?.labelAr : locale === "fr" ? detail?.labelFr : detail?.labelEn;
  const sectionTitle = title ?? localizedLabel ?? permission;
  // `PERMISSION_DETAILS[x].description` has no fr/ar variant yet (see
  // NextPhase/14, wave 3 — it's shown in TeamEditor/RolePresetsManager too,
  // a bigger unit of work than this one screen). Keeping the specific
  // English blurb here beats losing that information to a generic line.
  const sectionDesc = description ?? detail?.description ?? t("noPermissionDefault");

  function handleRequest() {
    startTransition(async () => {
      const res = await requestStaffAccessAction({ permission });
      if (res.ok) {
        setRequested(true);
        toast.success(res.message);
      } else {
        toast.error(res.message);
      }
    });
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col items-center justify-center py-12 text-center sm:py-16">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-destructive/30 bg-destructive/10 text-destructive shadow-sm">
        <ShieldAlert className="h-8 w-8" aria-hidden="true" />
      </div>

      <h1 className="mt-5 text-xl font-bold tracking-tight text-foreground sm:text-2xl">
        {t("accessRestricted", { section: sectionTitle })}
      </h1>

      <p className="mt-2 text-sm text-muted-foreground">
        {sectionDesc}
      </p>

      <div className="mt-6 w-full rounded-xl border border-destructive/25 bg-destructive/5 p-4 text-start">
        <div className="flex items-start gap-3">
          <Lock className="mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-hidden="true" />
          <div className="space-y-1">
            <p className="text-xs font-semibold text-destructive">
              {t("requiredPermission")} <span className="font-mono">{permission}</span>
            </p>
            <p className="text-xs text-muted-foreground">{t("requestNotice")}</p>
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        {requested ? (
          <Button
            disabled
            className="gap-2 bg-emerald-600 text-white hover:bg-emerald-600"
          >
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            {t("accessRequestedPending")}
          </Button>
        ) : (
          <Button
            onClick={handleRequest}
            disabled={isPending}
            variant="destructive"
            className="gap-2 font-semibold shadow-sm"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Lock className="h-4 w-4" aria-hidden="true" />
            )}
            {t("requestAccess")}
          </Button>
        )}

        <Button asChild variant="outline">
          <Link href="/admin" className="gap-1.5">
            <ArrowLeft className="h-4 w-4 rtl:-scale-x-100" aria-hidden="true" />
            {t("backToDashboard")}
          </Link>
        </Button>
      </div>
    </div>
  );
}
