"use client";

import { Lock } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link, usePathname } from "../../../i18n/navigation";
import { PORTAL_GROUPS } from "./nav-items";
import { cn } from "@/lib/utils";

/**
 * The student's sidebar.
 *
 * Deliberately the same shape as the admin's: an active marker drawn as a rule
 * on the start edge rather than a filled pill, group labels in the dense
 * uppercase, icons that carry colour only when the row is current. Two shells
 * in one product that disagree about what "you are here" looks like is a
 * design system that has stopped being one.
 *
 * `onNavigate` is how the mobile drawer closes itself. The nav does not know
 * it is in a drawer; the drawer passes a callback.
 */
export function PortalNav({
  hasAccess,
  onNavigate,
}: {
  hasAccess: boolean;
  onNavigate?: () => void;
}) {
  const t = useTranslations("portal");
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-6" aria-label={t("navLabel")}>
      {PORTAL_GROUPS.map((group) => (
        <div key={group.key}>
          <p className="px-3 text-[10px] font-semibold tracking-[0.18em] text-muted-foreground/70 uppercase">
            {t(`groups.${group.key}`)}
          </p>

          <ul className="mt-2 space-y-0.5">
            {group.items.map(({ key, href, Icon, needsAccess, soon }) => {
              const locked = soon || (needsAccess && !hasAccess);
              const label = t(`sections.${key}.title`);

              // An anchor into the dashboard is still the dashboard, so the
              // hash is dropped before comparing.
              const path = href?.split("#")[0] ?? "";
              const active =
                !locked &&
                (path === "/account"
                  ? pathname === "/account" && !href?.includes("#")
                  : path.length > 1 && pathname.startsWith(path));

              if (locked) {
                return (
                  <li key={key}>
                    <span
                      className="flex cursor-default items-center gap-2.5 rounded-md px-3 py-2 text-sm text-muted-foreground/60"
                      title={soon ? t("soon") : t("lockedBadge")}
                    >
                      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                      <span className="min-w-0 flex-1 truncate">{label}</span>
                      <Lock className="h-3 w-3 shrink-0" aria-hidden="true" />
                      <span className="sr-only">
                        {soon ? t("soon") : t("lockedBadge")}
                      </span>
                    </span>
                  </li>
                );
              }

              return (
                <li key={key}>
                  <Link
                    href={href as string}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "group relative flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors duration-150",
                      active
                        ? "bg-paper font-semibold text-foreground"
                        : "text-muted-foreground hover:bg-paper/70 hover:text-foreground",
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        "absolute inset-y-1.5 -start-px w-0.5 origin-center rounded-full bg-primary transition-transform duration-200",
                        active ? "scale-y-100" : "scale-y-0",
                      )}
                    />
                    <Icon
                      className={cn(
                        "h-4 w-4 shrink-0 transition-colors",
                        active ? "text-primary" : "text-muted-foreground/70",
                      )}
                      aria-hidden="true"
                    />
                    <span className="min-w-0 flex-1 truncate">{label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
