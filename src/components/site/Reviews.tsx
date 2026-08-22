"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";

import type { Testimonial } from "@/server/cms";
import { fadeInUp, viewportOnce } from "@/lib/motion";
import { testimonialImageUrl } from "@/lib/media";
import { cn } from "@/lib/utils";

function Column({
  items,
  speedFactor = 25,
  className,
}: {
  items: Testimonial[];
  speedFactor?: number;
  className?: string;
}) {
  const shouldReduceMotion = useReducedMotion();

  if (items.length === 0) return null;

  // Constant slow scrolling velocity: ~25-30 seconds per item
  const duration = Math.max(60, items.length * speedFactor);

  return (
    <div className={cn("overflow-hidden group", className)} aria-hidden="true">
      <motion.div
        animate={shouldReduceMotion ? undefined : { y: "-50%" }}
        transition={{ duration, repeat: Infinity, ease: "linear", repeatType: "loop" }}
        className="flex flex-col group-hover:[animation-play-state:paused]"
      >
        {[...items, ...items].map((item, i) => {
          const url = testimonialImageUrl(item.imagePath);
          return (
            <div
              key={`${item.id}-${i}`}
              className="mb-4 w-full max-w-[220px] shrink-0 overflow-hidden rounded-2xl border border-border shadow-lg shadow-primary/10 sm:max-w-[260px] transition-transform duration-300 hover:scale-[1.02]"
            >
              {url && (
                <img src={url} alt="" loading="lazy" className="block h-auto w-full" />
              )}
            </div>
          );
        })}
      </motion.div>
    </div>
  );
}

/**
 * Testimonials come from the database as admin-uploaded screenshots, not
 * authored quotes: the client asked for proof, not prose. The animation is
 * carried over from the reference component the client supplied (three
 * columns of screenshots drifting upward at different speeds); everything
 * else about that component — the text, the name, the role — was dropped,
 * because the image is the whole content here.
 *
 * The section removes itself when there is nothing to show, same as before.
 */
export function Reviews({ items }: { items: Testimonial[] }) {
  const t = useTranslations("reviews");

  if (items.length === 0) return null;

  // Round-robin rather than fixed thirds, so the columns stay balanced
  // whatever number of screenshots the admin has uploaded.
  const columns: Testimonial[][] = [[], [], []];
  items.forEach((item, i) => columns[i % 3].push(item));

  return (
    <section className="overflow-hidden border-b border-border bg-paper py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          className="flex flex-col items-center text-center"
        >
          <h2 className="text-3xl font-bold sm:text-4xl">{t("title")}</h2>
          <p className="mt-3 text-sm text-muted-foreground">{t("subtitle")}</p>
        </motion.div>
      </div>

      <div className="mt-12 flex max-h-[740px] justify-center gap-4 [mask-image:linear-gradient(to_bottom,transparent,black_15%,black_85%,transparent)] sm:gap-6">
        <Column items={columns[0]} speedFactor={24} />
        <Column items={columns[1]} speedFactor={28} className="hidden md:block" />
        <Column items={columns[2]} speedFactor={26} className="hidden lg:block" />
      </div>

      <ul className="sr-only">
        {items.map((item) => (
          <li key={item.id}>
            <img src={testimonialImageUrl(item.imagePath) ?? undefined} alt={t("imageAlt")} />
          </li>
        ))}
      </ul>
    </section>
  );
}
