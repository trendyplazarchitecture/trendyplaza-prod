"use client";

import { useEffect, useRef, useState } from "react";
import { useInView, useReducedMotion } from "framer-motion";
import { useLocale } from "next-intl";

/**
 * A number that counts up once, when it arrives.
 *
 * It starts at the target rather than at zero, so a reader with JavaScript
 * still loading sees 9,000 and not 0. The count only runs if the element is
 * still off screen when the effect fires; a figure already in view when the
 * page loads is simply correct, because animating a number the reader is
 * already looking at just makes them wait for it.
 */
export function Counter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10%" });
  const shouldReduceMotion = useReducedMotion();
  const [value, setValue] = useState(target);
  const started = useRef(false);

  useEffect(() => {
    if (shouldReduceMotion || started.current) return;

    // Already on screen at mount: leave it at the final value.
    const rect = ref.current?.getBoundingClientRect();
    if (rect && rect.top < window.innerHeight) {
      started.current = true;
      return;
    }
    setValue(0);
  }, [shouldReduceMotion]);

  useEffect(() => {
    if (!inView || shouldReduceMotion || started.current) return;
    started.current = true;

    const duration = 1100;
    const start = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      // Same exponential ease-out the rest of the motion uses, so the number
      // decelerates the way everything else on the page does.
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(target * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView, target, shouldReduceMotion]);

  const locale = useLocale();

  return (
    <span ref={ref}>
      {/* Latin digits in every locale, the way figures are written on an
          Algerian invoice, isolated so the suffix stays on the right end. */}
      <bdi dir="ltr">
        {value.toLocaleString(locale === "ar" ? "ar-DZ-u-nu-latn" : "en-GB")}
        {suffix}
      </bdi>
    </span>
  );
}
