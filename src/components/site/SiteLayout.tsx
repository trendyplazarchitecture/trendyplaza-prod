import type { ReactNode } from "react";

import { AnnouncementBar } from "@/components/site/AnnouncementBar";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteSettingsProvider } from "@/components/site/SiteSettingsContext";
import { ScrollToTop } from "@/components/site/ScrollToTop";
import { getCartCount } from "@/server/cart";
import { getCurrentUser } from "@/server/session";
import { getSiteSettings } from "@/server/settings";

/**
 * The public shell.
 *
 * Session is read here, in a server component, and handed to the header as
 * two booleans. The header needs to know whether to say "Sign in" or "My
 * account", and whether to offer the admin, and neither answer is worth a
 * client-side fetch that flickers.
 *
 * The contact channels are read here for the same reason and handed down as
 * props: the header is a client component, so it cannot call the async
 * `getSiteSettings` itself, and reading it once here means the footer and the
 * header's mobile menu never risk disagreeing about the phone number.
 */
export async function SiteLayout({ children }: { children: ReactNode }) {
  const [user, cartCount, settings] = await Promise.all([
    getCurrentUser(),
    getCartCount(),
    getSiteSettings(),
  ]);

  return (
    <SiteSettingsProvider settings={settings}>
      <div className="flex min-h-screen max-w-full flex-col bg-background">
        <ScrollToTop />
        <AnnouncementBar />
        <SiteHeader
          signedIn={!!user}
          isStaff={!!user && user.permissions.size > 0}
          name={user?.name ?? null}
          cartCount={cartCount}
          settings={settings}
        />
        <main className="flex-1 max-w-full overflow-x-hidden">{children}</main>
        <SiteFooter settings={settings} />
      </div>
    </SiteSettingsProvider>
  );
}
