"use client";

import { BookOpen, Instagram, PackageCheck, Truck } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";

import { fadeInUp, slideInLeft, staggerContainer, viewportOnce } from "@/lib/motion";
import { contactLinks } from "@/lib/contact";
import { useSiteSettings } from "./SiteSettingsContext";

const POINTS = [
  { key: "pointTested", Icon: PackageCheck },
  { key: "pointDelivery", Icon: Truck },
  { key: "pointCourses", Icon: BookOpen },
] as const;

export function About() {
  const t = useTranslations("about");
  const shouldReduceMotion = useReducedMotion();
  const contact = contactLinks(useSiteSettings());

  return (
    <section id="about" className="overflow-hidden border-y border-border bg-paper">
      <div className="mx-auto w-full max-w-[1536px] px-4 py-24 sm:px-6 lg:px-12">
        <div className="grid items-start gap-16 md:grid-cols-[1fr_1.4fr] md:gap-12">
          <motion.div
            variants={shouldReduceMotion ? {} : slideInLeft}
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
          >
            <h2 className="text-3xl font-extrabold sm:text-4xl">{t("title")}</h2>
            <p className="mt-4 leading-relaxed text-muted-foreground">{t("lead")}</p>
            <p className="mt-3 leading-relaxed text-muted-foreground">{t("body")}</p>

            <a
              href={contact.instagram.href}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-semibold transition-colors hover:border-primary hover:text-primary"
            >
              <Instagram className="h-4 w-4 text-primary" aria-hidden="true" />
              {/* A Latin handle inside an Arabic sentence needs isolating, or
                  the @ and the count land on the wrong end of the line. */}
              <bdi dir="ltr">{contact.instagram.display}</bdi>
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
                <bdi dir="ltr">9k+</bdi>
              </span>
              <span className="sr-only">{t("instagram")}</span>
            </a>
          </motion.div>

          <motion.ul
            variants={shouldReduceMotion ? {} : staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            className="grid gap-6 sm:grid-cols-1"
          >
            {POINTS.map(({ key, Icon }) => (
              <motion.li
                key={key}
                variants={shouldReduceMotion ? {} : fadeInUp}
                className="flex gap-4 rounded-xl border border-border bg-background p-6"
              >
                <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-paper">
                  <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                </span>
                <div>
                  <h3 className="text-base font-bold">{t(`${key}.title`)}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {t(`${key}.text`)}
                  </p>
                </div>
              </motion.li>
            ))}
          </motion.ul>
        </div>
      </div>
    </section>
  );
}
