import { Download, Search } from "lucide-react";

import { Link } from "../../../../../i18n/navigation";

import { PageHead, Panel } from "@/components/admin/AdminChrome";
import { OrdersTable, type OrderRow } from "@/components/admin/OrdersTable";
import { OrdersTrash, type TrashedOrderRow } from "@/components/admin/OrdersTrash";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PermissionGate } from "@/components/admin/PermissionGate";
import { hasPermission, requireStaffOrNotFound } from "@/server/session";
import { listOrders, listOrdersPaged } from "@/server/orders";
import { listTrash } from "@/server/trash";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

/**
 * The filters that matter, inline. Everything else is a search box.
 * `_AI_CONTEXT/12_DESIGN.md`: awaiting verification and ready to ship are the
 * two the client named, so they lead.
 */
const FILTERS = [
  { key: "", label: "All" },
  { key: "pending", label: "Awaiting call" },
  { key: "confirmed", label: "Ready to ship" },
  { key: "shipped", label: "With courier" },
  { key: "delivered", label: "Delivered" },
  { key: "cancelled", label: "Cancelled" },
] as const;

/** Not a real order status — its own view, reading from the trash system. */
const TRASH_KEY = "trashed";

type Status = Parameters<typeof listOrders>[0] extends { status?: (infer S)[] } ? S : never;

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    q?: string;
    sort?: string;
    direction?: "asc" | "desc";
    page?: string;
  }>;
}) {
  const user = await requireStaffOrNotFound();
  if (!user.permissions.has("orders.view")) {
    return (
      <div className="space-y-6">
        <PageHead title="Orders" />
        <PermissionGate permission="orders.view" />
      </div>
    );
  }
  const [canConfirm, canEdit] = await Promise.all([
    hasPermission("orders.confirm"),
    hasPermission("orders.edit"),
  ]);
  const canDelete = user.permissions.has("orders.delete");

  const params = await searchParams;
  const showTrash = canDelete && params.status === TRASH_KEY;
  const status = FILTERS.some((f) => f.key && f.key === params.status)
    ? (params.status as Status)
    : undefined;
  const q = params.q?.trim() || undefined;

  const result = showTrash
    ? { rows: [], total: 0, page: 1, perPage: 25, sort: "createdAt", direction: "desc" as const }
    : await listOrdersPaged(
        { status: status ? [status] : undefined, search: q },
        { sort: params.sort, direction: params.direction, page: params.page },
      );

  const rows: OrderRow[] = result.rows.map((o) => ({
    id: o.id,
    reference: o.reference,
    customerName: o.customerName,
    phone: o.phone,
    status: o.status,
    totalDzd: o.totalDzd,
    deliveryType: o.deliveryType,
    createdAt: o.createdAt,
    wilayaName: o.wilayaNameFr ?? "",
    communeName: o.communeNameFr ?? "",
    itemCount: o.itemCount,
    hasCustomerNote: o.hasCustomerNote,
  }));

  const trashRows: TrashedOrderRow[] = showTrash
    ? (await listTrash(["order"])).map((r) => ({
        id: r.id,
        title: r.title,
        archivedAt: r.archivedAt.toISOString(),
        daysRemaining: r.daysRemaining,
      }))
    : [];

  function href(key: string) {
    const sp = new URLSearchParams();
    if (key) sp.set("status", key);
    if (q) sp.set("q", q);
    // Carried through: changing the filter should not silently reset the sort
    // a moderator picked. Page is dropped on purpose, since a new filter means
    // a different result set and page 7 of it is meaningless.
    if (params.sort) sp.set("sort", params.sort);
    if (params.direction) sp.set("direction", params.direction);
    const s = sp.toString();
    return s ? `/admin/orders?${s}` : "/admin/orders";
  }

  return (
    <div className="space-y-6">
      <PageHead
        title="Orders"
        meta={
          showTrash ? (
            <>{trashRows.length} in the trash. Purged automatically 30 days after being sent here.</>
          ) : (
            <>
              {rows.length} shown. Confirm by phone before anything ships; stock moves at
              confirmation.
            </>
          )
        }
        action={
          <Button asChild variant="outline" size="sm" className="gap-1.5">
            <a href={`/api/admin/orders/export${status ? `?status=${status}` : ""}`}>
              <Download className="h-3.5 w-3.5" aria-hidden="true" />
              Export CSV
            </a>
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => {
            const active = (params.status ?? "") === f.key;
            return (
              <Link
                key={f.key || "all"}
                href={href(f.key)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "ui-dense rounded-md border px-3 py-1.5 text-xs font-medium transition-colors duration-150",
                  active
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-card text-muted-foreground hover:border-foreground/30 hover:text-foreground",
                )}
              >
                {f.label}
              </Link>
            );
          })}
          {canDelete && (
            <Link
              href={href(TRASH_KEY)}
              aria-current={showTrash ? "page" : undefined}
              className={cn(
                "ui-dense rounded-md border px-3 py-1.5 text-xs font-medium transition-colors duration-150",
                showTrash
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-card text-muted-foreground hover:border-foreground/30 hover:text-foreground",
              )}
            >
              Trashed
            </Link>
          )}
        </div>

        <form action="/admin/orders" className="relative ms-auto w-full sm:w-64">
          {status && <input type="hidden" name="status" value={status} />}
          <Search
            className="pointer-events-none absolute start-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            name="q"
            defaultValue={q ?? ""}
            placeholder="Name, phone or reference"
            aria-label="Search orders"
            className="h-9 ps-8 text-sm"
          />
        </form>
      </div>

      <Panel
        title={showTrash ? "Trashed" : status ? FILTERS.find((f) => f.key === status)!.label : "All orders"}
        padded={false}
      >
        {showTrash ? (
          <OrdersTrash rows={trashRows} />
        ) : (
          <OrdersTable
            rows={rows}
            canConfirm={canConfirm}
            canEdit={canEdit}
            canDelete={canDelete}
            total={result.total}
            page={result.page}
            perPage={result.perPage}
            sort={result.sort}
            direction={result.direction}
          />
        )}
      </Panel>
    </div>
  );
}
