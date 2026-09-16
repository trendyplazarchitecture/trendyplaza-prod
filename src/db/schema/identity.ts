import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  uuid,
} from "drizzle-orm/pg-core";
import { academicLevel, staffAccessRequestStatus, userState } from "./enums";
import { RESTRICT, archivedAt, createdAt, tsz, updatedAt } from "./_shared";

/* --------------------------------------------------------------------------
 * Better Auth owns the four tables below. Shape must match what the Drizzle
 * adapter expects (`usePlural: true`). Do not hand-edit columns; add project
 * fields to `userProfiles` instead.
 * ----------------------------------------------------------------------- */

export const users = pgTable("users", {
  id: text().primaryKey(),
  name: text().notNull(),
  email: text().notNull().unique(),
  emailVerified: boolean().notNull().default(false),
  image: text(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const sessions = pgTable(
  "sessions",
  {
    id: text().primaryKey(),
    expiresAt: tsz("expires_at").notNull(),
    token: text().notNull().unique(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    ipAddress: text(),
    userAgent: text(),
    userId: text()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
  },
  (t) => [index("sessions_user_idx").on(t.userId)],
);

export const accounts = pgTable("accounts", {
  id: text().primaryKey(),
  accountId: text().notNull(),
  providerId: text().notNull(),
  userId: text()
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  accessToken: text(),
  refreshToken: text(),
  idToken: text(),
  accessTokenExpiresAt: tsz("access_token_expires_at"),
  refreshTokenExpiresAt: tsz("refresh_token_expires_at"),
  scope: text(),
  password: text(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const verifications = pgTable("verifications", {
  id: text().primaryKey(),
  identifier: text().notNull(),
  value: text().notNull(),
  expiresAt: tsz("expires_at").notNull(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

/* --------------------------------------------------------------------------
 * Project-owned identity.
 * ----------------------------------------------------------------------- */

/**
 * Deleting an account is a state change plus a scrub of the personal fields
 * here, never a row removal. Orders and entitlements survive it.
 */
export const userProfiles = pgTable("user_profiles", {
  userId: text()
    .primaryKey()
    .references(() => users.id, RESTRICT),
  fullName: text(),
  phone: text(),
  universityId: uuid(),
  level: academicLevel(),
  locale: text().notNull().default("fr"),
  state: userState().notNull().default("on_hold"),
  archivedAt: archivedAt(),
  archivedBy: text().references(() => users.id, RESTRICT),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

/**
 * Granular, not fixed roles. The client asked to control what a moderator can
 * reach, and a role enum cannot express that. Named presets are a convenience
 * in the admin UI, not a column.
 */
export const userPermissions = pgTable(
  "user_permissions",
  {
    userId: text()
      .notNull()
      .references(() => users.id, RESTRICT),
    permission: text().notNull(),
    grantedAt: createdAt(),
    grantedBy: text().references(() => users.id, RESTRICT),
  },
  (t) => [primaryKey({ columns: [t.userId, t.permission] })],
);

/**
 * Staff members requesting higher or additional permissions when navigating
 * to a restricted section in the admin panel.
 */
export const staffAccessRequests = pgTable(
  "staff_access_requests",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: text()
      .notNull()
      .references(() => users.id, RESTRICT),
    permission: text().notNull(),
    status: staffAccessRequestStatus().notNull().default("pending"),
    note: text(),
    reviewedBy: text().references(() => users.id, RESTRICT),
    reviewedAt: tsz("reviewed_at"),
    createdAt: createdAt(),
  },
  (t) => [
    index("staff_access_requests_user_idx").on(t.userId),
    index("staff_access_requests_status_idx").on(t.status, t.createdAt),
  ],
);

/**
 * Internal notes, on a student or on an order.
 *
 * One table with a subject rather than two, because the admin wants the same
 * panel in both places and one component should serve both. `subject_type`
 * carries no foreign key for the same reason `package_contents.scope_id` does
 * not: it points at one of two tables. The pairing is validated in
 * `src/server/notes.ts` before anything is written.
 *
 * A log, not a field. `orders.internal_note` is a single overwritable column,
 * which loses the history and lets two agents overwrite each other: "doesn't
 * pick up" on Tuesday and "wrong number" on Thursday are two facts, not one.
 * That column stays until its contents are migrated here.
 */
export const noteSubject = pgEnum("note_subject", ["student", "order"]);

export const userNotes = pgTable(
  "user_notes",
  {
    id: uuid().primaryKey().defaultRandom(),
    subjectType: noteSubject().notNull(),
    /** A `users.id` (text) or an `orders.id` (uuid), per `subjectType`. */
    subjectId: text().notNull(),
    authorId: text()
      .notNull()
      .references(() => users.id, RESTRICT),
    body: text().notNull(),
    createdAt: createdAt(),
    archivedAt: archivedAt(),
  },
  (t) => [index("user_notes_subject_idx").on(t.subjectType, t.subjectId, t.createdAt)],
);

/**
 * A single-use link that lets someone set their own password.
 *
 * Decision D2: no screen in this application handles someone else's password.
 * An admin creates the account and sends a link; the person sets the password
 * themselves and the admin never sees it.
 *
 * The token is stored hashed. A readable token in this table would mean anyone
 * with database access, or a leaked backup, could take over any account that
 * has an unused invite outstanding.
 */
export const accountInvites = pgTable(
  "account_invites",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: text()
      .notNull()
      .references(() => users.id, RESTRICT),
    /** sha-256 of the token. The token itself is shown once and never stored. */
    tokenHash: text().notNull().unique(),
    createdBy: text()
      .notNull()
      .references(() => users.id, RESTRICT),
    expiresAt: tsz("expires_at").notNull(),
    usedAt: tsz("used_at"),
    createdAt: createdAt(),
  },
  (t) => [index("account_invites_user_idx").on(t.userId)],
);

export const activityLog = pgTable(
  "activity_log",
  {
    id: uuid().primaryKey().defaultRandom(),
    actorId: text().references(() => users.id, RESTRICT),
    action: text().notNull(),
    entity: text().notNull(),
    entityId: text(),
    before: jsonb(),
    after: jsonb(),
    ip: text(),
    createdAt: createdAt(),
  },
  (t) => [
    index("activity_log_entity_idx").on(t.entity, t.entityId),
    index("activity_log_created_idx").on(t.createdAt),
  ],
);

/**
 * Backs the two-session cap. A third sign-in evicts the oldest rather than
 * being refused, because a student who changed phone should not be locked out.
 */
export const sessionCounters = pgTable("session_counters", {
  userId: text()
    .primaryKey()
    .references(() => users.id, RESTRICT),
  activeCount: integer().notNull().default(0),
});

/**
 * Custom role presets and access profiles.
 * Allows creating, editing, and managing custom permission presets
 * with custom color themes and descriptions.
 */
export const rolePresets = pgTable("role_presets", {
  id: uuid().primaryKey().defaultRandom(),
  slug: text().notNull().unique(),
  name: text().notNull(),
  description: text(),
  color: text().notNull().default("blue"),
  permissions: text().array().notNull(),
  isSystem: boolean("is_system").notNull().default(false),
  position: integer().notNull().default(0),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

