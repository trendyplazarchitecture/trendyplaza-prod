import { Wrench } from "lucide-react";
import { getTranslations } from "next-intl/server";

/**
 * Shown instead of a section's real page when `section_maintenance` has it
 * switched on — see `src/lib/maintenance.ts`. The page's own layout (header,
 * footer) still renders around this; only the content area is replaced, so
 * the site does not look broken while one section is down.
 */
export async function UnderMaintenance() {
  const t = await getTranslations("maintenance");

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-4 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-paper text-muted-foreground">
        <Wrench className="h-8 w-8" aria-hidden="true" />
      </div>
      <h1 className="mt-5 text-xl font-bold tracking-tight text-foreground sm:text-2xl">
        {t("title")}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">{t("body")}</p>
    </div>
  );
}
