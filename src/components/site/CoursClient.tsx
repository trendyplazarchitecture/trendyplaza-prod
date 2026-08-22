"use client";

import Image from "next/image";
import {
  ArrowRight,
  BookOpen,
  KeyRound,
  Receipt,
  ShoppingBag,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";

import { Link } from "../../../i18n/navigation";
import { Frame, Reveal, Rule, Section, SectionHead } from "./Sheet";
import { Counter } from "./Counter";
import { EASE_OUT, viewportOnce } from "@/lib/motion";

/**
 * The public face of the LMS.
 *
 * The three figures in the strip are read from the database. The version this
 * replaced quoted invented numbers, sold a gift card that is never sold, and
 * printed demo credentials on a public page.
 *
 * The one call to action that matters is the pack, because the card that opens
 * the courses is inside a pack and is not sold on its own.
 */
export function CoursClient({
  stats,
  resourceTypes,
  destination,
}: {
  stats: { universities: number; modules: number; resources: number };
  resourceTypes: { key: string; label: string }[];
  /** Where the second button goes, decided server-side from the session. */
  destination: { href: "/library" | "/account" | "/signup"; label: "library" | "account" | "signUp" };
}) {
  const t = useTranslations("coursesPage");
  const tAuth = useTranslations("auth");

  const destinationLabel = {
    library: t("goToLibrary"),
    account: t("goToAccount"),
    signUp: tAuth("createAccount"),
  }[destination.label];

  const steps = [
    { Icon: ShoppingBag, title: t("step1Title"), text: t("step1Body") },
    { Icon: KeyRound, title: t("step2Title"), text: t("step2Body") },
    { Icon: BookOpen, title: t("step3Title"), text: t("step3Body") },
  ];

  return (
    <>
      <Section grid="major" className="bg-background">
        <Frame className="py-16 sm:py-24">
          <div className="grid gap-14 lg:grid-cols-[1.1fr_1fr] lg:items-stretch lg:gap-20">
            <Reveal className="flex flex-col justify-center">
              {/* Two-tone, the same pattern as the about page's hero: the
                  lead line is lighter and a step back from black, the second
                  line is the one carrying the weight. Both were extrabold
                  before, which made the lead line compete with the actual
                  headline instead of introducing it. */}
              <h1 className="max-w-2xl text-4xl tracking-tight text-balance sm:text-5xl lg:text-6xl lg:leading-[1.05]">
                <span className="block font-semibold text-foreground/75">{t("titleLead")}</span>
                <span className="block font-extrabold text-primary">{t("titleStrong")}</span>
              </h1>

              <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                {t("lede")}
              </p>

              <div className="mt-9 flex flex-wrap gap-3">
                <Link
                  href="/catalogue?category=packs"
                  className="inline-flex h-13 items-center gap-2 rounded-lg bg-primary px-8 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary-press"
                >
                  <ShoppingBag className="h-4 w-4" aria-hidden="true" />
                  {t("seePacks")}
                </Link>

                <Link
                  href={destination.href}
                  className="inline-flex h-13 items-center gap-2 rounded-lg border border-border px-8 text-sm font-semibold transition-colors hover:border-foreground/30 hover:bg-paper"
                >
                  {destinationLabel}
                  <ArrowRight className="h-4 w-4 rtl:-scale-x-100" aria-hidden="true" />
                </Link>
              </div>

              {/*
                Counted, not claimed. No rule above it: a hairline that
                divides nothing — the buttons above and the figures below are
                not two different sections of the page — read as a stray
                mark rather than a real boundary.
              */}
              <dl className="mt-12 grid grid-cols-3 gap-6">
                {[
                  { value: stats.universities, label: t("statUniversities") },
                  { value: stats.modules, label: t("statModules") },
                  { value: stats.resources, label: t("statResources") },
                ].map((stat) => (
                  <div key={stat.label}>
                    <dt className="sr-only">{stat.label}</dt>
                    <dd>
                      <span className="figures block text-2xl font-extrabold sm:text-3xl">
                        <Counter target={stat.value} />
                      </span>
                      <span className="mt-1 block text-xs text-muted-foreground">
                        {stat.label}
                      </span>
                    </dd>
                  </div>
                ))}
              </dl>
            </Reveal>

            {/*
              A photograph, not a rendering of whichever school's tree
              happened to have the most modules in it today. That preview
              read as sparse or arbitrary depending on what was entered in the
              admin, which is a worse first impression on a page whose whole
              job is to sell the shape of the LMS.

              The graphic has a transparent background — it is a floating
              device illustration, not a photo — so it gets no card, no
              border and no crop. A `rounded-xl border` around a transparent
              PNG draws a box around empty space on three sides of it, which
              is the "outline that makes no sense" a photo-shaped wrapper
              produces on an image that was never a rectangle to begin with.
              `object-contain` and a size past what the text column needs is
              what a hero graphic like this wants.
            */}
            <HeroImageReveal />
          </div>
        </Frame>
      </Section>

      <Section grid="fine" className="border-t border-rule bg-paper">
        <Frame className="py-16 sm:py-24">
          <Reveal>
            <SectionHead title={t("howTitle")} lede={t("howLede")} />
          </Reveal>

          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            {steps.map(({ Icon, title, text }, i) => (
              <Reveal key={title} delay={0.05 * i}>
                <div className="h-full rounded-xl border border-rule bg-card p-7">
                  <span className="figures block text-xs font-bold tracking-[0.2em] text-primary">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <Icon className="mt-5 h-6 w-6 text-primary" aria-hidden="true" />
                  <h3 className="mt-4 text-base font-bold">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.2}>
            <div className="mt-10 flex items-start gap-3 rounded-xl border border-rule bg-card p-6">
              <Receipt className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
              <div>
                <h3 className="text-sm font-bold">{t("noCardTitle")}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {t("noCardBody")}
                </p>
              </div>
            </div>
          </Reveal>
        </Frame>
      </Section>

      <Section className="border-t border-rule bg-background">
        <Frame className="py-16 sm:py-24">
          <Reveal>
            <SectionHead title={t("insideTitle")} lede={t("insideLede")} />
          </Reveal>

          <Reveal delay={0.05}>
            <ul className="mt-10 flex flex-wrap gap-3">
              {resourceTypes.map((type) => (
                <li
                  key={type.key}
                  className="rounded-lg border border-rule bg-paper px-4 py-2.5 text-sm font-medium"
                >
                  {type.label}
                </li>
              ))}
            </ul>
          </Reveal>

          <Rule className="mt-14" />

          <Reveal delay={0.1}>
            <div className="mt-10 flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="max-w-md text-lg font-semibold text-balance">{t("ctaTitle")}</p>
              <Link
                href="/catalogue?category=packs"
                className="inline-flex h-13 shrink-0 items-center gap-2 rounded-lg bg-primary px-8 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary-press"
              >
                {t("seePacks")}
                <ArrowRight className="h-4 w-4 rtl:-scale-x-100" aria-hidden="true" />
              </Link>
            </div>
          </Reveal>
        </Frame>
      </Section>
    </>
  );
}

/**
 * The hero graphic, revealed on its own: a touch bigger and a touch later
 * than the text beside it, scaling gently into place rather than only
 * fading — a transparent illustration benefits from a little more presence
 * than a settle, without turning into a production.
 */
function HeroImageReveal() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.94, y: 16 }}
      whileInView={{ opacity: 1, scale: 1, y: 0 }}
      viewport={viewportOnce}
      transition={{ duration: 0.6, delay: 0.1, ease: EASE_OUT }}
      className="relative -m-4 flex items-center justify-center sm:-m-6 lg:-m-2"
    >
      <Image
        src="/Images/CoursesHero.webp"
        alt=""
        width={900}
        height={900}
        sizes="(min-width: 1024px) 50vw, 100vw"
        className="h-auto w-full max-w-none object-contain lg:scale-110"
        priority
      />
    </motion.div>
  );
}
