import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import type { Locale } from "@/lib/i18n-content";
import { AboutPageClient } from "@/components/site/AboutPageClient";
import { listRoster } from "@/server/roster";

type Props = { params: Promise<{ locale: Locale }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "aboutPage" });
  return {
    title: `${t("heroTitleLead")} ${t("heroTitleStrong")}`,
    description: t("heroLede"),
    openGraph: {
      title: `${t("heroTitleLead")} ${t("heroTitleStrong")}`,
      description: t("heroLede"),
    },
  };
}

export default async function AboutPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const roster = await listRoster(locale);

  return <AboutPageClient roster={roster} />;
}
