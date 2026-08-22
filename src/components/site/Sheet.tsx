"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

import { cn } from "@/lib/utils";
import { draw, settle, viewportOnce } from "@/lib/motion";

/**
 * The drafting-sheet primitives every storefront section is built from.
 *
 * The point of putting them here is that the grid module, the rule weight and
 * the reveal are decided once. A section that draws its own hairline at its
 * own opacity is how a system stops being a system.
 */

export function Section({
  children,
  className,
  grid = "none",
  id,
}: {
  children: ReactNode;
  className?: string;
  /** `major` marks a region that carries weight. Use it two or three times a page, not everywhere. */
  grid?: "none" | "fine" | "major";
  id?: string;
}) {
  return (
    <section id={id} className={cn("relative isolate", className)}>
      {/*
        The grid and its fade live on their own layer, behind the content,
        never on the section element the content sits inside.
        `mask-image` masks everything it is painted on — a `<section>` is not
        only its background, it is every child inside it — so putting
        `sheet-grid-fade` directly on the section (as this did before) faded
        the actual heading, cards and buttons toward transparent near the
        section's edges, on any section tall enough for its bottom to fall
        outside the mask's opaque center. On `/courses`, at ~1570px tall, that
        put real content at roughly a quarter of its normal opacity by the
        bottom of the hero — a washed, greyish-white haze eating into the
        page, not a subtle background texture. This is the "white shadow or
        overlay on top of the website" that a decorative grid was never meant
        to cause.
      */}
      {grid !== "none" && (
        <div
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-0 -z-10 sheet-grid-fade",
            grid === "fine" && "sheet-grid",
            grid === "major" && "sheet-grid-major",
          )}
        />
      )}
      {children}
    </section>
  );
}

/** One container width, one gutter, everywhere. */
export function Frame({
  children,
  className,
  width = "wide",
}: {
  children: ReactNode;
  className?: string;
  width?: "wide" | "text";
}) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-4 sm:px-6 lg:px-12",
        width === "wide" ? "max-w-[1400px]" : "max-w-3xl",
        className,
      )}
    >
      {children}
    </div>
  );
}

/**
 * A section heading and the rule under it.
 *
 * There is deliberately no eyebrow prop. A label above a heading is a caption
 * apologising for the heading; the heading carries its own weight.
 */
export function SectionHead({
  title,
  lede,
  align = "start",
  as: Tag = "h2",
  className,
}: {
  title: ReactNode;
  lede?: ReactNode;
  align?: "start" | "center";
  as?: "h1" | "h2";
  className?: string;
}) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div
      className={cn(
        "flex flex-col",
        align === "center" ? "items-center text-center" : "items-start text-start",
        className,
      )}
    >
      <Tag
        className={cn(
          "max-w-4xl font-extrabold text-balance",
          Tag === "h1"
            ? "text-4xl sm:text-5xl lg:text-6xl"
            : "text-3xl sm:text-4xl lg:text-[2.75rem] lg:leading-[1.1]",
        )}
      >
        {title}
      </Tag>

      {/* The rule draws itself from the start edge, which is the right edge in
          Arabic. Origin is set here rather than in the variant so one variant
          serves both directions. */}
      <motion.span
        aria-hidden="true"
        variants={shouldReduceMotion ? undefined : draw}
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
        className="mt-5 block h-px w-24 bg-primary origin-[left] rtl:origin-[right]"
      />

      {lede && (
        <p
          className={cn(
            "mt-5 text-base leading-relaxed text-muted-foreground",
            align === "center" ? "max-w-2xl" : "max-w-xl",
          )}
        >
          {lede}
        </p>
      )}
    </div>
  );
}

/** Wraps a block in the house entrance. Content stays legible without JS. */
export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const shouldReduceMotion = useReducedMotion();
  if (shouldReduceMotion) return <div className={className}>{children}</div>;

  return (
    <motion.div
      variants={settle}
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      transition={{ delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * A hairline that marks a real division. Heavier than a card border on
 * purpose: a border encloses, a rule separates.
 */
export function Rule({ className }: { className?: string }) {
  return <hr className={cn("border-0 border-t border-rule", className)} />;
}
