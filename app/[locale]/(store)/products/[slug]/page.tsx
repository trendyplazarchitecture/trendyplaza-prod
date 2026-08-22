import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { ProductDetailClient } from "@/components/site/ProductDetailClient";
import { getProductBySlug, listProducts } from "@/server/catalogue";
import { productImageUrl } from "@/lib/media";
import type { Locale } from "@/lib/i18n-content";

type Props = { params: Promise<{ locale: Locale; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const product = await getProductBySlug(slug, locale);

  if (!product) {
    const t = await getTranslations({ locale, namespace: "products" });
    return { title: t("notFound") };
  }

  return {
    title: product.title,
    description: product.description,
    openGraph: {
      title: product.title,
      description: product.description,
      images: product.gallery[0]
        ? [{ url: productImageUrl(product.gallery[0].path) ?? "" }]
        : undefined,
    },
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const product = await getProductBySlug(slug, locale);
  if (!product) notFound();

  const all = await listProducts(locale);
  // Same rayon first, because that is what "also worth a look" means to
  // someone holding a drawing tube.
  const related = [
    ...all.filter((p) => p.slug !== slug && p.category === product.category),
    ...all.filter((p) => p.slug !== slug && p.category !== product.category),
  ].slice(0, 3);

  return (
    <>
      <ProductDetailClient product={product} related={related} />
      {/*
        Product structured data, so a search result carries the price and the
        stock state rather than a bare title.
      */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: product.title,
            description: product.description,
            offers: {
              "@type": "Offer",
              price: (product.priceDzd / 100).toFixed(2),
              priceCurrency: "DZD",
              availability: product.inStock
                ? "https://schema.org/InStock"
                : "https://schema.org/OutOfStock",
            },
          }),
        }}
      />
    </>
  );
}
