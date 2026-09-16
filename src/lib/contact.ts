import type { SiteSettings } from "@/server/settings";

/**
 * The three channels, turned into hrefs and display text once, so a
 * component reaches for `contactLinks(settings).instagram.href` rather than
 * rebuilding `https://instagram.com/${handle}` at every call site — which is
 * exactly how the phone number ended up spelled two different ways
 * (`+213555000000` in one file, `+213 555 00 00 00` in another) before this
 * existed.
 */
export function contactLinks(settings: SiteSettings) {
  const digits = settings.phone.replace(/[^\d+]/g, "");

  return {
    instagram: {
      href: `https://instagram.com/${settings.instagram}`,
      display: `@${settings.instagram}`,
    },
    phone: {
      href: `tel:${digits}`,
      whatsapp: `https://wa.me/${digits.replace(/^\+/, "")}`,
      // Grouped in twos for reading, not stored that way: +213 555 00 00 00.
      display: digits.replace(/^(\+\d{3})(\d{3})(\d{2})(\d{2})(\d{2})$/, "$1 $2 $3 $4 $5"),
    },
    email: {
      href: `mailto:${settings.email}`,
      display: settings.email,
    },
  };
}
