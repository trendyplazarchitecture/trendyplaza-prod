import { ChevronRight, Lock } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Link } from "../../../i18n/navigation";
import { QUICK_ACCESS } from "./nav-items";
import type { Locale } from "@/lib/i18n-content";
import { cn } from "@/lib/utils";

/**
 * The quick-access grid: every section of the platform, one tap each.
 *
 * It reads the same list the sidebar reads, so the two can never disagree
 * about what exists or what it is called.
 *
 * A row, not a tile with a stack of decoration in it: icon, name, chevron. All
 * the same height, which is the thing that makes a grid look drawn rather than
 * assembled. A card that is not built is not a link — a tile that looks live
 * and 404s teaches a student to distrust the whole page — and a card that is
 * built but closed to this account says so rather than vanishing, because what
 * a pack does not cover is the thing they would buy next.
 */
export async function QuickAccess({
  locale,
  hasAccess,
  className,
}: {
  locale: Locale;
  hasAccess: boolean;
  className?: string;
}) {
  const t = await getTranslations({ locale, namespace: "portal" });

  return (
    <section className={className} aria-labelledby="quick-access">
      <h2 id="quick-access" className="text-sm font-semibold tracking-tight">
        {t("quickAccess")}
      </h2>

      <ul className="mt-3 grid gap-2">
        {QUICK_ACCESS.map(({ key, href, Icon, needsAccess, soon }) => {
          const live = !soon && !(needsAccess && !hasAccess);

          const body = (
            <>
              <span
                className={cn(
                  "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                  live ? "bg-primary/10 text-primary" : "bg-paper text-muted-foreground",
                )}
              >
                <Icon className="h-4.5 w-4.5" aria-hidden="true" />
              </span>

              <span className="min-w-0 flex-1 truncate text-sm font-medium">
                {t(`sections.${key}.title`)}
              </span>

              {live ? (
                <ChevronRight
                  className="h-4 w-4 shrink-0 text-muted-foreground rtl:rotate-180"
                  aria-hidden="true"
                />
              ) : (
                <span className="flex shrink-0 items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
                  {soon ? t("soon") : t("lockedBadge")}
                  <Lock className="h-3 w-3" aria-hidden="true" />
                </span>
              )}
            </>
          );

          return (
            <li key={key}>
              {live && href ? (
                <Link
                  href={href}
                  className="flex items-center gap-3 rounded-xl border border-rule bg-card p-3 transition-colors hover:border-primary/40 hover:bg-paper"
                >
                  {body}
                </Link>
              ) : (
                <div className="flex cursor-default items-center gap-3 rounded-xl border border-rule bg-card/60 p-3">
                  {body}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
