import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowUpRight, Instagram, Mail, PackageSearch, Phone } from "lucide-react";

import { Link } from "../../../../i18n/navigation";
import { Frame, Reveal, Section, SectionHead } from "@/components/site/Sheet";
import { ContactForm } from "@/components/site/ContactForm";
import { getSiteSettings } from "@/server/settings";
import { contactLinks } from "@/lib/contact";
import type { Locale } from "@/lib/i18n-content";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ locale: Locale }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "contactPage" });
  return {
    title: t("title"),
    description: t("lede"),
    openGraph: { title: t("title"), description: t("lede") },
  };
}

export default async function ContactPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "contactPage" });
  const settings = await getSiteSettings();
  const contact = contactLinks(settings);

  const channels = [
    { Icon: Instagram, label: t("channels.instagram"), href: contact.instagram.href, value: contact.instagram.display, external: true },
    { Icon: Phone, label: t("channels.phone"), href: contact.phone.href, value: contact.phone.display, external: false },
    { Icon: Mail, label: t("channels.email"), href: contact.email.href, value: contact.email.display, external: false },
  ];

  return (
    <Section grid="fine" className="bg-background">
      <Frame className="py-16 sm:py-24">
        <Reveal>
          <SectionHead title={t("title")} lede={t("lede")} />
        </Reveal>

        <div className="mt-12 grid gap-10 lg:grid-cols-[1.3fr_1fr] lg:gap-16">
          <Reveal delay={0.05}>
            {/* No sheet-ticks corner marks and a soft shadow rather than the
                admin's flat hairline card: a form someone fills in once wants
                to read as an object that lifts off the page, not a data row. */}
            <div className="rounded-2xl border border-rule bg-card p-6 shadow-sm shadow-foreground/[0.03] sm:p-8">
              <ContactForm />
            </div>
          </Reveal>

          <Reveal delay={0.1} className="space-y-3">
            <h2 className="text-sm font-bold tracking-[0.14em] uppercase">
              {t("channelsTitle")}
            </h2>

            {/* Three tappable cards, not a bordered list of rows: each
                channel is its own destination and reads better as a tile
                with its own icon colour than as a line in a table. */}
            <ul className="grid gap-2.5">
              {channels.map(({ Icon, label, href, value, external }) => (
                <li key={label}>
                  <a
                    href={href}
                    target={external ? "_blank" : undefined}
                    rel={external ? "noopener noreferrer" : undefined}
                    className="group flex items-center gap-3.5 rounded-xl border border-rule bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-sm"
                  >
                    <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                      <Icon className="h-4.5 w-4.5" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-xs text-muted-foreground">{label}</span>
                      <bdi dir="ltr" className="block truncate text-sm font-semibold">
                        {value}
                      </bdi>
                    </span>
                    <ArrowUpRight
                      className="h-4 w-4 shrink-0 text-muted-foreground/50 transition-colors group-hover:text-primary rtl:-scale-x-100"
                      aria-hidden="true"
                    />
                  </a>
                </li>
              ))}
            </ul>

            {/*
              A shortcut, not a second copy of /suivi's lookup form. That form
              is rate limited and carries its own state; a contact page is the
              wrong place to fork it into a second implementation that can
              drift from the first.
            */}
            <div className="mt-6 rounded-xl border border-dashed border-rule bg-paper/60 p-5">
              <div className="flex items-center gap-2">
                <PackageSearch className="h-4 w-4 text-primary" aria-hidden="true" />
                <h2 className="text-sm font-bold tracking-[0.14em] uppercase">
                  {t("trackTitle")}
                </h2>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{t("trackBody")}</p>
              <Link
                href="/track-order"
                className="mt-4 inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-background px-5 text-sm font-semibold transition-colors hover:border-primary/40 hover:text-primary"
              >
                {t("trackAction")}
              </Link>
            </div>
          </Reveal>
        </div>
      </Frame>
    </Section>
  );
}
