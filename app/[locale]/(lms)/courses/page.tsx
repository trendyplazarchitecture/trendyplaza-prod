import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { CoursClient } from "@/components/site/CoursClient";
import { getLibraryStats, listResourceTypes } from "@/server/content";
import { getCurrentUser } from "@/server/session";
import { hasAnyAccess } from "@/server/entitlements";
import type { Locale } from "@/lib/i18n-content";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ locale: Locale }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "coursesPage" });

  return {
    title: `${t("titleLead")} ${t("titleStrong")}`,
    description: t("lede"),
    openGraph: { title: `${t("titleLead")} ${t("titleStrong")}`, description: t("lede") },
  };
}

/**
 * The public LMS page. The figures in the strip are read from the database;
 * the hero image beside them is a fixed asset rather than a live rendering of
 * one school's tree — a text preview of "whichever university happens to
 * have the most modules today" read as sparse and arbitrary depending on what
 * the client had entered, which is a worse first impression than a single
 * photograph that never changes underneath a visitor.
 */
export default async function CoursPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [stats, resourceTypes, user] = await Promise.all([
    getLibraryStats(),
    listResourceTypes(locale),
    getCurrentUser(),
  ]);

  // Where the second button goes. Decided here, because the page is rendered
  // on the server anyway and a button that flickers from one destination to
  // another after hydration is worse than no button.
  const entitled = user ? await hasAnyAccess(user.id) : false;
  const destination = entitled
    ? ({ href: "/library", label: "library" } as const)
    : user
      ? ({ href: "/account", label: "account" } as const)
      : ({ href: "/signup", label: "signUp" } as const);

  return <CoursClient stats={stats} resourceTypes={resourceTypes} destination={destination} />;
}
