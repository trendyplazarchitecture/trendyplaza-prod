import { setRequestLocale } from "next-intl/server";

import { Hero } from "@/components/site/Hero";
import { Categories } from "@/components/site/Categories";
import { Products } from "@/components/site/Products";
import { LmsCta } from "@/components/site/LmsCta";
import { About } from "@/components/site/About";
import { Reviews } from "@/components/site/Reviews";
import { CtaCard } from "@/components/site/CtaCard";
import { Faq } from "@/components/site/Faq";
import { listFeaturedProducts } from "@/server/catalogue";
import { listTestimonials } from "@/server/cms";
import type { Locale } from "@/lib/i18n-content";

/**
 * Section order is the client's, from _AI_CONTEXT/12_DESIGN.md: hero, products,
 * about, reviews, one large call to action, footer. Categories and the course
 * panel sit between them.
 *
 * The data is read here, in a server component, and passed down as props. No
 * client component touches the database.
 */
export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [products, testimonials] = await Promise.all([
    listFeaturedProducts(locale),
    listTestimonials(),
  ]);

  return (
    <>
      <Hero />
      <Categories />
      <Products items={products} />
      <LmsCta />
      <About />
      <Reviews items={testimonials} />
      <CtaCard />
      <Faq />
    </>
  );
}
