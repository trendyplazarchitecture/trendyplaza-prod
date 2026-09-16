import type { ReactNode } from "react";
import type { Metadata } from "next";

import { redirect } from "../../../i18n/navigation";
import { PortalShell } from "@/components/portal/PortalShell";
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
    <div className="bg-paper text-foreground lg:h-screen">
      <PortalShell
        user={{
          name: user.name,
          email: user.email,
          image: user.image,
          isStaff: user.permissions.size > 0,
        }}
        hasAccess={hasAccess}
        searchable={searchable}
      >
        {children}
      </PortalShell>

      {/*
        Mounted here, not only in the admin layout. Every action on these
        screens reports back through it, and a toast raised from a component
        with no Toaster above it does nothing at all, silently.
      */}
      <Toaster position="bottom-right" closeButton richColors />
    </div>
  );
}
