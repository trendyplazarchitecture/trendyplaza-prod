"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";

import type { CarouselLogo } from "@/server/software-carousel";

/**
 * The "trusted by" logo strip — homepage, about page, software hub.
 *
 * A perfect loop, not a scroll-and-snap-back: the track renders the list
 * several times back to back and animates exactly one copy's width, so the
 * moment it resets there is an identical copy already sitting in that spot —
 * nothing moves visibly.
 *
 * Two things have to hold for that to be true, and only one of them is
 * obvious:
 *
 * 1. Every copy must be exactly the same width, so the spacing lives on each
 *    item (`me-*`) and never as a `gap` on the track. With `gap`, the copies
 *    are separated by one extra seam gap, the track is `n * copy + 1 gap`
 *    wide, and the reset lands a fraction of a gap short — the strip
 *    twitches once per cycle.
 * 2. One copy must be at least as wide as the container. Two copies of a
 *    short list on a wide screen still loop exactly, but there is visible
 *    empty track trailing the last logo the whole way round. So the list is
 *    repeated as many times as it takes to cover the container, and the
 *    animation travels `100 / copies` percent — one copy's width, whatever
 *    that number works out to.
 *
 * The movement itself is a CSS keyframe animation (`.logo-marquee-track` in
 * `styles.css`), not a Framer Motion one. Framer ticks the transform on the
 * main thread every frame, and on a track this wide — thousands of pixels,
 * 30+ SVGs — that stutters against everything else the page is doing. The
 * CSS version is composited and stays smooth. It also picks up the RTL
 * direction mirror for free, the same way the existing `.marquee-track`
 * does.
 *
 * Logos render in their own colours at full opacity: these are the vendors'
 * own brand marks, and the client asked for them that way.
 *
 * `useReducedMotion` swaps the animation for a static wrapped row rather
 * than skipping the component, since the content (which tools this platform
 * is built around) is still worth showing to someone who has motion
 * reduction on.
 */
export function LogoCarousel({ logos, speedSeconds }: { logos: CarouselLogo[]; speedSeconds: number }) {
  const t = useTranslations("softwareCarousel");
  const shouldReduceMotion = useReducedMotion();

  // Measured, not guessed: how wide one copy is depends on each SVG's aspect
  // ratio and on the breakpoint's margin, neither of which is knowable on
  // the server. First paint renders two copies — already a correct loop,
  // just possibly short on a wide screen — and this widens it to cover.
  const viewportRef = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const [copies, setCopies] = useState(2);

  useEffect(() => {
    const viewport = viewportRef.current;
    const copy = copyRef.current;
    if (!viewport || !copy) return;

    const measure = () => {
      const copyWidth = copy.getBoundingClientRect().width;
      const viewportWidth = viewport.getBoundingClientRect().width;
      if (copyWidth <= 0 || viewportWidth <= 0) return;
      // +1 so a copy is always fully clear of the container before reuse.
      setCopies(Math.max(2, Math.ceil(viewportWidth / copyWidth) + 1));
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(viewport);
    observer.observe(copy);
    // SVGs that decode after mount change the copy width; re-measure then.
    const images = Array.from(copy.querySelectorAll("img"));
    for (const image of images) image.addEventListener("load", measure);
    return () => {
      observer.disconnect();
      for (const image of images) image.removeEventListener("load", measure);
    };
  }, [logos]);

  if (logos.length === 0) return null;

  return (
    <section className="overflow-hidden border-y border-rule bg-paper/50 py-10">
      <div className="mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-12">
        <p className="text-center text-[11px] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
          {t("label")}
        </p>
      </div>

      <div ref={viewportRef} className="relative mt-6">
        <div className="pointer-events-none absolute inset-y-0 start-0 z-10 w-16 bg-gradient-to-r from-paper to-transparent rtl:bg-gradient-to-l sm:w-28" />
        <div className="pointer-events-none absolute inset-y-0 end-0 z-10 w-16 bg-gradient-to-l from-paper to-transparent rtl:bg-gradient-to-r sm:w-28" />

        {shouldReduceMotion ? (
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-6 px-4">
            {logos.map((logo) => (
              <img
                key={logo.id}
                src={`/software-logos/${logo.logoPath}`}
                alt={logo.name}
                className="h-8 w-auto shrink-0 sm:h-9"
              />
            ))}
          </div>
        ) : (
          <div
            className="logo-marquee-track items-center"
            style={
              {
                "--logo-marquee-duration": `${speedSeconds}s`,
                "--logo-marquee-travel": `${100 / copies}%`,
              } as React.CSSProperties
            }
          >
            {Array.from({ length: copies }, (_, copyIndex) => (
              <div
                key={copyIndex}
                ref={copyIndex === 0 ? copyRef : undefined}
                className="flex items-center"
                // Only the first copy is real content; the rest exist to fill
                // the track, and a screen reader should not read the list
                // over and over.
                aria-hidden={copyIndex > 0}
              >
                {logos.map((logo) => (
                  <img
                    key={logo.id}
                    src={`/software-logos/${logo.logoPath}`}
                    alt={copyIndex === 0 ? logo.name : ""}
                    /* Spacing is margin-end per item, never a track `gap` —
                       see the doc comment above. */
                    className="me-14 h-8 w-auto shrink-0 sm:me-20 sm:h-9"
                  />
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
