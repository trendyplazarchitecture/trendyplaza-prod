import { getTranslations, setRequestLocale } from "next-intl/server";

import { Hero } from "@/components/site/Hero";
import { Categories } from "@/components/site/Categories";
import { Products } from "@/components/site/Products";
import { LogoCarousel } from "@/components/site/LogoCarousel";
import { LmsCta } from "@/components/site/LmsCta";
import { About } from "@/components/site/About";
import { Reviews } from "@/components/site/Reviews";
import { CtaCard } from "@/components/site/CtaCard";
import { Faq } from "@/components/site/Faq";
import { listFeaturedProducts } from "@/server/catalogue";
import { listTestimonials } from "@/server/cms";
import { listCarouselLogos } from "@/server/software-carousel";
import { getSiteSettings } from "@/server/settings";
import type { Locale } from "@/lib/i18n-content";

const FAQ_KEYS = ["q1", "q2", "q3", "q4", "q5", "q6", "q7", "q8"] as const;

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

  const [products, testimonials, tFaq, carouselLogos, settings] = await Promise.all([
    listFeaturedProducts(locale),
    listTestimonials(),
    getTranslations({ locale, namespace: "faq" }),
    listCarouselLogos(),
    getSiteSettings(),
  ]);
  const carouselSpeed = Number(settings.softwareCarouselSpeed) || 30;

  const todayIso = new Date().toISOString().split("T")[0];

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    dateModified: todayIso,
    mainEntity: FAQ_KEYS.map((key) => ({
      "@type": "Question",
      name: tFaq(`${key}.q`),
      acceptedAnswer: {
        "@type": "Answer",
        text: tFaq(`${key}.a`),
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <Hero />
      <Categories />
      <Products items={products} />
      <LogoCarousel logos={carouselLogos} speedSeconds={carouselSpeed} />
      <LmsCta />
      <About />
      <Reviews items={testimonials} />
      <CtaCard />
      <Faq />
    </>
  );
}
