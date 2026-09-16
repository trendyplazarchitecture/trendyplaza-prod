"use client";

import { createContext, useContext, type ReactNode } from "react";

import type { SiteSettings } from "@/server/settings";

/**
 * The three contact channels, reachable from any client component in the
 * storefront tree without threading a `settings` prop through every page
 * between `SiteLayout` and wherever a component actually needs one — `About`
 * on the landing page, the full `/about` page, the footer's compact teaser.
 * `SiteHeader` and `SiteFooter` take it as a direct prop instead, since they
 * are immediate children of `SiteLayout` and a prop is simpler there than a
 * context read.
 *
 * The default is `null` rather than the real fallback values, so a component
 * that renders outside the provider fails loudly in development instead of
 * quietly showing a placeholder phone number that looks real.
 */
const SiteSettingsContext = createContext<SiteSettings | null>(null);

export function SiteSettingsProvider({
  settings,
  children,
}: {
  settings: SiteSettings;
  children: ReactNode;
}) {
  return (
    <SiteSettingsContext.Provider value={settings}>{children}</SiteSettingsContext.Provider>
  );
}

export function useSiteSettings(): SiteSettings {
  const settings = useContext(SiteSettingsContext);
  if (!settings) {
    throw new Error("useSiteSettings() called outside SiteSettingsProvider.");
  }
  return settings;
}
