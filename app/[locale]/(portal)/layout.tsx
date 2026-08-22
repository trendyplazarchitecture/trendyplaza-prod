import type { ReactNode } from "react";
import type { Metadata } from "next";

import { Link, redirect } from "../../../i18n/navigation";
import { PortalMobileNav } from "@/components/portal/PortalMobileNav";
import { PortalNav } from "@/components/portal/PortalNav";
import { PortalSearch } from "@/components/portal/PortalSearch";
import { PortalUserMenu } from "@/components/portal/PortalUserMenu";
import { LanguageSwitcher } from "@/components/site/LanguageSwitcher";
import { Toaster } from "@/components/ui/sonner";
import { getCurrentUser } from "@/server/session";
import { listMyEntitlements } from "@/server/entitlements";
import { listSearchable } from "@/server/portal";
import type { Locale } from "@/lib/i18n-content";

export const metadata: Metadata = {
  // A student's own dashboard has no business in a search index.
  robots: { index: false, follow: false },
};

/**
 * The student's shell: a sidebar of everywhere they can go, a bar carrying
 * search and their own face, and the page under it.
 *
 * The session is read here so the chrome can be drawn, and that is the only
 * thing this check is for. **It is not the gate.** Every page in the group
 * calls its own guard on its own first line, and every server action behind
 * these screens re-checks, because an action is a public endpoint reachable
 * without this layout ever rendering. Same rule as the admin shell, and the
 * same reason.
 */
export default async function PortalLayout({
  children,
  params,
}: {
  children: ReactNode;
  // Next's generated layout types hand back a plain `string` here, unlike a
  // page's. The narrowing is safe: `app/[locale]/layout.tsx` calls `notFound()`
  // for anything outside `routing.locales` before this ever renders.
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = raw as Locale;

  const user = await getCurrentUser();
  if (!user) {
    redirect({ href: "/login", locale });
    return null;
  }

  const [held, searchable] = await Promise.all([
    listMyEntitlements(user.id, locale),
    listSearchable(user.id, locale),
  ]);
  const hasAccess = held.some((e) => e.status === "active");

  return (
    <div className="min-h-screen bg-paper text-foreground">
      <div className="mx-auto flex w-full max-w-[1600px]">
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-e border-rule bg-background lg:flex">
          <div className="flex h-16 items-center gap-2.5 border-b border-rule px-5">
            <Link href="/" className="flex items-center gap-2.5">
              <img
                src="/favicon/favicon-96x96.png"
                alt=""
                width={28}
                height={28}
                className="h-7 w-7 object-contain"
                aria-hidden="true"
              />
              <span className="text-sm leading-tight font-bold tracking-tight" dir="ltr">
                Trendy Plaza
                <span className="block text-[9px] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
                  Student
                </span>
              </span>
            </Link>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-5">
            <PortalNav hasAccess={hasAccess} />
          </div>

          <div className="border-t border-rule p-2">
            <PortalUserMenu
              name={user.name}
              email={user.email}
              image={user.image}
              isStaff={user.permissions.size > 0}
            />
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-rule bg-background/95 px-4 backdrop-blur sm:px-6">
            <PortalMobileNav hasAccess={hasAccess} />

            {/* Search is only offered to someone who holds something. An empty
                palette is a control that answers "nothing" to every question. */}
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
                  isStaff={user.permissions.size > 0}
                  compact
                />
              </div>
            </div>
          </header>

          <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
        </div>
      </div>

      {/*
        Mounted here, not only in the admin layout. Every action on these
        screens reports back through it, and a toast raised from a component
        with no Toaster above it does nothing at all, silently.
      */}
      <Toaster position="bottom-right" closeButton richColors />
    </div>
  );
}
