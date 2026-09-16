import { useTranslations } from "next-intl";
import type { LucideIcon } from "lucide-react";

/**
 * Stands in for an admin section that has a sidebar entry and a permission
 * already, but no build yet — Software Hub, Library, Courses & videos (see
 * NextPhase/). A 404 here would read as broken; this reads as "not yet",
 * which is what's actually true.
 */
export function ComingSoon({ Icon }: { Icon: LucideIcon }) {
  const t = useTranslations("admin.common.comingSoon");

  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-rule bg-card py-16 text-center">
      <span className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10">
        <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
      </span>
      <span className="rounded-full bg-paper px-2.5 py-1 text-[11px] font-bold tracking-wide text-muted-foreground uppercase">
        {t("badge")}
      </span>
      <p className="max-w-sm text-sm text-muted-foreground">{t("body")}</p>
    </div>
  );
}
