import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Check, PhoneCall, Truck, Wallet } from "lucide-react";

import { Link, redirect } from "../../../../i18n/navigation";
import { Frame, Reveal, Section } from "@/components/site/Sheet";
import { CopyReference } from "@/components/site/CopyReference";
import { readLastOrder } from "@/server/cart";
import { formatDzd } from "@/lib/money";
import type { Locale } from "@/lib/i18n-content";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ locale: Locale }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "confirmation" });
  return { title: t("title"), robots: { index: false, follow: false } };
}

/**
 * The confirmation.
 *
 * The reference comes from a one-hour cookie set by the checkout action, not
 * from the URL. References are sequential within a month because a customer
 * reads one down a phone line, so a reference in a path is a path anyone can
 * walk. Landing here without having just ordered sends you to the tracking
 * page, which asks for the phone number as well.
 */
export default async function OrderReceivedPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const order = await readLastOrder();
  if (!order) {
    // `redirect` throws, so nothing below runs. The return is for the type
    // checker, which does not know that.
    redirect({ href: "/track-order", locale });
    return null;
  }

  const t = await getTranslations({ locale, namespace: "confirmation" });
  const priceLocale = locale === "en" ? "fr" : locale;

  const steps = [
    { Icon: PhoneCall, text: t("step1") },
    { Icon: Truck, text: t("step2") },
    { Icon: Wallet, text: t("step3") },
  ];

  return (
    <Section grid="fine" className="bg-background">
      <Frame width="text" className="py-16 sm:py-24">
        <Reveal>
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Check className="h-6 w-6" aria-hidden="true" />
          </span>

          <h1 className="mt-6 text-3xl font-extrabold tracking-tight sm:text-4xl">
            {t("title")}
          </h1>
          <p className="mt-3 text-muted-foreground">{t("subtitle")}</p>
        </Reveal>

        <Reveal delay={0.05}>
          <div className="sheet-ticks mt-10 rounded-xl border border-rule bg-card p-6">
            <p className="text-xs font-bold tracking-[0.14em] text-muted-foreground uppercase">
              {t("reference")}
            </p>

            {/* Big, monospaced and copyable: this is the one string the
                customer has to read back down a phone line. */}
            <CopyReference reference={order.reference} />

            <p className="mt-2 text-xs text-muted-foreground">{t("referenceHint")}</p>

            <dl className="mt-6 flex items-baseline justify-between border-t border-border pt-4">
              <dt className="text-sm text-muted-foreground">{t("totalOnDelivery")}</dt>
              <dd className="figures text-lg font-bold">
                {formatDzd(order.totalDzd, priceLocale)}
              </dd>
            </dl>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <h2 className="mt-12 text-sm font-bold tracking-[0.14em] uppercase">
            {t("nextSteps")}
          </h2>
          <ol className="mt-5 space-y-4">
            {steps.map(({ Icon, text }, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-rule bg-paper">
                  <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
                </span>
                <p className="text-sm leading-relaxed text-foreground">{text}</p>
              </li>
            ))}
          </ol>
        </Reveal>

        <Reveal delay={0.15}>
          <div className="mt-12 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/catalogue"
              className="inline-flex h-12 flex-1 items-center justify-center rounded-lg bg-primary px-6 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary-press"
            >
              {t("backToShop")}
            </Link>
            <Link
              href="/track-order"
              className="inline-flex h-12 flex-1 items-center justify-center rounded-lg border border-border px-6 text-sm font-semibold transition-colors hover:border-foreground/30 hover:bg-paper"
            >
              {t("trackOrder")}
            </Link>
          </div>
        </Reveal>
      </Frame>
    </Section>
  );
}
