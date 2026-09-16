"use client";

import { useTranslations } from "next-intl";

import { DataTable, type Column } from "./DataTable";
import { Empty } from "./AdminChrome";

export type ActivityRow = {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  ip: string | null;
  createdAt: Date;
  actorName: string | null;
};

/** `orders.confirmed` becomes "Order confirmed". */
function readAction(action: string) {
  const [subject = "", verb = ""] = action.split(".");
  const noun = subject.replace(/_/g, " ").replace(/s$/, "");
  const words = verb.replace(/_/g, " ");
  return `${noun.charAt(0).toUpperCase()}${noun.slice(1)} ${words}`.trim();
}

export function ActivityLogTable({
  rows,
  total,
  page,
  perPage,
  sort,
  direction,
}: {
  rows: ActivityRow[];
  total: number;
  page: number;
  perPage: number;
  sort: string;
  direction: "asc" | "desc";
}) {
  const t = useTranslations("admin.activity");

  const columns: Column<ActivityRow>[] = [
    {
      key: "createdAt",
      header: t("columns.when"),
      cell: (row) => (
        <span className="figures whitespace-nowrap text-muted-foreground">
          {row.createdAt.toLocaleString("en-GB", {
            day: "2-digit",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      ),
    },
    {
      key: "actor",
      header: t("columns.who"),
      cell: (row) => row.actorName ?? <span className="text-muted-foreground">{t("system")}</span>,
    },
    {
      key: "action",
      header: t("columns.what"),
      cell: (row) => <span className="font-medium">{readAction(row.action)}</span>,
    },
    {
      key: "entity",
      header: t("columns.on"),
      cell: (row) => (
        <span className="figures text-xs text-muted-foreground">
          {row.entityId ? row.entityId.slice(0, 8) : "—"}
        </span>
      ),
    },
    {
      header: t("columns.from"),
      cell: (row) => (
        <span className="figures text-xs text-muted-foreground">
          <bdi dir="ltr">{row.ip ?? "—"}</bdi>
        </span>
      ),
    },
  ];

  return (
    <DataTable
      rows={rows}
      columns={columns}
      getKey={(row) => row.id}
      total={total}
      page={page}
      perPage={perPage}
      sort={sort}
      direction={direction}
      empty={<Empty title={t("emptyTitle")} hint={t("emptyHint")} />}
      minWidth="min-w-[720px]"
    />
  );
}
