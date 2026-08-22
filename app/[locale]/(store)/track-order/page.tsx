import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { SuiviClient } from "@/components/site/SuiviClient";
import type { Locale } from "@/lib/i18n-content";

type Props = { params: Promise<{ locale: Locale }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "lookup" });
  return { title: t("title"), description: t("subtitle") };
}

/**
 * Guest order tracking. No account, because the store has no account.
 *
 * The page itself is static; the lookup is a rate-limited server action that
 * requires the reference and the phone number together.
 */
export default async function TrackOrderPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <SuiviClient />;
}
