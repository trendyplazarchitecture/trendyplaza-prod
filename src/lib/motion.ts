import type { Transition, Variants } from "framer-motion";

/**
 * Motion for TP Architecture.
 *
 * The world is a drawn sheet, so the motion is a line being laid down:
 * decisive at the start, decelerating hard, settling with no bounce. Nothing
 * springs, nothing overshoots, nothing draws attention to itself twice.
 *
 * Two rules the call sites must keep:
 *
 * 1. **Content is visible by default.** Every variant animates from a state
 *    that is already legible if the animation never runs. A reveal that starts
 *    at `opacity: 0` and depends on JavaScript to reach 1 is a blank page on a
 *    slow connection, which is the connection this audience is on.
 * 2. **One authored moment per page.** `settle` is the house entrance and is
 *    used sparingly. `draw` and `countUp` are the accents, spent once each on
 *    the section that earns them.
 */

/** Exponential ease-out. The deceleration of a pen coming to rest. */
export const EASE_OUT = [0.16, 1, 0.3, 1] as const;

/** Symmetric, for things that both enter and leave (dialogs, popovers). */
export const EASE_IN_OUT = [0.65, 0, 0.35, 1] as const;

const base: Transition = { duration: 0.55, ease: EASE_OUT };

/**
 * The house entrance. Rises, sharpens, and settles: the blur clearing is what
 * makes it read as coming into focus rather than sliding in from off-screen.
 */
export const settle: Variants = {
  hidden: { opacity: 0, y: 16, filter: "blur(4px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: base },
};

/** Same moment, no vertical travel. For items already in their final position. */
export const settleInPlace: Variants = {
  hidden: { opacity: 0, filter: "blur(3px)" },
  visible: { opacity: 1, filter: "blur(0px)", transition: base },
};

/**
 * A rule drawing itself from the leading edge. Used on the hairline under a
 * section heading, once per page. `transformOrigin` is set by the call site so
 * it draws from the start edge in both directions.
 */
export const draw: Variants = {
  hidden: { scaleX: 0 },
  visible: { scaleX: 1, transition: { duration: 0.8, ease: EASE_OUT } },
};

/** Panels and cards. Scale is small on purpose; a big pop reads as a toy. */
export const raise: Variants = {
  hidden: { opacity: 0, y: 12, scale: 0.985 },
  visible: { opacity: 1, y: 0, scale: 1, transition: base },
};

export const fromStart: Variants = {
  hidden: { opacity: 0, x: -28 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.65, ease: EASE_OUT } },
};

export const fromEnd: Variants = {
  hidden: { opacity: 0, x: 28 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.65, ease: EASE_OUT } },
};

/**
 * Stagger is a rhythm, not a queue. Above about eight children the last one
 * arrives late enough to feel broken, so grids use `staggerTight`.
 */
export const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};

export const staggerTight: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.035, delayChildren: 0.03 } },
};

/**
 * Trigger once, and start before the element is fully on screen so the motion
 * finishes as the reader arrives rather than beginning when they are already
 * looking at it.
 */
export const viewportOnce = { once: true, margin: "-15% 0px -10% 0px" } as const;

/**
 * Button press. A 1px drop and nothing else. Buttons that scale up on hover
 * push their neighbours around; buttons that sink on press feel like hardware.
 */
export const press = {
  whileHover: { y: -1 },
  whileTap: { y: 1 },
  transition: { duration: 0.15, ease: EASE_OUT },
} as const;

/** Deprecated aliases kept so older call sites keep compiling. */
export const fadeInUp = settle;
export const fadeIn = settleInPlace;
export const slideInLeft = fromStart;
export const slideInRight = fromEnd;
export const scaleIn = raise;
export const staggerContainer = stagger;
export const staggerFast = staggerTight;
