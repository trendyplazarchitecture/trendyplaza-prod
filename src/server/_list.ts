import "server-only";

import { asc, desc, type Column, type SQL } from "drizzle-orm";
import { z } from "zod";

/**
 * One shape for every admin list.
 *
 * Before this, `listStudents` capped at 100 rows and dropped the rest in
 * silence, `listActivity` at 200, and `listAllProducts` and `getLowStock` were
 * uncapped and growing. None of them could be sorted. Six bespoke solutions
 * would have been six places to get the SQL wrong, so there is one.
 *
 * The sort key is looked up in an allow-list per list and never reaches SQL as
 * a string. A sort parameter is user input arriving from the query string;
 * interpolating it into an ORDER BY is the classic way this feature becomes an
 * injection.
 */

export const listQuery = z.object({
  sort: z.string().trim().max(40).optional(),
  direction: z.enum(["asc", "desc"]).optional(),
  page: z.coerce.number().int().min(1).max(10_000).optional(),
  perPage: z.coerce.number().int().min(5).max(200).optional(),
  search: z.string().trim().max(120).optional(),
});

/**
 * What a page actually holds before parsing.
 *
 * Declared rather than inferred: `page` and `perPage` arrive from a query
 * string as strings and are coerced by Zod, but `z.input` on `z.coerce.number`
 * still reports `number`. Typing it that way would make every caller parseInt
 * first, which is the work this file exists to remove.
 */
export type ListQuery = {
  sort?: string;
  direction?: "asc" | "desc";
  page?: string | number;
  perPage?: string | number;
  search?: string;
};

export const DEFAULT_PER_PAGE = 25;

export type Sortable = Record<string, Column | SQL>;

export type Paged<T> = {
  rows: T[];
  total: number;
  page: number;
  perPage: number;
  /** Echoed back so the table can draw the active header without re-parsing. */
  sort: string;
  direction: "asc" | "desc";
};

/**
 * Resolves a query string into the pieces a list function needs.
 *
 * `sort` falls back to the list's default whenever it is not a key of the
 * allow-list, so a hand-edited URL degrades to the normal view rather than
 * erroring at someone.
 */
export function resolveList(
  raw: ListQuery,
  sortable: Sortable,
  fallback: { sort: string; direction?: "asc" | "desc" },
) {
  const parsed = listQuery.parse(raw);

  const sort = parsed.sort && parsed.sort in sortable ? parsed.sort : fallback.sort;
  const direction = parsed.direction ?? fallback.direction ?? "desc";
  const page = parsed.page ?? 1;
  const perPage = parsed.perPage ?? DEFAULT_PER_PAGE;

  const column = sortable[sort];
  const orderBy = direction === "asc" ? asc(column) : desc(column);

  return {
    sort,
    direction,
    page,
    perPage,
    offset: (page - 1) * perPage,
    limit: perPage,
    orderBy,
    search: parsed.search,
  };
}

/** Wraps rows and a count into the shape every list returns. */
export function paged<T>(
  rows: T[],
  total: number,
  resolved: { page: number; perPage: number; sort: string; direction: "asc" | "desc" },
): Paged<T> {
  return {
    rows,
    total,
    page: resolved.page,
    perPage: resolved.perPage,
    sort: resolved.sort,
    direction: resolved.direction,
  };
}
