"use client";

import { ArrowRight, Package, GraduationCap, Truck, ShieldCheck, MapPin } from "lucide-react";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useRef } from "react";

import { Link } from "../../../i18n/navigation";
import { Button } from "@/components/ui/button";
import { fadeInUp } from "@/lib/motion";

export function Hero() {
  const t = useTranslations("hero");
  const tAction = useTranslations("actions");
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  // The image starts tilted back and flattens as the page moves, so the first
  // scroll gesture is answered by something rather than nothing.
  const rotateX = useTransform(scrollYProgress, [0, 0.4], [16, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.4], [0.94, 1]);
  const opacity = useTransform(scrollYProgress, [0, 0.4], [0.92, 1]);

  return (
    <section
      ref={containerRef}
      className="relative isolate overflow-hidden bg-background pt-16 pb-20 sm:pt-24 sm:pb-32"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
      >
        <div className="relative start-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-primary/15 to-transparent opacity-30 sm:start-[calc(50%-30rem)] sm:w-[72.1875rem]" />
      </div>

      <div className="mx-auto w-full max-w-[1536px] px-4 sm:px-6 lg:px-12">
        <div className="mx-auto max-w-4xl text-center">
          <motion.h1
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            className="text-4xl leading-[1.08] font-semibold tracking-tight text-foreground sm:text-6xl lg:text-7xl"
          >
            <span className="block font-medium text-foreground/90">{t("titleLead")}</span>
            <span className="mt-1 block font-extrabold text-primary">{t("titleStrong")}</span>
          </motion.h1>

          <motion.p
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.2 }}
            className="mx-auto mt-6 max-w-2xl text-base text-muted-foreground sm:text-lg sm:leading-relaxed"
          >
            {t("subtitle")}
          </motion.p>

          <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.35 }}
            className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <Button
              asChild
              size="lg"
              className="h-13 px-8 text-base font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30"
            >
              <Link href="/catalogue">
                <Package className="h-4 w-4" aria-hidden="true" />
                {tAction("viewCatalogue")}
                {/* Points the way the reader is going, so it flips with the script. */}
                <ArrowRight className="h-4 w-4 rtl:-scale-x-100" aria-hidden="true" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="h-13 bg-background px-8 text-base font-semibold"
            >
              <Link href="/courses">
                <GraduationCap className="h-4 w-4" aria-hidden="true" />
                {tAction("viewCourses")}
              </Link>
            </Button>
          </motion.div>

          <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.5 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-8 text-xs font-semibold tracking-wider text-muted-foreground uppercase"
          >
            <span className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" aria-hidden="true" />
              {t("statWilayas")}
            </span>
            <span className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-primary" aria-hidden="true" />
              {t("statPayment")}
            </span>
            <span className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" aria-hidden="true" />
              {t("statStudents")}
            </span>
          </motion.div>
        </div>

        <div className="mt-14 [perspective:1200px] sm:mt-18">
          <motion.div
            style={
              shouldReduceMotion
                ? {}
                : { rotateX, scale, opacity, transformStyle: "preserve-3d" }
            }
            className="relative mx-auto max-w-5xl rounded-2xl border-2 border-foreground/15 bg-background p-2 shadow-2xl shadow-foreground/20 ring-1 ring-foreground/10 sm:p-3"
          >
            <div className="relative overflow-hidden rounded-xl border border-border bg-paper shadow-inner">
              <img
                src="/Hero-image.webp"
                alt={t("imageAlt")}
                className="h-auto w-full rounded-xl object-cover"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
