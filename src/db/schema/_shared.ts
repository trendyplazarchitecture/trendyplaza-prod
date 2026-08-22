import { timestamp } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

/**
 * Drizzle's `timestamp()` defaults to *without* time zone, which is the wrong
 * default for every timestamp in this project. Use these, never the raw
 * helper. See _AI_CONTEXT/10_GOTCHAS.md.
 */
export const tsz = (name?: string) =>
  name ? timestamp(name, { withTimezone: true }) : timestamp({ withTimezone: true });

export const createdAt = () =>
  tsz("created_at").notNull().defaultNow();

export const updatedAt = () =>
  tsz("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date());

/**
 * Soft delete. Application code never issues DELETE against a table carrying
 * this column. A cascade on the university → year → semester → module →
 * resource chain removes content a student paid for, silently.
 */
export const archivedAt = () => tsz("archived_at");

/** Every foreign key reaching content, orders, codes or entitlements. */
export const RESTRICT = { onDelete: "restrict" } as const;

export const uuidPk = sql`gen_random_uuid()`;
