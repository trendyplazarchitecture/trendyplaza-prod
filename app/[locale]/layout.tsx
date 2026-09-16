import type { ReactNode } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { Almarai, Changa, Montserrat } from "next/font/google";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { isRtlLocale, locales, routing } from "../../i18n/routing";
import { StaleBuildRecovery } from "@/components/StaleBuildRecovery";
import "@/styles.css";

/*
 * Self-hosted, not a stylesheet from fonts.googleapis.com.
 *
 * That link was render-blocking on the critical path — Lighthouse measured
 * 450 ms of it on desktop and 1.9 s on a throttled phone — because the
 * browser had to fetch the CSS from one origin before it could discover the
 * font files on another. `next/font` inlines the @font-face rules in the
 * app's own CSS and serves the files from this origin.
 *
 * The Arabic faces are not preloaded: they are only needed when the page is
 * Arabic, and a preload on every English page is a download nobody uses.
 */
const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-montserrat",
});

const changa = Changa({
  subsets: ["arabic"],
  weight: ["500", "700"],
  display: "swap",
  preload: false,
  variable: "--font-changa",
});

const almarai = Almarai({
  subsets: ["arabic"],
  weight: ["400", "700"],
  display: "swap",
  preload: false,
  variable: "--font-almarai",
});

const fontVariables = [montserrat, changa, almarai].map((font) => font.variable).join(" ");

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.BETTER_AUTH_URL ||
    (process.env.NODE_ENV === "production"
      ? "https://trendyplaza.tech"
      : "http://localhost:3000");

  return {
    metadataBase: new URL(baseUrl),
    title: {
      default: `${t("title")} — ${t("tagline")}`,
      template: `%s | ${t("title")}`,
    },
    description: t("description"),
    verification: {
      google: "VmlV4GI5UlUNOQptN4Zvgy5GsSB8MVJypnoxAdvHuE8",
    },
    openGraph: {
      type: "website",
      locale,
      alternateLocale: locales.filter((l) => l !== locale),
      url: `${baseUrl}/${locale}`,
      siteName: "Trendy Plaza Architecture",
      title: `${t("title")} — ${t("tagline")}`,
      description: t("description"),
      images: [
        {
          url: `${baseUrl}/Hero-image.webp`,
          width: 1200,
          height: 630,
          alt: "Trendy Plaza Architecture — Studio supplies, books and printed course packs in Algeria",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${t("title")} — ${t("tagline")}`,
      description: t("description"),
      images: [`${baseUrl}/Hero-image.webp`],
    },
    // hreflang pairs, so Google serves an Algerian student the language they
    // searched in rather than whichever version it indexed first.
    alternates: {
      canonical: `/${locale}`,
      languages: Object.fromEntries(locales.map((l) => [l, `/${l}`])),
    },
    icons: {
      icon: [
        { url: "/favicon/favicon.svg", type: "image/svg+xml" },
        { url: "/favicon/favicon-96x96.png", sizes: "96x96", type: "image/png" },
      ],
      shortcut: "/favicon/favicon.ico",
      apple: "/favicon/apple-touch-icon.png",
    },
    manifest: "/favicon/site.webmanifest",
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  setRequestLocale(locale);
  const dir = isRtlLocale(locale) ? "rtl" : "ltr";

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.BETTER_AUTH_URL ||
    (process.env.NODE_ENV === "production"
      ? "https://trendyplaza.tech"
      : "http://localhost:3000");

  const todayIso = new Date().toISOString().split("T")[0];

  const organizationAndWebsiteSchema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["Organization", "OnlineStore"],
        "@id": `${baseUrl}/#organization`,
        name: "Trendy Plaza Architecture",
        url: baseUrl,
        logo: `${baseUrl}/favicon/favicon-96x96.png`,
        image: `${baseUrl}/Hero-image.webp`,
        description:
          "Studio supplies, books and printed course packs for architecture students in Algeria. Delivery to all wilayas, cash on delivery.",
        address: {
          "@type": "PostalAddress",
          addressCountry: "DZ",
        },
        sameAs: [
          "https://www.instagram.com/trendyplaza_architecture/",
          "https://www.facebook.com/profile.php?id=100091404342551",
          "https://www.tiktok.com/@trendyplaza_architecture",
        ],
        dateModified: todayIso,
      },
      {
        "@type": "WebSite",
        "@id": `${baseUrl}/#website`,
        url: baseUrl,
        name: "Trendy Plaza Architecture",
        description:
          "Architecture supplies, books, and courses for students in Algeria.",
        dateModified: todayIso,
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${baseUrl}/${locale}/catalogue?q={search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };

  return (
    <html lang={locale} dir={dir} className={`max-w-full ${fontVariables}`}>
      <head>
        <meta
          name="google-site-verification"
          content="VmlV4GI5UlUNOQptN4Zvgy5GsSB8MVJypnoxAdvHuE8"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationAndWebsiteSchema),
          }}
        />
      </head>
      <body className="min-h-screen max-w-full bg-background font-sans text-foreground antialiased">
        <NextIntlClientProvider>
          <StaleBuildRecovery />
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
