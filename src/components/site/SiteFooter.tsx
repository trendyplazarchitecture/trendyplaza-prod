import { Instagram, Mail, Phone } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "../../../i18n/navigation";
import { Logo } from "./Logo";
import { contactLinks } from "@/lib/contact";
import type { SiteSettings } from "@/server/settings";

const CATEGORIES = ["supplies", "books", "packs", "equipment"] as const;

export function SiteFooter({ settings }: { settings: SiteSettings }) {
  const t = useTranslations();
  const year = new Date().getFullYear();
  const contact = contactLinks(settings);

  return (
    <footer className="border-t border-border bg-paper">
      <div className="mx-auto w-full max-w-[1536px] px-4 py-16 sm:px-6 lg:px-12">
        <div className="grid gap-12 md:grid-cols-[1.6fr_repeat(3,1fr)]">
          <div>
            <Link href="/" aria-label={t("nav.home")}>
              <Logo markClassName="h-8" />
            </Link>

            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              {t("footer.blurb")}
            </p>

            {/* Phone numbers, emails and handles stay Latin and left to right,
                whatever the surrounding script. */}
            <ul className="mt-6 space-y-2.5 text-sm">
              <li>
                <a
                  href={contact.phone.href}
                  className="inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-primary-press"
                >
                  <Phone className="h-4 w-4 text-primary" aria-hidden="true" />
                  <bdi dir="ltr">{contact.phone.display}</bdi>
                </a>
              </li>
              <li>
                <a
                  href={contact.email.href}
                  className="inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-primary-press"
                >
                  <Mail className="h-4 w-4 text-primary" aria-hidden="true" />
                  <bdi dir="ltr">{contact.email.display}</bdi>
                </a>
              </li>
              <li>
                <a
                  href={contact.instagram.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-primary-press"
                >
                  <Instagram className="h-4 w-4 text-primary" aria-hidden="true" />
                  <bdi dir="ltr">{contact.instagram.display}</bdi>
                </a>
              </li>
            </ul>
          </div>

          <nav aria-labelledby="footer-shop">
            <h2 id="footer-shop" className="text-xs font-bold tracking-[0.14em] uppercase">
              {t("footer.shop")}
            </h2>
            <ul className="mt-4 space-y-2.5 text-sm">
              {CATEGORIES.map((key) => (
                <li key={key}>
                  <Link
                    href={`/catalogue?category=${key}`}
                    className="text-muted-foreground transition-colors hover:text-primary-press"
                  >
                    {t(`categories.${key}.label`)}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/catalogue"
                  className="text-muted-foreground transition-colors hover:text-primary-press"
                >
                  {t("actions.viewAll")}
                </Link>
              </li>
            </ul>
          </nav>

          <nav aria-labelledby="footer-courses">
            <h2 id="footer-courses" className="text-xs font-bold tracking-[0.14em] uppercase">
              {t("footer.courses")}
            </h2>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <Link
                  href="/courses"
                  className="text-muted-foreground transition-colors hover:text-primary-press"
                >
                  {t("nav.courses")}
                </Link>
              </li>
              <li>
                <Link
                  href="/#faq"
                  className="text-muted-foreground transition-colors hover:text-primary-press"
                >
                  {t("nav.faq")}
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="text-muted-foreground transition-colors hover:text-primary-press"
                >
                  {t("nav.about")}
                </Link>
              </li>
            </ul>
          </nav>

          <nav aria-labelledby="footer-help">
            <h2 id="footer-help" className="text-xs font-bold tracking-[0.14em] uppercase">
              {t("footer.help")}
            </h2>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <Link
                  href="/track-order"
                  className="text-muted-foreground transition-colors hover:text-primary-press"
                >
                  {t("footer.trackOrder")}
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-muted-foreground transition-colors hover:text-primary-press"
                >
                  {t("footer.contact")}
                </Link>
              </li>
              <li>
                <Link
                  href="/conditions"
                  className="text-muted-foreground transition-colors hover:text-primary-press"
                >
                  {t("footer.terms")}
                </Link>
              </li>
              <li>
                <Link
                  href="/confidentialite"
                  className="text-muted-foreground transition-colors hover:text-primary-press"
                >
                  {t("footer.privacy")}
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-3 border-t border-border pt-8 text-xs text-muted-foreground sm:flex-row">
          <p>
            <bdi dir="ltr">© {year}</bdi> Trendy Plaza Architecture. {t("footer.rights")}
          </p>
          <p>{t("footer.builtIn")}</p>
        </div>
      </div>
    </footer>
  );
}
