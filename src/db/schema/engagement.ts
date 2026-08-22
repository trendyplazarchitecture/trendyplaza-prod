import {
  boolean,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  uuid,
} from "drizzle-orm/pg-core";
import { announcementAudience, contactStatus } from "./enums";
import { RESTRICT, archivedAt, createdAt, tsz } from "./_shared";
import { modules, resources } from "./content";
import { users } from "./identity";

/* --------------------------------------------------------------------------
 * Week two by the build order. The tables exist now so the migration that
 * adds them is not a second migration against live data.
 * ----------------------------------------------------------------------- */

export const bookmarks = pgTable(
  "bookmarks",
  {
    userId: text()
      .notNull()
      .references(() => users.id, RESTRICT),
    resourceId: uuid()
      .notNull()
      .references(() => resources.id, RESTRICT),
    createdAt: createdAt(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.resourceId] })],
);

/* --------------------------------------------------------------------------
 * Progress. Decision D1, reversed on the record: `00_INDEX.md` listed progress
 * tracking as out of scope, and the student dashboard the client asked for
 * needs it. See handoff/NEXT_SESSION_TASKS.md.
 * ----------------------------------------------------------------------- */

/**
 * The raw event: one row every time a resource is opened.
 *
 * Deliberately dumb. Everything the dashboard shows is derived, and a table
 * that only ever gets inserts cannot be wrong about what happened. Written by
 * `/api/resource/[id]` after the entitlement check passes and before the bytes
 * move, and never awaited: a failed write loses a view, it does not fail a
 * read.
 */
export const resourceViews = pgTable(
  "resource_views",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: text()
      .notNull()
      .references(() => users.id, RESTRICT),
    resourceId: uuid()
      .notNull()
      .references(() => resources.id, RESTRICT),
    viewedAt: tsz("viewed_at").notNull().defaultNow(),
  },
  (t) => [
    index("resource_views_user_idx").on(t.userId, t.viewedAt),
    index("resource_views_resource_idx").on(t.resourceId),
  ],
);

/**
 * The derived state, upserted in the same statement as the view.
 *
 * Could be computed from `resource_views` on every read. It is not, because
 * the dashboard asks "which modules has this student finished" on every page
 * load, and that is a count against every visible resource in every module the
 * student can reach. Cheap now, a table scan by March.
 *
 * `completedAt` means every visible, unarchived resource in the module has at
 * least one view. It is recomputed on write, so a module that gains a resource
 * correctly stops being complete.
 */
export const moduleProgress = pgTable(
  "module_progress",
  {
    userId: text()
      .notNull()
      .references(() => users.id, RESTRICT),
    moduleId: uuid()
      .notNull()
      .references(() => modules.id, RESTRICT),
    startedAt: tsz("started_at").notNull().defaultNow(),
    lastViewedAt: tsz("last_viewed_at").notNull().defaultNow(),
    completedAt: tsz("completed_at"),
    viewedCount: integer().notNull().default(0),
    /** The resource to reopen on "carry on". */
    lastResourceId: uuid().references(() => resources.id, RESTRICT),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.moduleId] }),
    index("module_progress_user_idx").on(t.userId, t.lastViewedAt),
  ],
);

export const studyPlans = pgTable("study_plans", {
  id: uuid().primaryKey().defaultRandom(),
  userId: text()
    .notNull()
    .references(() => users.id, RESTRICT),
  name: text().notNull(),
  createdAt: createdAt(),
});

export const studyPlanItems = pgTable(
  "study_plan_items",
  {
    planId: uuid()
      .notNull()
      .references(() => studyPlans.id, RESTRICT),
    resourceId: uuid()
      .notNull()
      .references(() => resources.id, RESTRICT),
    position: integer().notNull().default(0),
    doneAt: tsz("done_at"),
  },
  (t) => [primaryKey({ columns: [t.planId, t.resourceId] })],
);

export const announcements = pgTable("announcements", {
  id: uuid().primaryKey().defaultRandom(),
  titleEn: text().notNull(),
  titleFr: text(),
  titleAr: text(),
  bodyEn: text().notNull(),
  bodyFr: text(),
  bodyAr: text(),
  audience: announcementAudience().notNull().default("all"),
  startsAt: tsz("starts_at"),
  endsAt: tsz("ends_at"),
  isActive: boolean().notNull().default(true),
  createdAt: createdAt(),
});

/** Presence of a row is what makes the popup show once and not again. */
export const announcementViews = pgTable(
  "announcement_views",
  {
    announcementId: uuid()
      .notNull()
      .references(() => announcements.id, RESTRICT),
    userId: text()
      .notNull()
      .references(() => users.id, RESTRICT),
    seenAt: createdAt(),
  },
  (t) => [
    primaryKey({ columns: [t.announcementId, t.userId] }),
    index("announcement_views_user_idx").on(t.userId),
  ],
);

/**
 * A screenshot, not a quote. The client asked for the marketing strip to be
 * an admin-uploaded image (a WhatsApp thread, a review screenshot) rather
 * than authored text, so there is nothing bilingual to carry here — the
 * image itself is the content.
 */
export const testimonials = pgTable("testimonials", {
  id: uuid().primaryKey().defaultRandom(),
  imagePath: text().notNull(),
  isVisible: boolean().notNull().default(true),
  position: integer().notNull().default(0),
  archivedAt: archivedAt(),
  createdAt: createdAt(),
});

/**
 * "Meet the team", on the About page. A person's name is not translated;
 * their role is, the same as every other user-visible string in this
 * project — see `01_RULES.md`.
 */
export const rosterMembers = pgTable("roster_members", {
  id: uuid().primaryKey().defaultRandom(),
  name: text().notNull(),
  roleEn: text().notNull(),
  roleFr: text(),
  roleAr: text(),
  imagePath: text().notNull(),
  isVisible: boolean().notNull().default(true),
  position: integer().notNull().default(0),
  archivedAt: archivedAt(),
  createdAt: createdAt(),
});

export const contactMessages = pgTable(
  "contact_messages",
  {
    id: uuid().primaryKey().defaultRandom(),
    name: text().notNull(),
    email: text(),
    phone: text(),
    subject: text(),
    body: text().notNull(),
    status: contactStatus().notNull().default("new"),
    /** Trash, not deletion — the 30-day-purge system, `src/server/trash.ts`. */
    archivedAt: archivedAt(),
    createdAt: createdAt(),
  },
  (t) => [
    index("contact_messages_status_idx").on(t.status, t.createdAt),
    index("contact_messages_archived_idx").on(t.archivedAt),
  ],
);
