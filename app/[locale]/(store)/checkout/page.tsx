import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { CommanderClient, type CartLine } from "@/components/site/CommanderClient";
import { listWilayas } from "@/server/geo";
import { resolveCart } from "@/server/catalogue";
import { readCart } from "@/server/cart";
import type { Locale } from "@/lib/i18n-content";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ locale: Locale }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "checkout" });
  return {
    title: t("title"),
    description: t("subtitle"),
    // A cart is per visitor and never a search result.
    robots: { index: false, follow: true },
  };
}

export default async function CheckoutPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  // 69 rows with their shipping prices attached, so the delivery options can
  // show a figure before the visitor commits to a wilaya. Communes are fetched
  // per wilaya from the client, because all 1,541 is 160 KB.
  const wilayas = await listWilayas(locale);

  // The cookie holds ids and quantities. Titles and prices are resolved here,
  // against the database, so a stale cart shows today's price and a product
  // that has since been archived quietly drops out of the list.
  const { lines } = await resolveCart(await readCart(), locale);

  return <CommanderClient wilayas={wilayas} cart={lines satisfies CartLine[]} />;
}
