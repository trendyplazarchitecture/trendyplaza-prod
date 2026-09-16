import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { redirect } from "../../../../i18n/navigation";
import type { Locale } from "@/lib/i18n-content";
import { SoftwareHubClient } from "@/components/site/SoftwareHubClient";
import { UnderMaintenance } from "@/components/site/UnderMaintenance";
import { listSoftwareTools } from "@/server/software";
import { listCarouselLogos } from "@/server/software-carousel";
import { getSiteSettings } from "@/server/settings";
import { getCurrentUser } from "@/server/session";
import { isSectionUnderMaintenance } from "@/server/maintenance";

/**
 * Launched. Linked from `SiteHeader.tsx`'s "Other" dropdown and the
 * portal's `nav-items.ts`. See NextPhase/UNCOMMITTED_FEATURES_HOLD.md for
 * the build history.
 *
 * Gated on an active entitlement, per an explicit later instruction from the
 * client that overrides the plan's own "public" recommendation (§7): only a
 * signed-in student whose code has actually unlocked something gets in. Not
 * signed in -> `/login`. Signed in but `on_hold` (no code redeemed yet) ->
 * `/account`, where redeeming one is the whole point of the page.
 *
 * Checked ahead of all of that: `section_maintenance` (`src/lib/maintenance.ts`).
 * When an admin has this section switched off, every visitor sees
 * `UnderMaintenance` instead — except a signed-in staff member holding
 * `software.manage`, who sees the page exactly as it will render once it is
 * back on.
 */

type Props = { params: Promise<{ locale: Locale }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "softwareHubPage" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function SoftwareHubPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await getCurrentUser();

  // Checked before the entitlement gate, and before the redirects below, so
  // a maintenance page reads as "this section is down" rather than being
  // hidden behind a login wall a visitor has no reason to think matters
  // right now. Staff who can edit this section still see it live — they are
  // usually the one who just flipped the switch and wants to check the
  // change, not the "Under maintenance" screen they already know is there.
  const bypassesMaintenance = user?.permissions.has("software.manage") ?? false;
  if (!bypassesMaintenance && (await isSectionUnderMaintenance("software-hub"))) {
    return <UnderMaintenance />;
  }

  if (!user) {
    redirect({ href: "/login", locale });
    return null;
  }
  if (user.state !== "active") {
    redirect({ href: "/account", locale });
    return null;
  }

  const [directory, carouselLogos, settings] = await Promise.all([
    listSoftwareTools(locale),
    listCarouselLogos(),
    getSiteSettings(),
  ]);
  const carouselSpeed = Number(settings.softwareCarouselSpeed) || 30;

  return (
    <SoftwareHubClient directory={directory} carouselLogos={carouselLogos} carouselSpeed={carouselSpeed} />
  );
}
