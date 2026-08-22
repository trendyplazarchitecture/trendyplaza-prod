"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Menu, PanelLeftClose, PanelLeftOpen } from "lucide-react";

import { Link } from "../../../i18n/navigation";
import { AdminNav } from "@/components/admin/AdminNav";
import { AdminUserMenu } from "@/components/admin/AdminUserMenu";
import { MessageNotifier } from "@/components/admin/MessageNotifier";
import { LanguageSwitcher } from "@/components/site/LanguageSwitcher";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "tp-admin-nav-collapsed";

/**
 * The sidebar shell, split out of `layout.tsx` because the collapse toggle
 * needs client state. The preference is remembered per browser, not per
 * account: it is furniture, not data worth a column.
 */
export function AdminShell({
  user,
  workload,
  children,
}: {
  user: { name: string; email: string; permissions: string[] };
  workload: { pendingOrders: number; pendingRequests: number; pendingMessages: number };
  children: ReactNode;
}) {
  const t = useTranslations("admin.nav");
  const [collapsed, setCollapsed] = useState(false);
  const [ready, setReady] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

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
      {user.permissions.includes("messages.view") && <MessageNotifier />}

      <aside
        className={cn(
          "sticky top-0 hidden h-screen shrink-0 flex-col border-e border-rule bg-background transition-[width] duration-150 lg:flex lg:h-full",
          // No transition before the stored preference loads, so the sidebar
          // does not visibly snap from expanded to collapsed on first paint.
          !ready && "duration-0",
          collapsed ? "w-16" : "w-60",
        )}
      >
        <div
          className={cn(
            "flex h-16 items-center gap-2.5 border-b border-rule px-5",
            collapsed && "justify-center px-0",
          )}
        >
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
                {t("admin")}
              </span>
            </span>
          )}
        </div>

        <div className="scroll-thin flex-1 overflow-y-auto px-3 py-5">
          <AdminNav permissions={user.permissions} counts={workload} collapsed={collapsed} />
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

        {!collapsed && (
          <div className="border-t border-rule p-3">
            <LanguageSwitcher className="w-full justify-center" />
          </div>
        )}

        <div className="border-t border-rule p-3">
          <AdminUserMenu name={user.name} email={user.email} compact={collapsed} />
        </div>
      </aside>

      <div className="min-w-0 flex-1 lg:h-full lg:overflow-y-auto">
        {/* Mobile bar. A menu button reaches the same nav the desktop
            sidebar shows, plus a shortcut to the order queue since that is
            the one screen most likely to need a quick check from a phone. */}
        <div className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-rule bg-background/95 px-4 backdrop-blur lg:hidden">
          <div className="flex items-center gap-2">
            <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
              <SheetTrigger asChild>
                <button
                  type="button"
                  aria-label={t("openAdminMenu")}
                  className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-paper hover:text-foreground"
                >
                  <Menu className="h-5 w-5" aria-hidden="true" />
                </button>
              </SheetTrigger>
              <SheetContent side="start" className="flex w-72 flex-col gap-0 p-0">
                <SheetTitle className="sr-only">{t("adminMenu")}</SheetTitle>
                <div className="flex h-16 items-center gap-2.5 border-b border-rule px-5">
                  <img
                    src="/favicon/favicon-96x96.png"
                    alt=""
                    width={28}
                    height={28}
                    className="h-7 w-7 shrink-0 object-contain"
                    aria-hidden="true"
                  />
                  <span className="text-sm leading-tight font-bold tracking-tight" dir="ltr">
                    Trendy Plaza
                    <span className="block text-[9px] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
                      {t("admin")}
                    </span>
                  </span>
                </div>
                <div className="scroll-thin flex-1 overflow-y-auto px-3 py-5">
                  <AdminNav
                    permissions={user.permissions}
                    counts={workload}
                    onNavigate={() => setMobileNavOpen(false)}
                  />
                </div>
                <div className="border-t border-rule p-3">
                  <LanguageSwitcher className="w-full justify-center" />
                </div>
                <div className="border-t border-rule p-3">
                  <AdminUserMenu name={user.name} email={user.email} />
                </div>
              </SheetContent>
            </Sheet>
            <Link href="/admin" className="text-sm font-bold tracking-tight">
              {t("admin")}
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/admin/orders"
              className="ui-dense rounded border border-border px-2.5 py-1 text-xs font-medium"
            >
              {t("orders")}
              {workload.pendingOrders > 0 && (
                <span className="figures ms-1.5 text-primary-press">{workload.pendingOrders}</span>
              )}
            </Link>
            <LanguageSwitcher className="h-8 px-2" />
            <AdminUserMenu name={user.name} email={user.email} compact />
          </div>
        </div>

        <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
