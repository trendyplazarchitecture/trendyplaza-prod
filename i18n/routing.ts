import { defineRouting } from "next-intl/routing";

/**
 * English first, then Arabic, then French. That order is the client's, and it
 * is the order the switcher shows them in.
 *
 * English is also the authoring language: a content record is written in
 * English and translated outward, so `_en` is the column that is never empty.
 */
export const locales = ["en", "ar", "fr"] as const;
export type Locale = (typeof locales)[number];

export const localeNames: Record<Locale, string> = {
  en: "English",
  ar: "العربية",
  fr: "Français",
};

/** Shown in the compact switcher, where the full name does not fit. */
export const localeShortNames: Record<Locale, string> = {
  en: "EN",
  ar: "ع",
  fr: "FR",
};

export const rtlLocales: readonly Locale[] = ["ar"];

export function isRtlLocale(locale: string): boolean {
  return rtlLocales.includes(locale as Locale);
}

export const routing = defineRouting({
  locales,
  defaultLocale: "en",
  localePrefix: "always",
  // Browser negotiation would send most Algerian installs to Arabic or French
  // regardless of what the client wants a first-time visitor to see. The
  // switcher in the header is the way in, and the choice is remembered.
  localeDetection: false,
});
