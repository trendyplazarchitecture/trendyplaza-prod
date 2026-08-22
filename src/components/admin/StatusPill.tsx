import { cn } from "@/lib/utils";

/**
 * Status colour, kept deliberately narrow.
 *
 * Five hues for the whole admin, all desaturated against the brand red, so a
 * red thing on screen still means "this needs you". A palette where every
 * state is loud is a palette where nothing is.
 *
 * Colour is never the only carrier: each pill states its status in words, and
 * a dot at 8px is not something a colour-blind operator should have to decode.
 */
const TONE = {
  pending: "border-amber-200 bg-amber-50 text-amber-900",
  active: "border-sky-200 bg-sky-50 text-sky-900",
  transit: "border-violet-200 bg-violet-50 text-violet-900",
  done: "border-emerald-200 bg-emerald-50 text-emerald-900",
  halted: "border-zinc-200 bg-zinc-100 text-zinc-700",
  alert: "border-primary/25 bg-primary/8 text-primary-press",
} as const;

export type Tone = keyof typeof TONE;

/** Order status to tone. The one place this mapping is written down. */
export const ORDER_TONE: Record<string, Tone> = {
  pending: "pending",
  confirmed: "active",
  packed: "active",
  shipped: "transit",
  delivered: "done",
  cancelled: "halted",
  returned: "alert",
};

export const REQUEST_TONE: Record<string, Tone> = {
  pending: "pending",
  approved: "done",
  rejected: "halted",
};

export const ENTITLEMENT_TONE: Record<string, Tone> = {
  active: "done",
  paused: "pending",
  expired: "halted",
  revoked: "alert",
};

export function StatusPill({
  tone,
  children,
  className,
}: {
  tone: Tone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "ui-dense inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        TONE[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
