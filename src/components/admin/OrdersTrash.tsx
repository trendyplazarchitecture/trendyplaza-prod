"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Loader2, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  purgeFromTrashAction,
  purgeOrdersAction,
  restoreFromTrashAction,
  type ActionResult,
} from "@/server/actions/trash";
import { BulkBar } from "./BulkBar";
import { Empty } from "./AdminChrome";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

export type TrashedOrderRow = {
  id: string;
  /** "TP-2608-0059 — Test Buyer", as `src/server/trash.ts` formats it. */
  title: string;
  archivedAt: string;
  daysRemaining: number;
};

function when(iso: string) {
  return new Date(iso).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

/** The order reference is the part before " — " in the trash row's title. */
function referenceOf(title: string) {
  return title.split(" — ")[0];
}

export function OrdersTrash({ rows }: { rows: TrashedOrderRow[] }) {
  const t = useTranslations("admin.orders.trash");
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busyId, setBusyId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [purgeTarget, setPurgeTarget] = useState<TrashedOrderRow | null>(null);
  const [bulkPurging, setBulkPurging] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const selectedRows = rows.filter((r) => selected.has(r.id));

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected((prev) => (prev.size === rows.length ? new Set() : new Set(rows.map((r) => r.id))));
  }

  function afterAction(result: ActionResult) {
    if (result.ok) toast.success(result.message);
    else toast.error(result.message);
  }

  function restoreOne(row: TrashedOrderRow) {
    setBusyId(row.id);
    startTransition(async () => {
      afterAction(await restoreFromTrashAction({ entity: "order", id: row.id }));
      setBusyId(null);
      router.refresh();
    });
  }

  function bulkRestore() {
    const ids = selectedRows.map((r) => r.id);
    startTransition(async () => {
      const results = await Promise.all(ids.map((id) => restoreFromTrashAction({ entity: "order", id })));
      const failed = results.filter((r) => !r.ok).length;
      if (failed === 0) toast.success(t("restored"));
      else toast.error(t("someFailed", { failed, total: ids.length }));
      setSelected(new Set());
      router.refresh();
    });
  }

  function purgeOne() {
    const target = purgeTarget;
    if (!target) return;
    setPurgeTarget(null);
    startTransition(async () => {
      afterAction(
        await purgeFromTrashAction({ entity: "order", id: target.id, confirmText }),
      );
      setConfirmText("");
      router.refresh();
    });
  }

  function bulkPurge() {
    const ids = selectedRows.map((r) => r.id);
    const word = confirmText;
    setBulkPurging(false);
    startTransition(async () => {
      // Bulk purge is gated by the typed "DELETE" below, not by typing every
      // order's reference — the single-row path keeps that stricter check.
      afterAction(await purgeOrdersAction({ orderIds: ids, confirmWord: word }));
      setConfirmText("");
      setSelected(new Set());
      router.refresh();
    });
  }

  if (rows.length === 0) {
    return (
      <div className="p-4">
        <Empty title={t("emptyTitle")} hint={t("emptyHint")} />
      </div>
    );
  }

  return (
    <div className="space-y-3 p-4">
      <div className="flex items-center gap-2">
        <Checkbox
          checked={selected.size === rows.length}
          onCheckedChange={toggleAll}
          aria-label={t("selectAllTrashed")}
        />
        <span className="text-xs text-muted-foreground">{t("selectAll")}</span>
      </div>

      <BulkBar count={selected.size} onClear={() => setSelected(new Set())}>
        <Button
          variant="outline"
          size="sm"
          className="h-7 gap-1 px-2 text-xs"
          disabled={isPending}
          onClick={bulkRestore}
        >
          <RotateCcw className="h-3 w-3" />
          {t("restore")}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1 px-2 text-xs text-primary-press hover:text-primary-press"
          disabled={isPending}
          onClick={() => setBulkPurging(true)}
        >
          <Trash2 className="h-3 w-3" />
          {t("deleteForever")}
        </Button>
      </BulkBar>

      <ul className="space-y-2">
        {rows.map((row) => {
          const busy = busyId === row.id && isPending;
          return (
            <li
              key={row.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card p-3"
            >
              <div className="flex min-w-0 flex-1 items-center gap-2.5">
                <Checkbox
                  checked={selected.has(row.id)}
                  onCheckedChange={() => toggleOne(row.id)}
                  aria-label={t("selectRow", { title: row.title })}
                />
                <div className="min-w-0">
                  <span className="block truncate text-sm font-medium">{row.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {t("trashedOn", { date: when(row.archivedAt) })}{" "}
                    {row.daysRemaining === 0
                      ? t("purgedNextLoad")
                      : t("daysLeft", { count: row.daysRemaining })}
                  </span>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1 px-2 text-xs"
                  disabled={busy}
                  onClick={() => restoreOne(row)}
                >
                  {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCcw className="h-3 w-3" />}
                  {t("restore")}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1 px-2 text-xs text-primary-press hover:text-primary-press"
                  disabled={busy}
                  onClick={() => {
                    setConfirmText("");
                    setPurgeTarget(row);
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                  {t("deleteForever")}
                </Button>
              </div>
            </li>
          );
        })}
      </ul>

      <AlertDialog
        open={purgeTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPurgeTarget(null);
            setConfirmText("");
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("purgeDialog.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("purgeDialog.description", { title: purgeTarget?.title ?? "" })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="order-purge-confirm" className="text-xs">
              {t.rich("purgeDialog.typeToConfirm", {
                reference: purgeTarget ? referenceOf(purgeTarget.title) : "",
                b: (chunks) => <span className="font-mono font-semibold">{chunks}</span>,
              })}
            </Label>
            <Input
              id="order-purge-confirm"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              autoComplete="off"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("purgeDialog.keepIt")}</AlertDialogCancel>
            <AlertDialogAction
              disabled={!purgeTarget || confirmText.trim() !== referenceOf(purgeTarget.title)}
              onClick={purgeOne}
            >
              {t("deleteForever")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={bulkPurging}
        onOpenChange={(open) => {
          setBulkPurging(open);
          if (!open) setConfirmText("");
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("bulkPurgeDialog.title", { count: selectedRows.length })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("bulkPurgeDialog.description", {
                list: selectedRows.map((r) => referenceOf(r.title)).join(", "),
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="order-bulk-confirm" className="text-xs">
              {t.rich("bulkPurgeDialog.typeDeleteToConfirm", {
                b: (chunks) => <span className="font-mono font-semibold">{chunks}</span>,
              })}
            </Label>
            <Input
              id="order-bulk-confirm"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              autoComplete="off"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("bulkPurgeDialog.keepThem")}</AlertDialogCancel>
            <AlertDialogAction disabled={confirmText.trim() !== "DELETE"} onClick={bulkPurge}>
              {t("deleteForever")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
