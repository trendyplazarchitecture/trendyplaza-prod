"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

import { cn } from "@/lib/utils";
import { EASE_OUT, settleInPlace, staggerTight } from "@/lib/motion";

/**
 * Admin chrome.
 *
 * The surface is a drawing sheet: a title block carrying state, a field
 * carrying work, and hairline rules marking real divisions. It shares the
 * storefront's tokens and type, but everything is one step denser, because
 * this screen is scanned by someone on the phone to a customer.
 *
 * No stat cards. A row of big numbers in rounded boxes is the dashboard
 * default and it reports at the person rather than to them.
 */

/** Page header. The h1 and the one action that belongs to the whole page. */
export function PageHead({
  title,
  meta,
  action,
}: {
  title: string;
  meta?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4 border-b border-rule pb-5">
      <div className="min-w-0">
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-[1.75rem]">{title}</h1>
        {meta && <p className="mt-1.5 text-sm text-muted-foreground">{meta}</p>}
      </div>
      {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
    </header>
  );
}

/**
 * The title block. On a drawn sheet this is the boxed panel carrying scale,
 * date, revision and who drew it; here it carries the figures that describe
 * the state of the operation.
 *
 * Rendered as a divided strip rather than separate cards, because these
 * numbers are read together and a gap between them invites comparing the boxes
 * instead of the values.
 */
export function TitleBlock({
  items,
}: {
  items: { label: string; value: string; hint?: string; tone?: "default" | "alert" }[];
}) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.dl
      variants={shouldReduceMotion ? undefined : staggerTight}
      initial="hidden"
      animate="visible"
      className="sheet-ticks grid grid-cols-2 divide-x divide-y divide-rule overflow-hidden rounded-lg border border-rule bg-card sm:grid-cols-3 lg:grid-cols-5 lg:divide-y-0"
    >
      {items.map((item) => (
        <motion.div
          key={item.label}
          variants={shouldReduceMotion ? undefined : settleInPlace}
          className="px-4 py-3.5 -ms-px -mt-px"
        >
          <dt className="text-[10px] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
            {item.label}
          </dt>
          <dd
            className={cn(
              "figures mt-1.5 text-xl font-bold",
              item.tone === "alert" ? "text-primary-press" : "text-foreground",
            )}
          >
            {item.value}
          </dd>
          {item.hint && (
            <p className="mt-0.5 text-xs text-muted-foreground">{item.hint}</p>
          )}
        </motion.div>
      ))}
    </motion.dl>
  );
}

/** A titled region of the field. The rule under the label is the division. */
export function Panel({
  title,
  action,
  children,
  className,
  padded = true,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <section className={cn("rounded-lg border border-border bg-card", className)}>
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
        {action}
      </div>
      <div className={padded ? "p-4" : undefined}>{children}</div>
    </section>
  );
}

/**
 * Reveal for admin regions. Shorter and flatter than the storefront's: an
 * operator opening this page twenty times a day does not want a performance.
 */
export function AdminReveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const shouldReduceMotion = useReducedMotion();
  if (shouldReduceMotion) return <div className={className}>{children}</div>;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: EASE_OUT, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Empty states name the next action. "No data" describes the screen; it does
 * not tell anyone what to do about it.
 */
export function Empty({
  title,
  hint,
  action,
}: {
  title: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      <p className="text-sm font-medium text-foreground">{title}</p>
      {hint && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{hint}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
