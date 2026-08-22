import {
  GraduationCap,
  LayoutGrid,
  LifeBuoy,
  MonitorCog,
  PackageSearch,
  PlayCircle,
  ShoppingBag,
  TrendingUp,
  UserRound,
  Wrench,
} from "lucide-react";

/**
 * Every way into the platform, named once.
 *
 * The sidebar and the quick-access grid render the same list, because they are
 * the same list: a student who learns the grid on their first visit should
 * find the identical names down the side on their second. Two hand-maintained
 * copies drift within a week.
 *
 * **Every live entry is a real page.** An earlier version pointed three of
 * these at `#progress`, `#schools` and `#profile` on the dashboard, which read
 * as navigation and behaved as scrolling — a sidebar row that jumps the page a
 * few hundred pixels and leaves the row it came from still looking current is
 * worse than no row at all. `/account/progress` and `/account/profile` are
 * pages now, and the schools live at `/library`, which is where they already
 * were.
 *
 * There is one learning destination, not two. "Library" and "Universities"
 * were separate rows pointing at the same `/library`, which makes a student
 * click both to find out they are the same thing.
 *
 * `needsAccess` is not the same as `soon`. A section that exists but is closed
 * to this student is shown and marked; a section that is not built is shown,
 * marked, and is never a link. Neither is hidden: the client sells a platform
 * with a software hub and a services desk on it, and a student who cannot see
 * them assumes they do not exist.
 */
export type PortalItem = {
  /** The message key under the `portal.sections` namespace. */
  key: string;
  href: string | null;
  Icon: typeof LayoutGrid;
  needsAccess?: boolean;
  /** Not built. Rendered as a card, never as a link. */
  soon?: boolean;
  /** Shown in the quick-access grid on the dashboard. */
  quick?: boolean;
};

export type PortalGroup = {
  /** The message key under `portal.groups`. */
  key: string;
  items: PortalItem[];
};

export const PORTAL_GROUPS: PortalGroup[] = [
  {
    key: "overview",
    items: [
      { key: "dashboard", href: "/account", Icon: LayoutGrid },
      {
        key: "progress",
        href: "/account/progress",
        Icon: TrendingUp,
        needsAccess: true,
        quick: true,
      },
    ],
  },
  {
    key: "learning",
    items: [
      {
        key: "universities",
        href: "/library",
        Icon: GraduationCap,
        needsAccess: true,
        quick: true,
      },
      { key: "courses", href: "/courses", Icon: PlayCircle, quick: true },
      { key: "software", href: null, Icon: MonitorCog, soon: true, quick: true },
    ],
  },
  {
    key: "store",
    items: [
      { key: "store", href: "/catalogue", Icon: ShoppingBag, quick: true },
      { key: "tracking", href: "/track-order", Icon: PackageSearch, quick: true },
      { key: "services", href: null, Icon: Wrench, soon: true, quick: true },
    ],
  },
  {
    key: "account",
    items: [
      { key: "profile", href: "/account/profile", Icon: UserRound },
      { key: "help", href: "/#faq", Icon: LifeBuoy },
    ],
  },
];

/** The grid on the dashboard: the sections worth one tap, in sidebar order. */
export const QUICK_ACCESS: PortalItem[] = PORTAL_GROUPS.flatMap((g) => g.items).filter(
  (i) => i.quick,
);
