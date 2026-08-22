"use client";

import { ArrowRight, BookOpen, Layers, Package, Printer } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";

import { Link } from "../../../i18n/navigation";
import { staggerContainer, fadeInUp, viewportOnce } from "@/lib/motion";

/**
 * Four rayons, and no gift card among them. Cards are printed and placed
 * inside the packs; a student never buys one on its own.
 */
const CATEGORIES = [
  { key: "supplies", Icon: Package },
  { key: "books", Icon: BookOpen },
  { key: "packs", Icon: Printer },
  { key: "equipment", Icon: Layers },
] as const;

export function Categories() {
  const t = useTranslations("categories");
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="border-b border-border bg-background">
      <div className="mx-auto w-full max-w-[1536px] px-4 py-20 sm:px-6 lg:px-12">
        <motion.div
          variants={shouldReduceMotion ? {} : fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          className="flex flex-col items-center text-center"
        >
          <h2 className="text-3xl font-extrabold sm:text-4xl">{t("title")}</h2>
          <p className="mt-3 max-w-lg text-sm text-muted-foreground sm:text-base">
            {t("subtitle")}
          </p>
        </motion.div>

        <motion.ul
          variants={shouldReduceMotion ? {} : staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          className="mt-14 grid grid-cols-2 gap-6 md:grid-cols-4"
        >
          {CATEGORIES.map(({ key, Icon }) => (
            <motion.li key={key} variants={shouldReduceMotion ? {} : fadeInUp}>
              <Link
                href={`/catalogue?category=${key}`}
                className="group flex h-full flex-col items-center rounded-xl border border-border bg-background p-8 text-center transition-all duration-200 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5"
              >
                <span className="flex h-20 w-20 items-center justify-center rounded-2xl border border-border bg-paper transition-all duration-200 group-hover:scale-105 group-hover:border-primary group-hover:bg-primary/5">
                  <Icon
                    className="h-8 w-8 text-primary transition-transform duration-200 group-hover:scale-110"
                    aria-hidden="true"
                  />
                </span>
                <span className="mt-5 text-base font-bold">{t(`${key}.label`)}</span>
                <span className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                  {t(`${key}.blurb`)}
                </span>
                {/*
                  Hidden until hover on a pointer, always visible on touch,
                  where there is no hover to reveal it.
                */}
                <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-primary transition-opacity duration-200 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100">
                  {t("explore")}
                  <ArrowRight className="h-3 w-3 rtl:-scale-x-100" aria-hidden="true" />
                </span>
              </Link>
            </motion.li>
          ))}
        </motion.ul>
      </div>
    </section>
  );
}
