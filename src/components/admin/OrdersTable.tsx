"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "../../../i18n/navigation";
import { Check, Loader2, MessageSquareText, MoreHorizontal, Package, Trash2, Truck, X } from "lucide-react";
import { toast } from "sonner";
import { motion, useReducedMotion } from "framer-motion";

import {
  archiveOrderAction,
  cancelOrderAction,
  confirmOrderAction,
  setOrderStatusAction,
  type ActionResult,
} from "@/server/actions/orders";
import { ORDER_TONE, StatusPill } from "./StatusPill";
import { DataTable, type Column } from "./DataTable";
import { Empty } from "./AdminChrome";
import { CopyButton } from "./CopyButton";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { formatDzd } from "@/lib/money";
import { formatPhone } from "@/lib/phone";
import { EASE_OUT } from "@/lib/motion";
import { cn } from "@/lib/utils";

export type OrderRow = {
  id: string;
  reference: string;
  customerName: string;
  phone: string;
  status: string;
  totalDzd: number;
  deliveryType: "home" | "desk";
  createdAt: Date;
  wilayaName: string;
  communeName: string;
  itemCount: number;
  hasCustomerNote: boolean;
};

export function OrdersTable({
  rows,
  canConfirm,
  canEdit,
  canDelete,
  total,
  page,
  perPage,
  sort,
  direction,
}: {
  rows: OrderRow[];
  canConfirm: boolean;
  canEdit: boolean;
  canDelete: boolean;
  total: number;
  page: number;
  perPage: number;
  sort: string;
  direction: "asc" | "desc";
}) {
  const t = useTranslations("admin.orders");
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [cancelTarget, setCancelTarget] = useState<OrderRow | null>(null);
  const [reason, setReason] = useState("");
  const [isPending, startTransition] = useTransition();

  // Every key spelled out, so the message catalogue can be checked
  // statically rather than assembled from a runtime-built key.
  const statusLabel: Record<string, string> = {
    pending: t("status.pending"),
    confirmed: t("status.confirmed"),
    packed: t("status.packed"),
    shipped: t("status.shipped"),
    delivered: t("status.delivered"),
    cancelled: t("status.cancelled"),
    returned: t("status.returned"),
  };

  function run(id: string, fn: () => Promise<ActionResult>) {
    setBusyId(id);
    startTransition(async () => {
      try {
        const result = await fn();
        if (result.ok) {
          toast.success(result.message);
          router.refresh();
        } else {
          toast.error(result.message);
        }
      } catch {
        toast.error(t("genericError"));
      } finally {
        setBusyId(null);
      }
    });
  }

  const empty = (
    <Empty
      title={t("emptyTitle")}
      hint={t("emptyHint")}
      action={
        <Button asChild variant="outline" size="sm">
          <Link href="/admin/orders">{t("clearFilters")}</Link>
        </Button>
      }
    />
  );

  return (
    <>
      <DataTable<OrderRow>
        rows={rows}
        getKey={(order) => order.id}
        total={total}
        page={page}
        perPage={perPage}
        sort={sort}
        direction={direction}
        minWidth="min-w-[860px]"
        empty={empty}
        columns={([
          {
            key: "reference",
            header: t("columns.reference"),
            cell: (order) => (
              <>
                <span className="flex items-center gap-1">
                  <Link
                    href={`/admin/orders/${order.id}`}
                    className="figures font-semibold text-foreground underline-offset-4 hover:underline"
                  >
                    {order.reference}
                  </Link>
                  <CopyButton value={order.reference} label={t("copyReference")} />
                  {order.hasCustomerNote && (
                    <MessageSquareText
                      className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
                      aria-label={t("hasNote")}
                    />
                  )}
                </span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {order.createdAt.toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                  })}
                </span>
              </>
            ),
          },
          {
            key: "customerName",
            header: t("columns.customer"),
            cell: (order) => (
              <>
                <span className="flex items-center gap-1">
                  <span className="font-medium">{order.customerName}</span>
                  <CopyButton value={order.customerName} label={t("copyCustomerName")} />
                </span>
                <span className="flex items-center gap-1">
                  <a
                    href={`tel:${order.phone}`}
                    className="figures text-xs text-muted-foreground underline-offset-4 hover:text-primary-press hover:underline"
                  >
                    <bdi dir="ltr">{formatPhone(order.phone)}</bdi>
                  </a>
                  <CopyButton value={order.phone} label={t("copyPhone")} />
                </span>
              </>
            ),
          },
          {
            key: "wilaya",
            header: t("columns.destination"),
            cell: (order) => (
              <>
                <span className="block">{order.wilayaName}</span>
                <span className="block text-xs text-muted-foreground">
                  {order.communeName}
                  {" \u00b7 "}
                  {order.deliveryType === "home" ? t("home") : t("stopDesk")}
                </span>
              </>
            ),
          },
          {
            // Derived from the line items, so there is no column to sort on.
            header: t("columns.items"),
            align: "end",
            className: "figures",
            cell: (order) => order.itemCount,
          },
          {
            key: "totalDzd",
            header: t("columns.total"),
            align: "end",
            className: "figures font-semibold",
            cell: (order) => formatDzd(order.totalDzd),
          },
          {
            key: "status",
            header: t("columns.status"),
            cell: (order) => (
              <StatusPill tone={ORDER_TONE[order.status] ?? "halted"}>
                {statusLabel[order.status] ?? order.status}
              </StatusPill>
            ),
          },
          {
            header: "",
            align: "end",
            cell: (order) => (
              <OrderRowActions
                order={order}
                canConfirm={canConfirm}
                canEdit={canEdit}
                canDelete={canDelete}
                busy={busyId === order.id && isPending}
                run={run}
                onCancel={() => {
                  setReason("");
                  setCancelTarget(order);
                }}
              />
            ),
          },
        ] satisfies Column<OrderRow>[])}
      />

      {/* Destructive actions confirm and name exactly what they affect. */}
      <AlertDialog
        open={cancelTarget !== null}
        onOpenChange={(open) => !open && setCancelTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("cancelDialog.title", { reference: cancelTarget?.reference ?? "" })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {cancelTarget?.customerName}, {formatDzd(cancelTarget?.totalDzd ?? 0)}.{" "}
              {cancelTarget?.status !== "pending"
                ? t("cancelDialog.stockBack")
                : t("cancelDialog.noStockMoved")}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-1.5">
            <label htmlFor="cancel-reason" className="text-sm font-medium">
              {t("cancelDialog.reasonLabel")}
            </label>
            <Textarea
              id="cancel-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t("cancelDialog.reasonPlaceholder")}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">{t("cancelDialog.reasonNote")}</p>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancelDialog.keepOrder")}</AlertDialogCancel>
            <AlertDialogAction
              disabled={reason.trim().length < 3}
              onClick={() => {
                const target = cancelTarget;
                if (!target) return;
                setCancelTarget(null);
                run(target.id, () =>
                  cancelOrderAction({ orderId: target.id, reasonEn: reason.trim() }),
                );
              }}
            >
              {t("cancelDialog.confirmCancel")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

/**
 * The per-row controls, lifted out of the table body.
 *
 * `DataTable` takes a cell as a function, and a ninety-line dropdown inline in
 * an array literal is unreadable. Behaviour is unchanged: the phone call is
 * the whole job on this screen, so confirming stays a real button rather than
 * a menu item.
 */
function OrderRowActions({
  order,
  canConfirm,
  canEdit,
  canDelete,
  busy,
  run,
  onCancel,
}: {
  order: OrderRow;
  canConfirm: boolean;
  canEdit: boolean;
  canDelete: boolean;
  busy: boolean;
  run: (id: string, fn: () => Promise<ActionResult>) => void;
  onCancel: () => void;
}) {
  const t = useTranslations("admin.orders");

  return (
    <div className="flex items-center justify-end gap-1.5">
      {order.status === "pending" && canConfirm && (
        <Button
          size="sm"
          disabled={busy}
          onClick={() => run(order.id, () => confirmOrderAction({ orderId: order.id }))}
          className="h-8 gap-1.5 px-2.5"
        >
          {busy ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
          ) : (
            <Check className="h-3.5 w-3.5" aria-hidden="true" />
          )}
          {t("confirm")}
        </Button>
      )}

      {(canEdit || canDelete) && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              disabled={busy}
              aria-label={t("actionsFor", { reference: order.reference })}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem asChild>
              <Link href={`/admin/orders/${order.id}`}>{t("openOrder")}</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {canEdit && order.status === "confirmed" && (
              <DropdownMenuItem
                onSelect={() =>
                  run(order.id, () =>
                    setOrderStatusAction({ orderId: order.id, status: "packed" }),
                  )
                }
              >
                <Package className="h-4 w-4" aria-hidden="true" />
                {t("markPacked")}
              </DropdownMenuItem>
            )}
            {canEdit && (order.status === "packed" || order.status === "confirmed") && (
              <DropdownMenuItem
                onSelect={() =>
                  run(order.id, () =>
                    setOrderStatusAction({ orderId: order.id, status: "shipped" }),
                  )
                }
              >
                <Truck className="h-4 w-4" aria-hidden="true" />
                {t("handToCourier")}
              </DropdownMenuItem>
            )}
            {canEdit && order.status === "shipped" && (
              <DropdownMenuItem
                onSelect={() =>
                  run(order.id, () =>
                    setOrderStatusAction({ orderId: order.id, status: "delivered" }),
                  )
                }
              >
                <Check className="h-4 w-4" aria-hidden="true" />
                {t("markDelivered")}
              </DropdownMenuItem>
            )}
            {canEdit && order.status !== "cancelled" && order.status !== "delivered" && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={onCancel}
                  className="text-primary-press focus:text-primary-press"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                  {t("cancelOrder")}
                </DropdownMenuItem>
              </>
            )}
            {canDelete && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={() =>
                    run(order.id, () => archiveOrderAction({ orderId: order.id }))
                  }
                  className="text-primary-press focus:text-primary-press"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                  {t("moveToTrash")}
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
