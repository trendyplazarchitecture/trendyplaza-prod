"use client";

import { useCallback, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, ChevronsUpDown } from "lucide-react";

import { usePathname, useRouter } from "../../../i18n/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type Column<T> = {
  /** Matches a key of the list's sortable allow-list. Omit to make it fixed. */
  key?: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  align?: "start" | "end";
  /** Widths and alignment are the only per-column styling this table takes. */
  className?: string;
};

/**
 * The admin's one table.
 *
 * Sort and page live in the URL, not in component state, for three reasons a
 * moderator will actually notice: the back button does what they expect, a
 * refresh keeps their place, and they can send a colleague a link to the exact
 * view they are looking at rather than a description of it.
 *
 * The sort control is a real `<button>` inside the `<th>` and carries
 * `aria-sort`, so the header is announced as sortable and its current state is
 * readable rather than implied by an arrow.
 */
export function DataTable<T>({
  rows,
  columns,
  getKey,
  total,
  page,
  perPage,
  sort,
  direction,
  empty,
  minWidth = "min-w-[880px]",
}: {
  rows: T[];
  columns: Column<T>[];
  getKey: (row: T) => string;
  total: number;
  page: number;
  perPage: number;
  sort: string;
  direction: "asc" | "desc";
  empty: ReactNode;
  minWidth?: string;
}) {
  const t = useTranslations("admin.common");
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const push = useCallback(
    (patch: Record<string, string | null>) => {
      const next = new URLSearchParams(params.toString());
      for (const [key, value] of Object.entries(patch)) {
        if (value === null) next.delete(key);
        else next.set(key, value);
      }
      router.push(`${pathname}?${next.toString()}`, { scroll: false });
    },
    [params, pathname, router],
  );

  function toggleSort(key: string) {
    // Same column flips the direction; a new column starts descending, which
    // is "most recent" or "biggest" for every column in this admin.
    const nextDirection = sort === key && direction === "desc" ? "asc" : "desc";
    push({ sort: key, direction: nextDirection, page: "1" });
  }

  const pages = Math.max(1, Math.ceil(total / perPage));
  const from = total === 0 ? 0 : (page - 1) * perPage + 1;
  const to = Math.min(page * perPage, total);

  if (rows.length === 0 && page === 1) return <>{empty}</>;

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className={cn("w-full border-collapse text-sm", minWidth)}>
          <thead>
            <tr className="border-b border-rule">
              {columns.map((column, index) => {
                const active = column.key && sort === column.key;
                return (
                  <th
                    key={column.key ?? index}
                    scope="col"
                    aria-sort={
                      active ? (direction === "asc" ? "ascending" : "descending") : undefined
                    }
                    className={cn(
                      "ui-dense px-4 py-2.5 text-[11px] font-semibold tracking-[0.1em] text-muted-foreground uppercase",
                      column.align === "end" ? "text-end" : "text-start",
                    )}
                  >
                    {column.key ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(column.key!)}
                        className={cn(
                          "inline-flex items-center gap-1 transition-colors hover:text-foreground",
                          active && "text-foreground",
                        )}
                      >
                        {column.header}
                        {active ? (
                          direction === "asc" ? (
                            <ArrowUp className="h-3 w-3" aria-hidden="true" />
                          ) : (
                            <ArrowDown className="h-3 w-3" aria-hidden="true" />
                          )
                        ) : (
                          <ChevronsUpDown
                            className="h-3 w-3 opacity-30"
                            aria-hidden="true"
                          />
                        )}
                      </button>
                    ) : (
                      column.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {rows.map((row) => (
              <tr
                key={getKey(row)}
                className="border-b border-border last:border-0 hover:bg-paper"
              >
                {columns.map((column, index) => (
                  <td
                    key={column.key ?? index}
                    className={cn(
                      "px-4 py-3",
                      column.align === "end" && "text-end",
                      column.className,
                    )}
                  >
                    {column.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* The pager states the range and the total, so "next" is not a guess. */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="figures text-xs text-muted-foreground">
          {t("showingRange", { from, to, total })}
        </p>

        {pages > 1 && (
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1 px-2"
              disabled={page <= 1}
              onClick={() => push({ page: String(page - 1) })}
            >
              {/* Direction, so it mirrors in Arabic. */}
              <ChevronLeft className="h-3.5 w-3.5 rtl:-scale-x-100" aria-hidden="true" />
              {t("previous")}
            </Button>

            <span className="figures px-1 text-xs text-muted-foreground">
              {page} / {pages}
            </span>

            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1 px-2"
              disabled={page >= pages}
              onClick={() => push({ page: String(page + 1) })}
            >
              {t("next")}
              <ChevronRight className="h-3.5 w-3.5 rtl:-scale-x-100" aria-hidden="true" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
