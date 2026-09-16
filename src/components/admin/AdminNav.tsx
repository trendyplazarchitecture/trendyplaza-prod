"use client";

import {
  BookOpen,
  Boxes,
  ClipboardList,
  FileStack,
  GraduationCap,
  IdCard,
  Images,
  LayoutGrid,
  Mail,
  Megaphone,
  MonitorCog,
  Package,
  Percent,
  PlayCircle,
  Receipt,
  ScanLine,
  ScrollText,
  Settings,
  Users,
  UsersRound,
  Wrench,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { Link, usePathname } from "../../../i18n/navigation";
import { cn } from "@/lib/utils";
import type { Permission } from "@/lib/permissions";

/**
 * Store and LMS are separated, because they are two products, and the person
 * working the order queue is usually not the person loading course material.
 * Each entry names the permission that reveals it; a user without it never
 * sees the link, and the page behind it checks again anyway.
 *
 * `groupKey`/`labelKey` are `admin.nav` message keys, not literal text —
 * resolved with `t()` at render time, so one array serves all three locales.
 */
const GROUPS: {
  groupKey: string;
  items: {
    href: string;
    labelKey: string;
    Icon: typeof LayoutGrid;
    /** A single permission, or a list — shown if the admin holds any one of them. */
    permission: Permission | Permission[];
    badge?: "pendingOrders" | "pendingRequests" | "pendingMessages";
  }[];
}[] = [
  {
    groupKey: "groups.overview",
    items: [
      { href: "/admin", labelKey: "sheet", Icon: LayoutGrid, permission: "orders.view" },
    ],
  },
  {
    groupKey: "groups.store",
    items: [
      {
        href: "/admin/orders",
        labelKey: "orders",
        Icon: ClipboardList,
        permission: "orders.view",
        badge: "pendingOrders",
      },
      { href: "/admin/products", labelKey: "products", Icon: Boxes, permission: "products.manage" },
      {
        href: "/admin/promo-codes",
        labelKey: "promoCodes",
        Icon: Percent,
        permission: "promoCodes.manage",
      },
    ],
  },
  {
    groupKey: "groups.learning",
    items: [
      { href: "/admin/content", labelKey: "content", Icon: FileStack, permission: "content.manage" },
      { href: "/admin/packages", labelKey: "packages", Icon: Package, permission: "packages.manage" },
      { href: "/admin/codes", labelKey: "accessCodes", Icon: IdCard, permission: "codes.generate" },
      { href: "/admin/codes/lookup", labelKey: "checkCode", Icon: ScanLine, permission: "codes.generate" },
      {
        href: "/admin/requests",
        labelKey: "accessRequests",
        Icon: Receipt,
        permission: "students.view",
        badge: "pendingRequests",
      },
      { href: "/admin/students", labelKey: "students", Icon: GraduationCap, permission: "students.view" },
    ],
  },
  {
    groupKey: "groups.content",
    items: [
      { href: "/admin/posts", labelKey: "postsEvents", Icon: Megaphone, permission: "posts.manage" },
      { href: "/admin/software", labelKey: "softwareHub", Icon: MonitorCog, permission: "software.manage" },
      { href: "/admin/library", labelKey: "library", Icon: BookOpen, permission: "library.manage" },
      { href: "/admin/courses", labelKey: "coursesVideos", Icon: PlayCircle, permission: "courses.manage" },
    ],
  },
  {
    groupKey: "groups.operations",
    items: [
      {
        href: "/admin/messages",
        labelKey: "messages",
        Icon: Mail,
        permission: "messages.view",
        badge: "pendingMessages",
      },
      {
        href: "/admin/services",
        labelKey: "services",
        Icon: Wrench,
        permission: "services.manage",
      },
      {
        href: "/admin/testimonials",
        labelKey: "testimonials",
        Icon: Images,
        permission: "testimonials.manage",
      },
      {
        href: "/admin/roster",
        labelKey: "meetTheTeam",
        Icon: UsersRound,
        permission: "roster.manage",
      },
      { href: "/admin/team", labelKey: "team", Icon: Users, permission: "users.manage" },
      { href: "/admin/activity", labelKey: "activityLog", Icon: ScrollText, permission: "orders.view" },
      { href: "/admin/settings", labelKey: "settings", Icon: Settings, permission: "settings.manage" },
    ],
  },
];

export function AdminNav({
  permissions,
  counts,
  collapsed = false,
  onNavigate,
}: {
  permissions: string[];
  counts: { pendingOrders: number; pendingRequests: number; pendingMessages: number };
  collapsed?: boolean;
  /** Closes the mobile drawer this nav is rendered inside of. Unused on the desktop sidebar. */
  onNavigate?: () => void;
}) {
  const t = useTranslations("admin.nav");
  const pathname = usePathname();
  const held = new Set(permissions);

  return (
    <nav className="flex flex-col gap-7" aria-label={t("admin")}>
      {GROUPS.map((group) => {
        const items = group.items.filter((i) =>
          Array.isArray(i.permission)
            ? i.permission.some((p) => held.has(p))
            : held.has(i.permission),
        );
        if (items.length === 0) return null;

        return (
          <div key={group.groupKey}>
            {!collapsed && (
              <p className="px-3 text-[10px] font-semibold tracking-[0.18em] text-muted-foreground/70 uppercase">
                {t(group.groupKey)}
              </p>
            )}
            <ul className={cn("space-y-0.5", !collapsed && "mt-2")}>
              {items.map(({ href, labelKey, Icon, badge }) => {
                const label = t(labelKey);
                // `/admin` would otherwise match every child route.
                const active =
                  href === "/admin" || href === "/admin/codes"
                    ? pathname === href
                    : pathname.startsWith(href);
                const badgeCount = badge ? counts[badge] : 0;

                return (
                  <li key={href}>
                    <Link
                      href={href}
                      aria-current={active ? "page" : undefined}
                      title={collapsed ? label : undefined}
                      onClick={onNavigate}
                      className={cn(
                        "group relative flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors duration-150",
                        collapsed && "justify-center px-0",
                        active
                          ? "bg-paper font-semibold text-foreground"
                          : "text-muted-foreground hover:bg-paper/70 hover:text-foreground",
                      )}
                    >
                      {/* The active marker is a drawn rule on the start edge,
                          not a filled pill. */}
                      <span
                        aria-hidden="true"
                        className={cn(
                          "absolute inset-y-1.5 -start-px w-0.5 rounded-full bg-primary transition-transform duration-200 origin-center",
                          !collapsed && active ? "scale-y-100" : "scale-y-0",
                        )}
                      />
                      <span className="relative shrink-0">
                        <Icon
                          className={cn(
                            "h-4 w-4 transition-colors",
                            active ? "text-primary" : "text-muted-foreground/70",
                          )}
                          aria-hidden="true"
                        />
                        {collapsed && badgeCount > 0 && (
                          <span
                            aria-hidden="true"
                            className="absolute -end-1.5 -top-1.5 h-2 w-2 rounded-full bg-primary"
                          />
                        )}
                      </span>
                      {collapsed ? (
                        <span className="sr-only">{label}</span>
                      ) : (
                        <>
                          <span className="min-w-0 flex-1 truncate">{label}</span>
                          {badgeCount > 0 && (
                            <span className="figures rounded bg-primary/10 px-1.5 py-0.5 text-[11px] font-semibold text-primary-press">
                              {badgeCount}
                            </span>
                          )}
                        </>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}
