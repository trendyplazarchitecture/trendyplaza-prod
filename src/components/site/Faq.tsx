"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { fadeInUp, staggerContainer, viewportOnce } from "@/lib/motion";

const QUESTIONS = ["q1", "q2", "q3", "q4", "q5", "q6", "q7", "q8"] as const;

export function Faq() {
  const t = useTranslations("faq");
  const shouldReduceMotion = useReducedMotion();

  return (
    <section id="faq" className="border-b border-border bg-background">
      <div className="mx-auto w-full max-w-5xl px-4 py-24 sm:px-6 lg:px-12">
        <motion.div
          variants={shouldReduceMotion ? {} : fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          className="flex flex-col items-center text-center"
        >
          <h2 className="text-3xl font-extrabold sm:text-4xl">{t("title")}</h2>
          <p className="mt-3 text-sm text-muted-foreground">{t("subtitle")}</p>
        </motion.div>

        <motion.div
          variants={shouldReduceMotion ? {} : staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          className="mt-14"
        >
          <Accordion type="single" collapsible className="space-y-3">
            {QUESTIONS.map((key) => (
              <motion.div key={key} variants={shouldReduceMotion ? {} : fadeInUp}>
                <AccordionItem
                  value={key}
                  className="rounded-xl border border-border bg-background px-6 transition-colors data-[state=open]:border-primary/40 data-[state=open]:bg-primary/2"
                >
                  <AccordionTrigger className="py-5 text-start text-base font-semibold hover:text-primary hover:no-underline [&[data-state=open]]:text-primary">
                    {t(`${key}.q`)}
                  </AccordionTrigger>
                  <AccordionContent className="pb-5 text-sm leading-relaxed text-muted-foreground">
                    {t(`${key}.a`)}
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
}
