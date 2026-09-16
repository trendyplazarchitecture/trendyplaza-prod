import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { CatalogueClient } from "@/components/site/CatalogueClient";
import { listCategories, listProducts } from "@/server/catalogue";
import type { Locale } from "@/lib/i18n-content";

type Props = { params: Promise<{ locale: Locale }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "catalogue" });

  return {
    title: t("title"),
    description: t("subtitle"),
    openGraph: { title: t("title"), description: t("subtitle") },
  };
}

export default async function CataloguePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [products, categories] = await Promise.all([
    listProducts(locale),
    listCategories(locale),
  ]);
  return <CatalogueClient products={products} categories={categories} />;
}
