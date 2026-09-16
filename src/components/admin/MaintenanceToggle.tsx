"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { AlertTriangle, Loader2, ShieldOff } from "lucide-react";
import { toast } from "sonner";

import { setSectionMaintenanceAction } from "@/server/actions/maintenance";
import { maintenanceSection, type MaintenanceSectionKey } from "@/lib/maintenance";
import type { Locale } from "@/lib/i18n-content";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

/**
 * The one-button "take this page down" control, dropped into a `PageHead`'s
 * `action` slot. Turning maintenance ON asks for confirmation first — it
 * hides a live page from every visitor — turning it OFF does not, since
 * undoing a mistaken "on" should be the fast path, not the slow one.
 *
 * The label shown is the registry's own trilingual one
 * (`MAINTENANCE_SECTIONS` in `lib/maintenance.ts`), not a prop repeated at
 * every call site — one section, one name, in whichever locale the admin is
 * viewing in.
 */
export function MaintenanceToggle({
  section,
  isActive,
}: {
  section: MaintenanceSectionKey;
  isActive: boolean;
}) {
  const t = useTranslations("admin.maintenanceToggle");
  const locale = useLocale() as Locale;
  const spec = maintenanceSection(section);
  const label = locale === "ar" ? spec.labelAr : locale === "fr" ? spec.labelFr : spec.labelEn;
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function toggle(next: boolean) {
    startTransition(async () => {
      const result = await setSectionMaintenanceAction({ section, isActive: next });
      if (result.ok) {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  if (isActive) {
    return (
      <Button
        type="button"
        variant="destructive"
        size="sm"
        className="gap-1.5"
        disabled={isPending}
        onClick={() => toggle(false)}
      >
        {isPending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
        ) : (
          <ShieldOff className="h-3.5 w-3.5" aria-hidden="true" />
        )}
        {t("backOnline")}
      </Button>
    );
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="gap-1.5" disabled={isPending}>
          <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
          {t("turnOffline")}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("confirmTitle", { label })}</AlertDialogTitle>
          <AlertDialogDescription>{t("confirmDescription", { label })}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("confirmCancel")}</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={() => toggle(true)}
          >
            {t("confirmAction")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
