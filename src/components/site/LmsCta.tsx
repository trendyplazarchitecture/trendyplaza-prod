"use client";

import { ArrowRight, BookOpen, Clock, GraduationCap, IdCard } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

import { Link } from "../../../i18n/navigation";
import { Button } from "@/components/ui/button";
import { staggerContainer, fadeInUp, viewportOnce } from "@/lib/motion";

const STATS = [
  { key: "statStudents", value: 9000, suffix: "+" },
  { key: "statUniversities", value: 4, suffix: "" },
  { key: "statSemesters", value: 2, suffix: "" },
] as const;

const FEATURES = [
  { key: "featureSorted", Icon: GraduationCap },
  { key: "featureCorrected", Icon: BookOpen },
  { key: "featureCard", Icon: IdCard },
  { key: "featureAnytime", Icon: Clock },
] as const;

function AnimatedCounter({ target, suffix }: { target: number; suffix: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);
  const shouldReduceMotion = useReducedMotion();
  const locale = useLocale();

  useEffect(() => {
    // Counting up is decoration. Reduced motion gets the number, immediately.
    if (shouldReduceMotion) {
      setCount(target);
      return;
    }

    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || started.current) return;
        started.current = true;

        const duration = 1500;
        const steps = 60;
        const increment = target / steps;
        let current = 0;
        const timer = setInterval(() => {
          current += increment;
          if (current >= target) {
            setCount(target);
            clearInterval(timer);
          } else {
            setCount(Math.floor(current));
          }
        }, duration / steps);
      },
      { threshold: 0.3 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [target, shouldReduceMotion]);

  return (
    <span ref={ref} className="tabular-nums">
      {/* Latin digits in every locale, the way figures are written on an
          Algerian invoice, and isolated so the suffix stays on the right end. */}
      <bdi dir="ltr">
        {count.toLocaleString(locale === "ar" ? "ar-DZ-u-nu-latn" : "fr-DZ")}
        {suffix}
      </bdi>
    </span>
  );
}

export function LmsCta() {
  const t = useTranslations("lms");
  const tAction = useTranslations("actions");
  const shouldReduceMotion = useReducedMotion();

  return (
    <section id="courses" className="overflow-hidden border-y border-border bg-foreground text-background">
      <div className="mx-auto w-full max-w-[1536px] px-4 py-24 sm:px-6 lg:px-12">
        <motion.div
          variants={shouldReduceMotion ? {} : fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          className="flex flex-col items-center text-center"
        >
          <h2 className="max-w-3xl text-3xl font-extrabold sm:text-5xl">{t("title")}</h2>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-background/70 sm:text-base">
            {t("subtitle")}
          </p>
        </motion.div>

        <motion.div
          variants={shouldReduceMotion ? {} : staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          className="mx-auto mt-16 grid max-w-4xl grid-cols-3 gap-8 border-y border-background/10 py-10"
        >
          {STATS.map(({ key, value, suffix }) => (
            <motion.div
              key={key}
              variants={shouldReduceMotion ? {} : fadeInUp}
              className="flex flex-col items-center text-center"
            >
              <span className="text-3xl font-extrabold text-background sm:text-5xl">
                <AnimatedCounter target={value} suffix={suffix} />
              </span>
              <span className="mt-2 text-xs font-semibold tracking-wide text-background/60 uppercase">
                {t(key)}
              </span>
            </motion.div>
          ))}
        </motion.div>

        <motion.ul
          variants={shouldReduceMotion ? {} : staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4"
        >
          {FEATURES.map(({ key, Icon }) => (
            <motion.li
              key={key}
              variants={shouldReduceMotion ? {} : fadeInUp}
              className="flex flex-col items-center rounded-xl border border-background/10 bg-background/5 p-6 text-center sm:items-start sm:text-start"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-background/10 bg-background/10">
                <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
              </span>
              <h3 className="mt-4 text-base font-bold text-background">{t(`${key}.title`)}</h3>
              <p className="mt-2 text-sm leading-relaxed text-background/70">{t(`${key}.text`)}</p>
            </motion.li>
          ))}
        </motion.ul>

        <motion.div
          variants={shouldReduceMotion ? {} : fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          className="mt-16 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          {/*
            Pointed at a gift card rayon before. Cards are not sold on their
            own, so the primary action is the pack that contains one.
          */}
          <Button asChild size="lg" className="h-12 px-8 font-bold">
            <Link href="/catalogue?category=packs">
              {tAction("viewCatalogue")}
              <ArrowRight className="h-4 w-4 rtl:-scale-x-100" aria-hidden="true" />
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="h-12 border-background/30 bg-transparent px-8 font-semibold text-background hover:bg-background hover:text-foreground"
          >
            <Link href="/courses">{tAction("viewCourses")}</Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
