"use client";

import { ArrowRight, GraduationCap, ShoppingBag } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";

import { Link } from "../../../i18n/navigation";
import { scaleIn, viewportOnce } from "@/lib/motion";

export function CtaCard() {
  const t = useTranslations("cta");
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="border-b border-border bg-paper px-4 py-16 sm:px-6 lg:px-12">
      <motion.div
        variants={shouldReduceMotion ? {} : scaleIn}
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
        className="mx-auto max-w-[1536px] overflow-hidden rounded-2xl bg-foreground px-8 py-16 text-center text-background sm:px-12"
      >
        <h2 className="text-3xl font-extrabold text-background sm:text-5xl">{t("title")}</h2>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-background/70 sm:text-base">
          {t("subtitle")}
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/catalogue"
            className="inline-flex h-13 items-center gap-2 rounded-lg bg-primary px-8 text-base font-bold text-primary-foreground transition-all hover:bg-primary-press hover:shadow-lg hover:shadow-primary/30"
          >
            <ShoppingBag className="h-4 w-4" aria-hidden="true" />
            {t("primary")}
            <ArrowRight className="h-4 w-4 rtl:-scale-x-100" aria-hidden="true" />
          </Link>
          {/*
            Was "activate a card" pointing at a gift card rayon. Cards are not
            sold, they arrive inside a pack, so the second action is the course
            library rather than a shelf that does not exist.
          */}
          <Link
            href="/courses"
            className="inline-flex h-13 items-center gap-2 rounded-lg border border-background/30 bg-transparent px-8 text-base font-semibold text-background transition-all hover:bg-background hover:text-foreground"
          >
            <GraduationCap className="h-4 w-4" aria-hidden="true" />
            {t("secondary")}
          </Link>
        </div>
      </motion.div>
    </section>
  );
}
