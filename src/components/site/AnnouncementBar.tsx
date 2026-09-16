import { CreditCard, MapPin, Headset, Truck } from "lucide-react";
import { useTranslations } from "next-intl";

const ITEMS = [
  { key: "delivery", Icon: Truck },
  { key: "payment", Icon: CreditCard },
  { key: "wilayas", Icon: MapPin },
  { key: "support", Icon: Headset },
] as const;

/**
 * The ticker.
 *
 * Two changes from the usual scrolling strip. It pauses on hover, because a
 * line of text moving away from someone trying to read it is hostile. And it
 * stops entirely under reduced motion, where the global rule freezes the
 * animation, leaving the first four items legible rather than a frozen
 * half-scrolled mess: the track starts at translate zero, so the visible state
 * with no animation is the correct one.
 *
 * The strip is aria-hidden and duplicated for the seam; screen readers get the
 * four items once from the list below.
 */
export function AnnouncementBar() {
  const t = useTranslations("announcement");
  const doubled = [...ITEMS, ...ITEMS];

  return (
    <div className="group relative overflow-hidden border-b border-foreground/10 bg-foreground text-background">
      {/* The ends fade into the bar rather than clipping mid-word. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 start-0 z-10 w-16 bg-gradient-to-r from-foreground to-transparent rtl:bg-gradient-to-l"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 end-0 z-10 w-16 bg-gradient-to-l from-foreground to-transparent rtl:bg-gradient-to-r"
      />

      <div
        className="marquee-track py-2 group-hover:[animation-play-state:paused]"
        aria-hidden="true"
      >
        {doubled.map(({ key, Icon }, i) => (
          <span key={`${key}-${i}`} className="flex shrink-0 items-center">
            <span className="flex items-center gap-2 px-6 text-[11px] font-medium tracking-[0.08em] whitespace-nowrap uppercase">
              <Icon className="h-3.5 w-3.5 shrink-0 text-primary" />
              {t(key)}
            </span>
            {/* A hairline rule between items, not a bullet. */}
            <span className="h-3 w-px shrink-0 bg-background/20" />
          </span>
        ))}
      </div>

      <ul className="sr-only">
        {ITEMS.map(({ key }) => (
          <li key={key}>{t(key)}</li>
        ))}
      </ul>
    </div>
  );
}
