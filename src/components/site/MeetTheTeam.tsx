"use client";

import { useTranslations } from "next-intl";
import { motion, useReducedMotion } from "framer-motion";

import type { RosterMember } from "@/server/roster";
import { fadeInUp, viewportOnce } from "@/lib/motion";
import { rosterImageUrl } from "@/lib/media";

/**
 * "Meet the team", directly under the offer section on the about page. Same
 * horizontal marquee this codebase already runs in `AnnouncementBar` — a CSS
 * animation, not framer-motion, so reduced motion is handled once by the
 * global rule in `styles.css` rather than needing its own guard.
 */
export function MeetTheTeam({ items }: { items: RosterMember[] }) {
  const t = useTranslations("aboutPage");
  const shouldReduceMotion = useReducedMotion();

  if (items.length === 0) return null;

  const doubled = [...items, ...items];

  return (
    <section className="border-b border-border bg-background">
      <div className="mx-auto w-full max-w-[1400px] px-4 py-20 sm:px-6 sm:py-24 lg:px-12">
        <motion.div
          variants={shouldReduceMotion ? {} : fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          className="mx-auto max-w-2xl text-center"
        >
          <h2 className="text-3xl leading-[1.1] tracking-[-0.025em] text-balance sm:text-4xl lg:text-[2.75rem] font-extrabold">
            {t("teamTitle")}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
            {t("teamSubtitle")}
          </p>
        </motion.div>
      </div>

      <div className="group relative overflow-hidden pb-4">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 start-0 z-10 w-24 bg-gradient-to-r from-background to-transparent rtl:bg-gradient-to-l"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 end-0 z-10 w-24 bg-gradient-to-l from-background to-transparent rtl:bg-gradient-to-r"
        />

        <div
          // A duration proportional to the card count, not the shared 44s
          // every other `.marquee-track` uses: six wide cards need longer to
          // read than four ticker words do, or the loop feels rushed.
          style={{ animationDuration: `${Math.max(items.length, 1) * 6}s` }}
          className="marquee-track group-hover:[animation-play-state:paused]"
          aria-hidden="true"
        >
          {doubled.map((member, i) => {
            const url = rosterImageUrl(member.imagePath);
            return (
              <div
                key={`${member.id}-${i}`}
                // Spacing lives inside each item's own box (`me-5`), not as a
                // flex `gap` on the track: a doubled `.marquee-track` loops on
                // an exact -50% translate, and `gap` is not part of either
                // half's measured width, so it throws that math off by half a
                // gap and shows up as a stutter at the seam. `AnnouncementBar`
                // avoids this the same way, with padding baked into each item.
                className="relative me-5 aspect-[3/4] w-64 shrink-0 overflow-hidden rounded-2xl bg-paper sm:w-72"
              >
                {url && (
                  <img
                    src={url}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover grayscale transition-all duration-500 hover:grayscale-0"
                  />
                )}
                {/* A gradient scrim, strong enough at the bottom for white text
                    to sit on, faded to nothing by mid-card. `pointer-events-none`
                    so it never steals the hover that reveals color underneath. */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent"
                />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 p-4">
                  <p className="truncate font-bold text-white">{member.name}</p>
                  <p className="truncate text-sm text-white/75">{member.role}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <ul className="sr-only">
        {items.map((member) => (
          <li key={member.id}>
            {member.name}
            {member.role ? `, ${member.role}` : ""}
          </li>
        ))}
      </ul>
    </section>
  );
}
