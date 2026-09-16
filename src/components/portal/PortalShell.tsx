"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";

import { Link } from "../../../i18n/navigation";
import { PortalMobileNav } from "./PortalMobileNav";
import { PortalNav } from "./PortalNav";
import { PortalSearch } from "./PortalSearch";
import { PortalUserMenu } from "./PortalUserMenu";
import { LanguageSwitcher } from "@/components/site/LanguageSwitcher";
import { cn } from "@/lib/utils";
import type { SearchEntry } from "@/server/portal";

const STORAGE_KEY = "tp-portal-nav-collapsed";

/**
 * The student shell, split out of `layout.tsx` for the same reason
 * `AdminShell` is: the collapse toggle needs client state, and the two
 * sidebars are meant to feel like one design system rather than two shells
 * that happen to share a color. Sticky, full-height, independently
 * scrolling content — same containment as the admin shell — rather than the
 * page-level scroll the previous layout used, which is what let the
 * sidebar drift out of view on a tall dashboard.
 */
export function PortalShell({
  user,
  hasAccess,
  searchable,
  children,
}: {
  user: { name: string; email: string; image: string | null; isStaff: boolean };
  hasAccess: boolean;
  searchable: SearchEntry[];
  children: ReactNode;
}) {
  const t = useTranslations("portal");
  const [collapsed, setCollapsed] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setCollapsed(window.localStorage.getItem(STORAGE_KEY) === "1");
    setReady(true);
  }, []);

  function toggle() {
    setCollapsed((prev) => {
      const next = !prev;
      window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      return next;
    });
  }

  return (
    <div className="flex w-full lg:h-screen lg:overflow-hidden">
      <aside
        className={cn(
          "sticky top-0 hidden h-screen shrink-0 flex-col border-e border-rule bg-background transition-[width] duration-150 lg:flex lg:h-full",
          !ready && "duration-0",
          collapsed ? "w-16" : "w-64",
        )}
      >
        <div
          className={cn(
            "flex h-16 items-center gap-2.5 border-b border-rule px-5",
            collapsed && "justify-center px-0",
          )}
        >
          <Link href="/" className="flex min-w-0 items-center gap-2.5">
            <img
              src="/favicon/favicon-96x96.png"
              alt=""
              width={28}
              height={28}
              className="h-7 w-7 shrink-0 object-contain"
              aria-hidden="true"
            />
            {!collapsed && (
              <span className="min-w-0 text-sm leading-tight font-bold tracking-tight" dir="ltr">
                Trendy Plaza
                <span className="block text-[9px] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
                  Student
                </span>
              </span>
            )}
          </Link>
        </div>

        <div className="scroll-thin flex-1 overflow-y-auto px-3 py-5">
          <PortalNav hasAccess={hasAccess} collapsed={collapsed} />
        </div>

        <div className="border-t border-rule p-2">
          <button
            type="button"
            onClick={toggle}
            aria-pressed={collapsed}
            className={cn(
              "flex w-full items-center gap-2 rounded-md px-2 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-paper hover:text-foreground",
              collapsed && "justify-center",
            )}
          >
            {collapsed ? (
              <PanelLeftOpen className="h-4 w-4 shrink-0" aria-hidden="true" />
            ) : (
              <>
                <PanelLeftClose className="h-4 w-4 shrink-0" aria-hidden="true" />
                {t("collapse")}
              </>
            )}
          </button>
        </div>

        <div className="border-t border-rule p-2">
          <PortalUserMenu
            name={user.name}
            email={user.email}
            image={user.image}
            isStaff={user.isStaff}
            compact={collapsed}
          />
        </div>
      </aside>

      <div className="min-w-0 flex-1 lg:h-full lg:overflow-y-auto">
        {/*
          `[transform:translateZ(0)]` promotes this element to its own GPU
          compositing layer. Without it, a `sticky` header carrying
          `backdrop-blur` inside a custom `overflow-y-auto` scroll container
          (this shell scrolls its own column, not the document) tears/crops
          under fast scroll in Chromium — the blur forces a repaint of
          everything behind it on every scroll frame, and the two fight for
          the same layer. Isolating it into its own layer is the standard
          fix and costs nothing visually.
        */}
        <header className="sticky top-0 z-30 flex h-16 [transform:translateZ(0)] items-center gap-3 border-b border-rule bg-background/95 px-4 backdrop-blur sm:px-6">
          <PortalMobileNav hasAccess={hasAccess} />

          {hasAccess ? (
            <PortalSearch entries={searchable} />
          ) : (
            <span className="flex-1" />
          )}

          <div className="ms-auto flex shrink-0 items-center gap-2">
            <LanguageSwitcher />
            <div className="lg:hidden">
              <PortalUserMenu
                name={user.name}
                email={user.email}
                image={user.image}
                isStaff={user.isStaff}
                compact
              />
            </div>
          </div>
        </header>

        <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
