import type { ReactNode } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { isRtlLocale, locales, routing } from "../../i18n/routing";
import "@/styles.css";

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

  return (
    <html lang={locale} dir={dir} className="max-w-full overflow-x-hidden">
      <head>
        <meta
          name="google-site-verification"
          content="VmlV4GI5UlUNOQptN4Zvgy5GsSB8MVJypnoxAdvHuE8"
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/*
          Latin and Arabic families are both loaded because the switcher can
          change script without a reload. Self-hosting these is a Phase 6 task:
          two round trips to a third-party CDN is measurable on 3G.
        */}
        <link
          href="https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400&family=Changa:wght@500;700&family=Almarai:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen max-w-full overflow-x-hidden bg-background font-sans text-foreground antialiased">
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
