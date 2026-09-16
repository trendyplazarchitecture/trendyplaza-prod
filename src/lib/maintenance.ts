import type { Permission } from "./permissions";

/**
 * Every public page an admin can put "under maintenance" from its own admin
 * screen. Add a page here and wire its two call sites — the admin `PageHead`
 * `action` slot (`<MaintenanceToggle section="..." />`) and the public
 * page's own `isSectionUnderMaintenance` check — nothing else in this file
 * needs touching.
 *
 * `permission` is deliberately the same one that already gates that page's
 * admin screen and its write actions, not a blanket "settings.manage": the
 * person who can edit a section is the person who can take it down, no
 * second permission grant required. `requirePermission` in the toggle action
 * enforces this — this array is the single place that decision is made.
 *
 * A section not listed here simply cannot be put in maintenance; there is no
 * catch-all "maintenance mode" switch for the whole site.
 */
export const MAINTENANCE_SECTIONS = [
  {
    key: "software-hub",
    permission: "software.manage" satisfies Permission,
    labelEn: "Software Hub",
    labelFr: "Hub de logiciels",
    labelAr: "مركز البرامج",
    // Every path this section's maintenance flag should take down.
    publicPaths: ["/software-hub"],
    adminPath: "/admin/software",
  },
  {
    key: "news-events",
    permission: "posts.manage" satisfies Permission,
    labelEn: "News & Events",
    labelFr: "Actualités et événements",
    labelAr: "الأخبار والفعاليات",
    publicPaths: ["/news", "/events"],
    adminPath: "/admin/posts",
  },
  {
    key: "digital-library",
    permission: "library.manage" satisfies Permission,
    labelEn: "Library",
    labelFr: "Bibliothèque",
    labelAr: "المكتبة",
    publicPaths: ["/digital-library"],
    adminPath: "/admin/library",
  },
] as const;

export type MaintenanceSectionKey = (typeof MAINTENANCE_SECTIONS)[number]["key"];

export function maintenanceSection(key: MaintenanceSectionKey) {
  return MAINTENANCE_SECTIONS.find((s) => s.key === key)!;
}
