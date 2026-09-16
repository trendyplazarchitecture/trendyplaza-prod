import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import type { Locale } from "@/lib/i18n-content";
import { NewsPageClient } from "@/components/site/NewsPageClient";
import { UnderMaintenance } from "@/components/site/UnderMaintenance";
import { listNews } from "@/server/posts";
import { getCurrentUser } from "@/server/session";
import { isSectionUnderMaintenance } from "@/server/maintenance";

type Props = {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ page?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "newsPage" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    openGraph: {
      title: t("metaTitle"),
      description: t("metaDescription"),
    },
  };
}

export default async function NewsPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { page } = await searchParams;
  setRequestLocale(locale);

  const user = await getCurrentUser();
  const bypassesMaintenance = user?.permissions.has("posts.manage") ?? false;
  if (!bypassesMaintenance && (await isSectionUnderMaintenance("news-events"))) {
    return <UnderMaintenance />;
  }

  const news = await listNews(locale, { page, perPage: 24 });

  return <NewsPageClient news={news} />;
}
