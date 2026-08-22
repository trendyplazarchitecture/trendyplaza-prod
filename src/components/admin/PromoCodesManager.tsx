"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Archive, Loader2, Pencil, Plus, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  archivePromoCodeAction,
  deletePromoCodeAction,
  restorePromoCodeAction,
  savePromoCodeAction,
  setPromoCodeProductsAction,
  type ActionResult,
} from "@/server/actions/promo-codes";
import { DataTable, type Column } from "./DataTable";
import { BulkBar } from "./BulkBar";
import { Empty } from "./AdminChrome";
import { StatusPill } from "./StatusPill";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { formatDzd } from "@/lib/money";

export type ScopeType = "cart" | "category" | "product" | "products";

export type PromoCodeRow = {
  id: string;
  code: string;
  kind: "percent" | "amount";
  /** Dinars, already converted from centimes when `kind === "amount"`. */
  value: number;
  scopeType: ScopeType;
  categoryId: string | null;
  productId: string | null;
  /** Only meaningful when `scopeType === "products"`. */
  productIds: string[];
  startsAt: Date | null;
  endsAt: Date | null;
  maxUses: number | null;
  usedCount: number;
  isActive: boolean;
  archivedAt: Date | null;
};

function toDateInput(d: Date | null): string {
  return d ? d.toISOString().slice(0, 10) : "";
}

function scopeSummary(
  row: PromoCodeRow,
  categories: { id: string; labelEn: string }[],
  products: { id: string; titleEn: string }[],
  scopeLabel: Record<ScopeType, string>,
  t: (key: string) => string,
) {
  if (row.scopeType === "category") {
    return categories.find((c) => c.id === row.categoryId)?.labelEn ?? t("aCategory");
  }
  if (row.scopeType === "product") {
    return products.find((p) => p.id === row.productId)?.titleEn ?? t("aProduct");
  }
  return scopeLabel[row.scopeType];
}

export function PromoCodesManager({
  rows,
  total,
  page,
  perPage,
  sort,
  direction,
  categories,
  products,
}: {
  rows: PromoCodeRow[];
  total: number;
  page: number;
  perPage: number;
  sort: string;
  direction: "asc" | "desc";
  categories: { id: string; labelEn: string }[];
  products: { id: string; titleEn: string }[];
}) {
  const t = useTranslations("admin.promoCodes");
  const tc = useTranslations("admin.common");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<PromoCodeRow | "new" | null>(null);
  const [isPending, startTransition] = useTransition();

  const SCOPE_LABEL: Record<ScopeType, string> = {
    cart: t("scopeCart"),
    category: t("scopeCategory"),
    product: t("scopeProduct"),
    products: t("scopeProducts"),
  };

  // Controlled, not FormData-driven: the scope picker changes which other
  // fields are relevant, which is exactly the case React state is for. `kind`
  // is controlled too — Radix's Select doesn't reliably bubble a plain `name`
  // into FormData, same reason the visibility switches elsewhere in this
  // admin use a hidden input instead of trusting it.
  const [scopeType, setScopeType] = useState<ScopeType>("cart");
  const [kind, setKind] = useState<"percent" | "amount">("percent");
  const [isActive, setIsActive] = useState(true);
  const [categoryId, setCategoryId] = useState<string>("");
  const [productId, setProductId] = useState<string>("");
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

  function openFor(row: PromoCodeRow | "new") {
    setEditing(row);
    setScopeType(row === "new" ? "cart" : row.scopeType);
    setKind(row === "new" ? "percent" : row.kind);
    setIsActive(row === "new" ? true : row.isActive);
    setCategoryId(row === "new" ? "" : (row.categoryId ?? ""));
    setProductId(row === "new" ? "" : (row.productId ?? ""));
    setSelectedProductIds(row === "new" ? [] : row.productIds);
    setOpen(true);
  }

  function act(fn: () => Promise<ActionResult>) {
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
      }
    });
  }

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [bulkConfirmText, setBulkConfirmText] = useState("");
  const selectedRows = rows.filter((r) => selected.has(r.id));
  const selectedArchived = selectedRows.filter((r) => r.archivedAt);
  const selectedLive = selectedRows.filter((r) => !r.archivedAt);

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function bulk(ids: string[], fn: (id: string) => Promise<ActionResult>, doneMessage: string) {
    startTransition(async () => {
      const results = await Promise.all(ids.map((id) => fn(id)));
      const failed = results.filter((r) => !r.ok).length;
      if (failed === 0) toast.success(doneMessage);
      else toast.error(t("someFailed", { failed, total: ids.length }));
      setSelected(new Set());
      router.refresh();
    });
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    form.set("scopeType", scopeType);
    form.set("kind", kind);
    form.set("isActive", isActive ? "true" : "false");
    if (scopeType === "category") form.set("categoryId", categoryId);
    if (scopeType === "product") form.set("productId", productId);
    if (editing && editing !== "new") form.set("id", editing.id);

    startTransition(async () => {
      try {
        const result = await savePromoCodeAction(form);
        if (!result.ok) {
          toast.error(result.message);
          return;
        }
        if (scopeType === "products") {
          const scoped = await setPromoCodeProductsAction({
            promoCodeId: result.id,
            productIds: selectedProductIds,
          });
          if (!scoped.ok) {
            toast.error(scoped.message);
            return;
          }
        }
        toast.success(result.message);
        setOpen(false);
        setEditing(null);
        router.refresh();
      } catch {
        toast.error(t("genericError"));
      }
    });
  }

  const current = editing !== "new" ? editing : null;

  const empty = (
    <Empty
      title={t("emptyTitle")}
      hint={t("emptyHint")}
      action={
        <Button size="sm" onClick={() => openFor("new")}>
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          {t("newCode")}
        </Button>
      }
    />
  );

  const columns: Column<PromoCodeRow>[] = [
    {
      header: (
        <Checkbox
          checked={rows.length > 0 && selected.size === rows.length}
          onCheckedChange={() =>
            setSelected((prev) => (prev.size === rows.length ? new Set() : new Set(rows.map((r) => r.id))))
          }
          aria-label={t("selectAll")}
        />
      ),
      cell: (row) => (
        <Checkbox
          checked={selected.has(row.id)}
          onCheckedChange={() => toggleOne(row.id)}
          aria-label={t("select", { code: row.code })}
        />
      ),
    },
    {
      key: "code",
      header: t("columns.code"),
      cell: (row) => (
        <>
          <span className="figures font-semibold">{row.code}</span>
          <span className="mt-0.5 block text-xs text-muted-foreground">
            {scopeSummary(row, categories, products, SCOPE_LABEL, t)}
          </span>
        </>
      ),
    },
    {
      header: t("columns.discount"),
      cell: (row) => (
        <span className="figures">
          {row.kind === "percent" ? `${row.value}%` : formatDzd(row.value * 100)}
        </span>
      ),
    },
    {
      key: "usedCount",
      header: t("columns.used"),
      align: "end",
      className: "figures",
      cell: (row) => (row.maxUses ? `${row.usedCount} / ${row.maxUses}` : row.usedCount),
    },
    {
      header: t("columns.state"),
      cell: (row) => (
        <StatusPill tone={row.archivedAt ? "halted" : row.isActive ? "active" : "alert"}>
          {row.archivedAt ? t("archived") : row.isActive ? t("active") : t("inactive")}
        </StatusPill>
      ),
    },
    {
      header: "",
      align: "end",
      cell: (row) => (
        <div className="flex justify-end gap-1">
          {row.archivedAt ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              aria-label={t("restore", { code: row.code })}
              disabled={isPending}
              onClick={() => act(() => restorePromoCodeAction({ promoCodeId: row.id }))}
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
          ) : (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                aria-label={t("edit", { code: row.code })}
                onClick={() => openFor(row)}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                aria-label={t("archive", { code: row.code })}
                disabled={isPending}
                onClick={() => act(() => archivePromoCodeAction({ promoCodeId: row.id }))}
              >
                <Archive className="h-3.5 w-3.5" />
              </Button>
            </>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-primary-press"
            aria-label={t("delete", { code: row.code })}
            disabled={isPending}
            onClick={() => {
              if (confirm(t("deleteConfirm", { code: row.code }))) {
                act(() => deletePromoCodeAction({ promoCodeId: row.id }));
              }
            }}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditing(null); }}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5" onClick={() => openFor("new")}>
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              {t("newCode")}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{current ? t("editPromoCode") : t("newPromoCode")}</DialogTitle>
            </DialogHeader>

            <form onSubmit={submit} className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="code" className="text-xs">
                    {t("codeLabel")}
                  </Label>
                  <Input
                    id="code"
                    name="code"
                    dir="ltr"
                    autoCapitalize="characters"
                    required
                    defaultValue={current?.code ?? ""}
                    placeholder="RENTREE20"
                    className="ui-dense h-9 uppercase"
                  />
                </div>
                <div className="flex items-end justify-between gap-2 pb-1.5">
                  <Label htmlFor="promo-active" className="text-xs">
                    {t("activeLabel")}
                  </Label>
                  {/* dir="ltr": a toggle's thumb travel is not text direction. */}
                  <Switch
                    dir="ltr"
                    id="promo-active"
                    checked={isActive}
                    onCheckedChange={setIsActive}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">{t("kindLabel")}</Label>
                  <Select value={kind} onValueChange={(v) => setKind(v as "percent" | "amount")}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percent">{t("percentOff")}</SelectItem>
                      <SelectItem value="amount">{t("amountOff")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="value" className="text-xs">
                    {t("valueLabel")}
                  </Label>
                  <Input
                    id="value"
                    name="value"
                    type="number"
                    min={1}
                    required
                    defaultValue={current?.value ?? ""}
                    className="figures ui-dense h-9"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">{t("appliesTo")}</Label>
                <RadioGroup value={scopeType} onValueChange={(v) => setScopeType(v as ScopeType)}>
                  {(Object.keys(SCOPE_LABEL) as ScopeType[]).map((s) => (
                    <label key={s} className="flex items-center gap-2 text-sm">
                      <RadioGroupItem value={s} />
                      {SCOPE_LABEL[s]}
                    </label>
                  ))}
                </RadioGroup>

                {scopeType === "category" && (
                  <Select value={categoryId} onValueChange={setCategoryId}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder={t("pickCategory")} />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.labelEn}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {scopeType === "product" && (
                  <Select value={productId} onValueChange={setProductId}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder={t("pickProduct")} />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.titleEn}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {scopeType === "products" && (
                  <ul className="max-h-48 space-y-1 overflow-y-auto rounded-md border border-border p-2">
                    {products.map((p) => (
                      <li key={p.id} className="flex items-center gap-2 py-0.5">
                        <Checkbox
                          id={`prod-${p.id}`}
                          checked={selectedProductIds.includes(p.id)}
                          onCheckedChange={(checked) =>
                            setSelectedProductIds((ids) =>
                              checked ? [...ids, p.id] : ids.filter((id) => id !== p.id),
                            )
                          }
                        />
                        <label htmlFor={`prod-${p.id}`} className="text-sm">
                          {p.titleEn}
                        </label>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="startsAt" className="text-xs">
                    {t("startsLabel")}
                  </Label>
                  <Input
                    id="startsAt"
                    name="startsAt"
                    type="date"
                    defaultValue={toDateInput(current?.startsAt ?? null)}
                    className="ui-dense h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="endsAt" className="text-xs">
                    {t("endsLabel")}
                  </Label>
                  <Input
                    id="endsAt"
                    name="endsAt"
                    type="date"
                    defaultValue={toDateInput(current?.endsAt ?? null)}
                    className="ui-dense h-9"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="maxUses" className="text-xs">
                  {t("maxUsesLabel")}
                </Label>
                <Input
                  id="maxUses"
                  name="maxUses"
                  type="number"
                  min={1}
                  defaultValue={current?.maxUses ?? ""}
                  placeholder={t("unlimitedPlaceholder")}
                  className="figures ui-dense h-9 max-w-40"
                />
              </div>

              <DialogFooter>
                <Button type="submit" disabled={isPending}>
                  {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />}
                  {tc("save")}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <BulkBar count={selected.size} onClear={() => setSelected(new Set())}>
        {selectedLive.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="h-7 gap-1 px-2 text-xs"
            disabled={isPending}
            onClick={() =>
              bulk(
                selectedLive.map((r) => r.id),
                (id) => archivePromoCodeAction({ promoCodeId: id }),
                t("archivedToast"),
              )
            }
          >
            <Archive className="h-3 w-3" />
            {t("archiveCount", { count: selectedLive.length })}
          </Button>
        )}
        {selectedArchived.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="h-7 gap-1 px-2 text-xs"
            disabled={isPending}
            onClick={() =>
              bulk(
                selectedArchived.map((r) => r.id),
                (id) => restorePromoCodeAction({ promoCodeId: id }),
                t("restoredToast"),
              )
            }
          >
            <RotateCcw className="h-3 w-3" />
            {t("restoreCount", { count: selectedArchived.length })}
          </Button>
        )}
        {selectedRows.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1 px-2 text-xs text-primary-press hover:text-primary-press"
            disabled={isPending}
            onClick={() => {
              setBulkConfirmText("");
              setConfirmBulkDelete(true);
            }}
          >
            <Trash2 className="h-3 w-3" />
            {t("deleteCount", { count: selectedRows.length })}
          </Button>
        )}
      </BulkBar>

      <AlertDialog
        open={confirmBulkDelete}
        onOpenChange={(o) => {
          setConfirmBulkDelete(o);
          if (!o) setBulkConfirmText("");
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("bulkDeleteDialog.title", { count: selectedRows.length })}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("bulkDeleteDialog.description", {
                list: selectedRows.map((r) => r.code).join(", "),
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="promo-bulk-confirm" className="text-xs">
              {t.rich("bulkDeleteDialog.typeDeleteToConfirm", {
                b: (chunks) => <span className="font-mono font-semibold">{chunks}</span>,
              })}
            </Label>
            <Input
              id="promo-bulk-confirm"
              value={bulkConfirmText}
              onChange={(e) => setBulkConfirmText(e.target.value)}
              autoComplete="off"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("bulkDeleteDialog.keepThem")}</AlertDialogCancel>
            <AlertDialogAction
              disabled={bulkConfirmText.trim() !== "DELETE"}
              onClick={() => {
                setConfirmBulkDelete(false);
                bulk(
                  selectedRows.map((r) => r.id),
                  (id) => deletePromoCodeAction({ promoCodeId: id }),
                  t("deletedToast"),
                );
              }}
            >
              {t("bulkDeleteDialog.confirmButton")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <DataTable<PromoCodeRow>
        rows={rows}
        getKey={(row) => row.id}
        total={total}
        page={page}
        perPage={perPage}
        sort={sort}
        direction={direction}
        minWidth="min-w-[720px]"
        empty={empty}
        columns={columns}
      />
    </div>
  );
}
