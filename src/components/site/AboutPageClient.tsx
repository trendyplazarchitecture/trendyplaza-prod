"use client";

import Image from "next/image";
import {
  ArrowRight,
  Instagram,
  Mail,
  Phone,
  Users,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";

import { Link } from "../../../i18n/navigation";
import { Counter } from "@/components/site/Counter";
import { MeetTheTeam } from "@/components/site/MeetTheTeam";
import { useSiteSettings } from "./SiteSettingsContext";
import type { RosterMember } from "@/server/roster";
import { contactLinks } from "@/lib/contact";
import {
  EASE_OUT,
  fromEnd,
  fromStart,
  raise,
  settle,
  stagger,
  staggerTight,
  viewportOnce,
} from "@/lib/motion";

/* ─────────────────────────────────────────────
   Hero section
───────────────────────────────────────────── */
function HeroSection() {
  const t = useTranslations("aboutPage");
  const tActions = useTranslations("actions");
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="relative overflow-hidden border-b border-border bg-background">
      <div className="mx-auto w-full max-w-[1400px] px-4 py-20 sm:px-6 sm:py-28 lg:px-12">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">

          {/* ── Left col: text ── */}
          <motion.div
            variants={shouldReduceMotion ? {} : fromStart}
            initial="hidden"
            animate="visible"
            className="flex flex-col"
          >
            {/* Trust line — plain, no pill */}
            <motion.p
              variants={shouldReduceMotion ? {} : settle}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.04 }}
              className="mb-5 flex items-center gap-2 text-sm font-semibold text-muted-foreground"
            >
              <Users className="h-4 w-4 text-primary" aria-hidden="true" />
              {t("heroTrust")}
            </motion.p>

            {/* Two-tone heading — matches reference */}
            <motion.h1
              variants={shouldReduceMotion ? {} : settle}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.1 }}
              className="text-4xl leading-[1.07] tracking-[-0.03em] text-balance sm:text-5xl lg:text-[3.25rem]"
            >
              <span className="block font-semibold text-foreground/80">{t("heroTitleLead")}</span>
              <span className="block font-extrabold text-foreground">{t("heroTitleStrong")}</span>
            </motion.h1>

            <motion.p
              variants={shouldReduceMotion ? {} : settle}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.18 }}
              className="mt-5 max-w-md text-base leading-relaxed text-muted-foreground"
            >
              {t("heroLede")}
            </motion.p>

            <motion.div
              variants={shouldReduceMotion ? {} : settle}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.26 }}
              className="mt-8 flex flex-wrap gap-3"
            >
              <Link
                href="/catalogue"
                className="group inline-flex h-12 items-center gap-2 rounded-lg bg-primary px-7 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary-press"
              >
                {tActions("viewCatalogue")}
                <ArrowRight
                  className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5"
                  aria-hidden="true"
                />
              </Link>
              <Link
                href="/courses"
                className="inline-flex h-12 items-center rounded-lg border border-border px-7 text-sm font-semibold transition-colors hover:border-foreground/30 hover:bg-paper"
              >
                {tActions("viewCourses")}
              </Link>
            </motion.div>
          </motion.div>

          {/* ── Right col: image + inline stats below ── */}
          <motion.div
            variants={shouldReduceMotion ? {} : fromEnd}
            initial="hidden"
            animate="visible"
            className="flex flex-col gap-4"
          >
            <div className="overflow-hidden rounded-2xl">
              <Image
                src="/Images/AboutHero.webp"
                alt="Architecture students at Trendy Plaza"
                width={720}
                height={500}
                className="h-auto w-full object-cover"
                priority
              />
            </div>

            {/* Stats row below image — mirrors reference layout */}
            <motion.div
              variants={shouldReduceMotion ? {} : staggerTight}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-3 divide-x divide-border rounded-xl border border-border bg-background"
            >
              {[
                { value: 9000, suffix: "+", label: t("heroStatStudents") },
                { value: 69, suffix: "", label: t("heroStatWilayas") },
                { value: 5, suffix: "", label: t("heroStatYears") },
              ].map((s) => (
                <motion.div
                  key={s.label}
                  variants={shouldReduceMotion ? {} : raise}
                  className="px-4 py-4 text-center"
                >
                  <p className="figures text-2xl font-extrabold tracking-tight">
                    <Counter target={s.value} suffix={s.suffix} />
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{s.label}</p>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   Offer cards section  (3-col — matches reference)
───────────────────────────────────────────── */
function OfferSection() {
  const t = useTranslations("aboutPage");
  const shouldReduceMotion = useReducedMotion();
  const rm = !!shouldReduceMotion;

  return (
    <section className="border-b border-border bg-paper">
      <div className="mx-auto w-full max-w-[1400px] px-4 py-20 sm:px-6 sm:py-24 lg:px-12">

        {/* Centred two-tone heading — same pattern as reference */}
        <motion.div
          variants={shouldReduceMotion ? {} : settle}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          className="mx-auto max-w-2xl text-center"
        >
          <h2 className="text-3xl leading-[1.1] tracking-[-0.025em] text-balance sm:text-4xl lg:text-[2.75rem]">
            <span className="block font-semibold text-foreground/75">{t("offerSectionTitleLead")}</span>
            <span className="block font-extrabold text-foreground">{t("offerSectionTitleStrong")}</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
            {t("offerSectionLede")}
          </p>
        </motion.div>

        {/*
          Three cards, one height. The centre card used to carry its own text
          block on top of a full image below it, which made it taller than
          the two beside it by however much that text block needed — the
          grid's row then had to grow to fit it, leaving the side cards
          stretched with a gap of empty white space under their own, shorter
          content. Every card now has the same fixed height and the centre
          card's copy sits directly over its photo instead of stacked above
          it, the way the reference does it.
        */}
        <motion.div
          variants={shouldReduceMotion ? {} : stagger}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          className="mt-10 grid gap-4 md:grid-cols-3"
        >
          {/* Left card */}
          <SideCard
            image="/Images/Real university materials.webp"
            imageAlt="University study materials"
            title={t("offerCard1Title")}
            body={t("offerCard1Body")}
            rm={rm}
          />

          {/* Centre card — the photo is the card, not a panel bolted under one. */}
          <motion.div
            variants={shouldReduceMotion ? {} : raise}
            className="relative flex h-[340px] flex-col overflow-hidden rounded-2xl border border-border sm:h-[380px]"
          >
            <Image
              src="/Images/About21.webp"
              alt="Student holding course pack"
              fill
              // Grayscale, matching the reference: it reads as an offer photo
              // rather than a second brand image competing with the red.
              className="object-cover object-top grayscale"
            />

            {/* A gradient scrim, not a solid block. Strong enough at the top
                for white text to sit on, faded to nothing by mid-card so the
                photo underneath is still the point of the card. */}
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/35 to-transparent"
            />

            <div className="relative p-6 sm:p-7">
              <p className="text-[11px] font-bold tracking-widest text-primary uppercase">
                {t("offerCard2Badge")}
              </p>
              <h3 className="mt-2 text-xl leading-[1.15] font-extrabold tracking-tight text-white sm:text-2xl">
                {t("offerCard2Title")}
              </h3>
              <p className="mt-2.5 text-sm leading-relaxed text-white/80">
                {t("offerCard2Body")}
              </p>
            </div>
          </motion.div>

          {/* Right card */}
          <SideCard
            image="/Images/Courses by university.webp"
            imageAlt="Course library by university"
            title={t("offerCard3Title")}
            body={t("offerCard3Body")}
            rm={rm}
          />
        </motion.div>
      </div>
    </section>
  );
}

/** Left / right card — image at top, text below, same fixed height as the centre card. */
function SideCard({
  image,
  imageAlt,
  title,
  body,
  rm,
}: {
  image: string;
  imageAlt: string;
  title: string;
  body: string;
  rm: boolean;
}) {
  return (
    <motion.div
      variants={rm ? {} : raise}
      className="flex h-[340px] flex-col overflow-hidden rounded-2xl border border-border bg-background sm:h-[380px]"
    >
      {/* Image fills a fixed share of the card, not "however tall it is". */}
      <div className="relative h-40 w-full shrink-0 overflow-hidden sm:h-44">
        <Image src={image} alt={imageAlt} fill className="object-cover" />
      </div>

      {/* Text fills what is left, centred rather than pinned to the top with
          a gap opening up beneath it. */}
      <div className="flex flex-1 flex-col justify-center p-6">
        <h3 className="text-[1.1rem] font-bold tracking-tight">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────
   Chapters
───────────────────────────────────────────── */
function ChaptersSection() {
  const t = useTranslations("aboutPage");
  const shouldReduceMotion = useReducedMotion();

  const chapters = [
    { title: t("originTitle"), body: t("originBody") },
    { title: t("catalogueTitle"), body: t("catalogueBody") },
    { title: t("coursesTitle"), body: t("coursesBody") },
    { title: t("deliveryTitle"), body: t("deliveryBody") },
  ];

  return (
    <section className="border-b border-border bg-background">
      <div className="mx-auto w-full max-w-[1400px] px-4 py-20 sm:px-6 sm:py-24 lg:px-12">
        <div className="mx-auto max-w-3xl">
          {chapters.map((chapter, i) => (
            <motion.article
              key={chapter.title}
              variants={shouldReduceMotion ? {} : settle}
              initial="hidden"
              whileInView="visible"
              viewport={viewportOnce}
              transition={{ delay: i * 0.04 }}
              className="grid gap-x-8 gap-y-3 border-t border-border py-10 first:border-t-0 first:pt-0 sm:grid-cols-[3rem_1fr]"
            >
              <p aria-hidden="true" className="figures hidden pt-1 text-sm font-semibold text-primary sm:block">
                {String(i + 1).padStart(2, "0")}
              </p>
              <div>
                <h2 className="text-2xl font-bold tracking-tight sm:text-[1.75rem]">
                  {chapter.title}
                </h2>
                <p className="mt-3 max-w-[68ch] text-base leading-[1.75] text-muted-foreground">
                  {chapter.body}
                </p>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   Stats
───────────────────────────────────────────── */
function StatsSection() {
  const t = useTranslations("aboutPage");
  const shouldReduceMotion = useReducedMotion();

  const figures = [
    { value: 9000, suffix: "+", label: t("statStudents"), note: t("statStudentsNote") },
    { value: 69, suffix: "", label: t("statWilayas"), note: t("statWilayasNote") },
    { value: 1541, suffix: "", label: t("statCommunes"), note: t("statCommunesNote") },
    { value: 5, suffix: "", label: t("statYears"), note: t("statYearsNote") },
  ];

  return (
    <section className="relative overflow-hidden border-b border-border bg-paper">
      <div
        aria-hidden="true"
        className="sheet-grid sheet-grid-fade pointer-events-none absolute inset-0"
      />
      <div className="relative mx-auto w-full max-w-[1400px] px-4 py-20 sm:px-6 sm:py-24 lg:px-12">
        <motion.h2
          variants={shouldReduceMotion ? {} : settle}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          className="text-2xl font-bold tracking-tight sm:text-3xl"
        >
          {t("statsTitle")}
        </motion.h2>

        <motion.dl
          variants={shouldReduceMotion ? {} : staggerTight}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          className="mt-10 grid gap-px overflow-hidden rounded-xl border border-rule bg-rule sm:grid-cols-2 lg:grid-cols-4"
        >
          {figures.map((figure) => (
            <motion.div
              key={figure.label}
              variants={shouldReduceMotion ? {} : raise}
              className="bg-background px-6 py-8"
            >
              <dt className="sr-only">{figure.label}</dt>
              <dd>
                <span className="figures block text-4xl font-extrabold tracking-tight sm:text-5xl">
                  <Counter target={figure.value} suffix={figure.suffix} />
                </span>
                <span className="mt-2 block text-sm font-semibold">{figure.label}</span>
                <span className="mt-1 block text-sm text-muted-foreground">{figure.note}</span>
              </dd>
            </motion.div>
          ))}
        </motion.dl>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   Values
───────────────────────────────────────────── */
function ValuesSection() {
  const t = useTranslations("aboutPage");
  const shouldReduceMotion = useReducedMotion();

  const values = [
    { title: t("value1Title"), body: t("value1Body") },
    { title: t("value2Title"), body: t("value2Body") },
    { title: t("value3Title"), body: t("value3Body") },
    { title: t("value4Title"), body: t("value4Body") },
  ];

  return (
    <section className="border-b border-border bg-background">
      <div className="mx-auto w-full max-w-[1400px] px-4 py-20 sm:px-6 sm:py-24 lg:px-12">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.6fr] lg:gap-16">
          <motion.div
            variants={shouldReduceMotion ? {} : fromStart}
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
          >
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl lg:sticky lg:top-28">
              {t("valuesTitle")}
            </h2>
          </motion.div>

          <motion.dl
            variants={shouldReduceMotion ? {} : stagger}
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
          >
            {values.map((value) => (
              <motion.div
                key={value.title}
                variants={shouldReduceMotion ? {} : settle}
                className="grid gap-1.5 border-t border-border py-7 first:border-t-0 first:pt-0"
              >
                <dt className="text-base font-bold">{value.title}</dt>
                <dd className="max-w-[62ch] text-base leading-[1.7] text-muted-foreground">
                  {value.body}
                </dd>
              </motion.div>
            ))}
          </motion.dl>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   CTA + Contact
───────────────────────────────────────────── */
function CtaSection() {
  const t = useTranslations("aboutPage");
  const tActions = useTranslations("actions");
  const shouldReduceMotion = useReducedMotion();
  const contact = contactLinks(useSiteSettings());

  return (
    <section className="bg-background">
      <div className="mx-auto w-full max-w-[1400px] px-4 py-20 sm:px-6 sm:py-24 lg:px-12">
        <div className="grid gap-12 border-t border-foreground pt-12 lg:grid-cols-2 lg:gap-16">
          <motion.div
            variants={shouldReduceMotion ? {} : fromStart}
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
          >
            <h2 className="max-w-md text-3xl font-extrabold tracking-tight sm:text-4xl">
              {t("ctaTitle")}
            </h2>
            <p className="mt-4 max-w-md text-base text-muted-foreground">{t("ctaBody")}</p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/catalogue"
                className="group inline-flex h-12 items-center gap-2 rounded-lg bg-primary px-7 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary-press"
              >
                {tActions("viewCatalogue")}
                <ArrowRight
                  className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5"
                  aria-hidden="true"
                />
              </Link>
              <Link
                href="/courses"
                className="inline-flex h-12 items-center rounded-lg border border-border px-7 text-sm font-semibold transition-colors hover:border-foreground/30 hover:bg-paper"
              >
                {tActions("viewCourses")}
              </Link>
            </div>
          </motion.div>

          <motion.div
            variants={shouldReduceMotion ? {} : fromEnd}
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
          >
            <h2 className="text-sm font-bold tracking-[0.14em] uppercase">
              {t("contactTitle")}
            </h2>
            <p className="mt-3 max-w-sm text-sm text-muted-foreground">{t("contactBody")}</p>

            <ul className="mt-6 space-y-px overflow-hidden rounded-xl border border-rule bg-rule">
              {[
                { Icon: Instagram, href: contact.instagram.href, value: contact.instagram.display },
                { Icon: Phone, href: contact.phone.href, value: contact.phone.display },
                { Icon: Mail, href: contact.email.href, value: contact.email.display },
              ].map(({ Icon, href, value }) => (
                <li key={href} className="bg-background">
                  <a
                    href={href}
                    target={href.startsWith("http") ? "_blank" : undefined}
                    rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
                    className="group flex items-center gap-3 px-4 py-3.5 text-sm transition-colors hover:bg-paper"
                  >
                    <Icon className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                    <bdi dir="ltr" className="flex-1">
                      {value}
                    </bdi>
                    <ArrowRight
                      className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 rtl:-scale-x-100"
                      aria-hidden="true"
                    />
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   Root export
───────────────────────────────────────────── */
export function AboutPageClient({ roster }: { roster: RosterMember[] }) {
  return (
    <>
      <HeroSection />
      <OfferSection />
      <MeetTheTeam items={roster} />
      <ChaptersSection />
      <StatsSection />
      <ValuesSection />
      <CtaSection />
    </>
  );
}
