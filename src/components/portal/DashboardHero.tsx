"use client";

import { motion, useReducedMotion } from "framer-motion";

import { EASE_OUT, fromStart, settle } from "@/lib/motion";

/**
 * The top of the dashboard. One authored moment, spent here: the greeting
 * settles in, the wave gives it a single friendly beat, and two blurred
 * shapes sit behind the text the same way `Hero.tsx`'s do on the storefront —
 * reused on purpose, so the portal reads as the same product rather than an
 * admin tool a student was handed by mistake.
 */
export function DashboardHero({
  greeting,
  lede,
}: {
  greeting: string;
  lede: string;
}) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <header className="relative isolate overflow-hidden rounded-2xl border border-rule bg-card px-5 py-6 sm:px-8 sm:py-8">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -end-16 -top-24 h-56 w-56 rounded-full bg-gradient-to-br from-primary/25 to-primary/0 blur-3xl sm:h-72 sm:w-72"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -start-10 bottom-0 h-32 w-32 rounded-full bg-gradient-to-tr from-primary/10 to-transparent blur-2xl"
      />

      <motion.h1
        variants={settle}
        initial="hidden"
        animate="visible"
        className="relative flex items-center gap-2 text-2xl font-extrabold tracking-tight sm:text-3xl"
      >
        {greeting}
        <motion.span
          aria-hidden="true"
          className="inline-block origin-[70%_70%]"
          animate={
            shouldReduceMotion
              ? undefined
              : { rotate: [0, 18, -8, 18, 0] }
          }
          transition={{ duration: 1.4, ease: EASE_OUT, delay: 0.4 }}
        >
          👋
        </motion.span>
      </motion.h1>

      <motion.p
        variants={fromStart}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.1 }}
        className="relative mt-1.5 text-sm text-muted-foreground sm:text-base"
      >
        {lede}
      </motion.p>
    </header>
  );
}
