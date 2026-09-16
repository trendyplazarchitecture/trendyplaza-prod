import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import type { Locale } from "@/lib/i18n-content";
import { EventsPageClient } from "@/components/site/EventsPageClient";
import { UnderMaintenance } from "@/components/site/UnderMaintenance";
import { listPastEvents, listUpcomingEvents } from "@/server/posts";
import { getCurrentUser } from "@/server/session";
import { isSectionUnderMaintenance } from "@/server/maintenance";

type Props = { params: Promise<{ locale: Locale }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "eventsPage" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    openGraph: {
      title: t("metaTitle"),
      description: t("metaDescription"),
    },
  };
}

export default async function EventsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await getCurrentUser();
  const bypassesMaintenance = user?.permissions.has("posts.manage") ?? false;
  if (!bypassesMaintenance && (await isSectionUnderMaintenance("news-events"))) {
    return <UnderMaintenance />;
  }

  const [upcoming, past] = await Promise.all([
    listUpcomingEvents(locale),
    listPastEvents(locale),
  ]);

  return <EventsPageClient upcoming={upcoming} past={past} />;
}
