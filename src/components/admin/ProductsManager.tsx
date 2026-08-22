"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "../../../i18n/navigation";
import {
  Archive,
  GripVertical,
  Loader2,
  Minus,
  Pencil,
  Plus,
  RotateCcw,
  Star,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import {
  adjustStockAction,
  archiveProductAction,
  reorderProductsAction,
  restoreProductAction,
  saveProductAction,
  setProductFeaturedAction,
  setProductVisibilityAction,
  type ActionResult,
} from "@/server/actions/products";
import { purgeFromTrashAction, restoreFromTrashAction } from "@/server/actions/trash";
import { BulkBar } from "./BulkBar";
import { StatusPill } from "./StatusPill";
import { Checkbox } from "@/components/ui/checkbox";
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
import { ProductGallery, type GalleryImage } from "./ProductGallery";
import { ProductOffersEditor, type OfferRow } from "./ProductOffersEditor";
import { ProductColorsEditor, type ColorRow } from "./ProductColorsEditor";
import { ProductPreview } from "./ProductPreview";
import { ProductSpecsEditor, type SpecRow } from "./ProductSpecsEditor";
import { Empty } from "./AdminChrome";
import { ProductCategoriesManager, type CategoryRow } from "./ProductCategoriesManager";
import { TriLingualField } from "./TriLingual";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDzd, toCentimes, toDinars } from "@/lib/money";
import { cn } from "@/lib/utils";

export type ProductRow = {
  id: string;
  slug: string;
  titleEn: string;
  titleAr: string | null;
  titleFr: string | null;
  descriptionEn: string | null;
  descriptionAr: string | null;
  descriptionFr: string | null;
  categoryId: string;
  priceDzd: number;
  compareAtDzd: number | null;
  stockCount: number;
  containsAccessCode: boolean;
  accessPackageId: string | null;
  isVisible: boolean;
  isFeatured: boolean;
  sku: string | null;
  archivedAt: Date | null;
  images: GalleryImage[];
  specs: SpecRow[];
  offers: OfferRow[];
  colors: ColorRow[];
  /** Read-only: active promo codes that discount this product, whichever way they're scoped to it. */
  activePromoCodes: { code: string; via: "product" | "category" | "products" }[];
};

export function ProductsManager({
  rows,
  packages,
  categories,
}: {
  rows: ProductRow[];
  packages: { id: string; title: string }[];
  categories: CategoryRow[];
}) {
  const t = useTranslations("admin.products");
  const tc = useTranslations("admin.common");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState<ProductRow | "new" | null>(null);
  const [hasCard, setHasCard] = useState(false);
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [packageId, setPackageId] = useState<string>("");
  /*
   * Mirrored form state, for the preview only. The form itself is still
   * uncontrolled and still the thing that gets submitted; this is a copy kept
   * in step so the preview tab can draw what is being typed without turning
   * every field into controlled state.
   */
  const [draft, setDraft] = useState({
    title: "",
    description: "",
    price: 0,
    compareAt: 0,
    stockCount: 0,
    isFeatured: false,
  });

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
  const [confirmBulkPurge, setConfirmBulkPurge] = useState(false);
  const [bulkConfirmText, setBulkConfirmText] = useState("");
  const selectedRows = rows.filter((p) => selected.has(p.id));
  const selectedArchived = selectedRows.filter((p) => p.archivedAt);
  const selectedLive = selectedRows.filter((p) => !p.archivedAt);

  // Ordered locally so a drag responds immediately; the server call that
  // follows is the actual save. Archived rows sit wherever they already
  // are — position stopped mattering to them the moment they left the
  // catalogue, so they are not draggable and never move.
  const [order, setOrder] = useState(rows);
  useEffect(() => setOrder(rows), [rows]);
  const [dragId, setDragId] = useState<string | null>(null);

  function dragOver(overId: string) {
    if (!dragId || dragId === overId) return;
    setOrder((prev) => {
      const from = prev.findIndex((p) => p.id === dragId);
      const to = prev.findIndex((p) => p.id === overId);
      if (from === -1 || to === -1 || prev[to].archivedAt) return prev;
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }

  function dragEnd() {
    if (!dragId) return;
    setDragId(null);
    const liveIds = order.filter((p) => !p.archivedAt).map((p) => p.id);
    act(() => reorderProductsAction({ ids: liveIds }));
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected((prev) => (prev.size === rows.length ? new Set() : new Set(rows.map((p) => p.id))));
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

  function open(product: ProductRow | "new") {
    setEditing(product);
    if (product === "new") {
      setHasCard(false);
      setCategoryId(categories[0]?.id ?? "");
      setPackageId("");
      setDraft({
        title: "",
        description: "",
        price: 0,
        compareAt: 0,
        stockCount: 0,
        isFeatured: false,
      });
    } else {
      setHasCard(product.containsAccessCode);
      setCategoryId(product.categoryId);
      setPackageId(product.accessPackageId ?? "");
      setDraft({
        title: product.titleEn,
        description: product.descriptionEn ?? "",
        price: toDinars(product.priceDzd),
        compareAt: product.compareAtDzd ? toDinars(product.compareAtDzd) : 0,
        stockCount: product.stockCount,
        isFeatured: product.isFeatured,
      });
    }
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    form.set("categoryId", categoryId);
    if (hasCard) form.set("accessPackageId", packageId);
    if (editing && editing !== "new") form.set("id", editing.id);

    startTransition(async () => {
      const result = await saveProductAction(form);
      if (result.ok) {
        toast.success(result.message);
        setEditing(null);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  // Looked up fresh from `rows` rather than trusting the object captured when
  // the dialog opened: a save inside a nested tab (colors, gallery) calls
  // `router.refresh()`, which updates `rows`, but never touches `editing`
  // itself. Without this, the dialog would keep showing what the product
  // looked like the moment it was opened.
  const current =
    editing !== "new" ? (rows.find((r) => r.id === editing?.id) ?? editing) : null;

  return (
    <>
      <div className="flex justify-end gap-2">
        <ProductCategoriesManager categories={categories} />
        <Button size="sm" className="gap-1.5" onClick={() => open("new")}>
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          {t("newProduct")}
        </Button>
      </div>

      {rows.length === 0 ? (
        <Empty title={t("emptyTitle")} hint={t("emptyHint")} />
      ) : (
        <div className="space-y-2">
          <BulkBar count={selected.size} onClear={() => setSelected(new Set())}>
            {selectedLive.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 gap-1 px-2 text-xs"
                disabled={isPending}
                onClick={() =>
                  bulk(
                    selectedLive.map((p) => p.id),
                    (id) => archiveProductAction({ productId: id }),
                    t("movedToTrash"),
                  )
                }
              >
                <Archive className="h-3 w-3" />
                {t("archiveCount", { count: selectedLive.length })}
              </Button>
            )}
            {selectedArchived.length > 0 && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1 px-2 text-xs"
                  disabled={isPending}
                  onClick={() =>
                    bulk(
                      selectedArchived.map((p) => p.id),
                      (id) => restoreFromTrashAction({ entity: "product", id }),
                      t("restored"),
                    )
                  }
                >
                  <RotateCcw className="h-3 w-3" />
                  {t("restoreCount", { count: selectedArchived.length })}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1 px-2 text-xs text-primary-press hover:text-primary-press"
                  disabled={isPending}
                  onClick={() => {
                    setBulkConfirmText("");
                    setConfirmBulkPurge(true);
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                  {t("deleteForeverCount", { count: selectedArchived.length })}
                </Button>
              </>
            )}
          </BulkBar>

          <div className="overflow-x-auto rounded-lg border border-border bg-card">
          <table className="w-full min-w-[880px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-rule">
                <th scope="col" className="ui-dense w-6 px-1 py-2.5" aria-hidden="true" />
                <th scope="col" className="ui-dense w-10 px-4 py-2.5">
                  <Checkbox
                    checked={rows.length > 0 && selected.size === rows.length}
                    onCheckedChange={toggleAll}
                    aria-label={t("selectAll")}
                  />
                </th>
                {[
                  t("columns.product"),
                  t("columns.category"),
                  t("columns.price"),
                  t("columns.stock"),
                  t("columns.home"),
                  t("columns.state"),
                  "",
                ].map((h, i) => (
                  <th
                    key={h || i}
                    scope="col"
                    className={cn(
                      "ui-dense px-4 py-2.5 text-[11px] font-semibold tracking-[0.1em] text-muted-foreground uppercase",
                      i === 2 || i === 3 ? "text-end" : "text-start",
                    )}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {order.map((p) => {
                const out = p.stockCount === 0;
                const low = p.stockCount > 0 && p.stockCount <= 5;

                return (
                  <tr
                    key={p.id}
                    onDragOver={(e) => {
                      if (dragId) {
                        e.preventDefault();
                        dragOver(p.id);
                      }
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      dragEnd();
                    }}
                    className={cn(
                      "border-b border-border last:border-0 hover:bg-paper",
                      p.archivedAt && "opacity-60",
                      dragId === p.id && "opacity-40",
                    )}
                  >
                    <td className="px-1 py-3">
                      {!p.archivedAt && (
                        <span
                          draggable
                          onDragStart={() => setDragId(p.id)}
                          onDragEnd={dragEnd}
                          className="flex cursor-grab items-center justify-center text-muted-foreground/50 hover:text-muted-foreground active:cursor-grabbing"
                          aria-label={t("dragToReorder", { name: p.titleEn })}
                        >
                          <GripVertical className="h-4 w-4" />
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Checkbox
                        checked={selected.has(p.id)}
                        onCheckedChange={() => toggleOne(p.id)}
                        aria-label={t("select", { name: p.titleEn })}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <span className="block truncate font-medium">{p.titleEn}</span>
                      <span className="figures block truncate text-xs text-muted-foreground">
                        {p.slug}
                        {!p.titleAr && <span className="ms-2 text-amber-700">{t("noArabic")}</span>}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-muted-foreground">
                      {categories.find((c) => c.id === p.categoryId)?.labelEn ?? "—"}
                    </td>

                    <td className="figures px-4 py-3 text-end">
                      <span className="font-semibold">{formatDzd(p.priceDzd)}</span>
                      {p.compareAtDzd && (
                        <span className="ms-1.5 text-xs text-muted-foreground line-through">
                          {formatDzd(p.compareAtDzd)}
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      {/*
                        dir="ltr" here, independent of the page: a quantity
                        stepper's -/+ order is a numeric-line convention, not
                        text direction, so it stays fixed in both locales
                        rather than mirroring under RTL (see 01_RULES.md).
                      */}
                      <div dir="ltr" className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          disabled={isPending || p.stockCount === 0}
                          aria-label={t("removeOne", { name: p.titleEn })}
                          onClick={() =>
                            act(() => adjustStockAction({ productId: p.id, delta: -1 }))
                          }
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span
                          className={cn(
                            "figures w-8 text-center font-semibold",
                            out && "text-primary-press",
                            low && "text-amber-700",
                          )}
                        >
                          {p.stockCount}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          disabled={isPending}
                          aria-label={t("addOne", { name: p.titleEn })}
                          onClick={() =>
                            act(() => adjustStockAction({ productId: p.id, delta: 1 }))
                          }
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      {/*
                        Featuring is one click from the list. The client
                        rearranges the home page far more often than they edit
                        a product, and making them open a dialog for it is how
                        the home page ends up never changing.
                      */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                          "h-8 w-8",
                          p.isFeatured ? "text-primary" : "text-muted-foreground/40",
                        )}
                        disabled={isPending || !!p.archivedAt}
                        aria-label={
                          p.isFeatured
                            ? t("stopFeaturing", { name: p.titleEn })
                            : t("feature", { name: p.titleEn })
                        }
                        aria-pressed={p.isFeatured}
                        onClick={() =>
                          act(() =>
                            setProductFeaturedAction({
                              productId: p.id,
                              isFeatured: !p.isFeatured,
                            }),
                          )
                        }
                      >
                        <Star
                          className={cn("h-4 w-4", p.isFeatured && "fill-current")}
                        />
                      </Button>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {p.archivedAt ? (
                          <StatusPill tone="halted">{t("archived")}</StatusPill>
                        ) : (
                          // dir="ltr": a toggle's on/off thumb travel is not
                          // text direction and should not mirror under RTL.
                          <Switch
                            dir="ltr"
                            checked={p.isVisible}
                            disabled={isPending}
                            aria-label={t(p.isVisible ? "unlist" : "list", { name: p.titleEn })}
                            onCheckedChange={(next) =>
                              act(() =>
                                setProductVisibilityAction({
                                  productId: p.id,
                                  isVisible: next,
                                }),
                              )
                            }
                          />
                        )}
                        {p.containsAccessCode && (
                          <StatusPill tone="alert">{t("cardInside")}</StatusPill>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3 text-end">
                      <div className="flex items-center justify-end gap-1">
                        {p.archivedAt ? (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              aria-label={t("restore", { name: p.titleEn })}
                              onClick={() => act(() => restoreProductAction({ productId: p.id }))}
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-primary-press hover:text-primary-press"
                              aria-label={t("deleteForever", { name: p.titleEn })}
                              onClick={() => {
                                setSelected(new Set([p.id]));
                                setBulkConfirmText("");
                                setConfirmBulkPurge(true);
                              }}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              aria-label={t("edit", { name: p.titleEn })}
                              onClick={() => open(p)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              aria-label={t("archive", { name: p.titleEn })}
                              onClick={() => act(() => archiveProductAction({ productId: p.id }))}
                            >
                              <Archive className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        </div>
      )}

      <AlertDialog
        open={confirmBulkPurge}
        onOpenChange={(o) => {
          setConfirmBulkPurge(o);
          if (!o) setBulkConfirmText("");
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("bulkPurgeDialog.title", { count: selectedArchived.length })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("bulkPurgeDialog.description", {
                list: selectedArchived.map((p) => p.titleEn).join(", "),
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="products-bulk-confirm" className="text-xs">
              {t.rich("bulkPurgeDialog.typeDeleteToConfirm", {
                b: (chunks) => <span className="font-mono font-semibold">{chunks}</span>,
              })}
            </Label>
            <Input
              id="products-bulk-confirm"
              value={bulkConfirmText}
              onChange={(e) => setBulkConfirmText(e.target.value)}
              autoComplete="off"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("bulkPurgeDialog.keepThem")}</AlertDialogCancel>
            <AlertDialogAction
              disabled={bulkConfirmText.trim() !== "DELETE"}
              onClick={() => {
                setConfirmBulkPurge(false);
                bulk(
                  selectedArchived.map((p) => p.id),
                  (id) => purgeFromTrashAction({ entity: "product", id }),
                  t("deletedForGood"),
                );
              }}
            >
              {t("bulkPurgeDialog.confirmButton")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={editing !== null} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {current ? t("editDialog.editTitle") : t("editDialog.newTitle")}
            </DialogTitle>
            <DialogDescription>
              {t("editDialog.descriptionPrices")}
              {!current && t("editDialog.descriptionSaveFirst")}
            </DialogDescription>
          </DialogHeader>

          {/*
            Uncontrolled, keyed to the row being edited.

            It was controlled, and the tab kept snapping back to Details: every
            keystroke in the form updates the preview draft, and the re-render
            that follows was resetting the controlled value. A key that changes
            only when a different product is opened gives the reset behaviour
            that was wanted without a piece of state to fight with.
          */}
          <Tabs defaultValue="details" key={current?.id ?? "new"}>
            <TabsList className="w-full">
              <TabsTrigger value="details">{t("editDialog.tabs.details")}</TabsTrigger>
              {/*
                A spec belongs to a product and a product needs an id, so these
                three are disabled until the row exists. Disabled with a reason
                in the description beats a tab that opens onto a broken form.
              */}
              <TabsTrigger value="media" disabled={!current}>
                {t("editDialog.tabs.media")}
              </TabsTrigger>
              <TabsTrigger value="specs" disabled={!current}>
                {t("editDialog.tabs.specs")}
              </TabsTrigger>
              <TabsTrigger value="offers" disabled={!current}>
                {t("editDialog.tabs.offers")}
              </TabsTrigger>
              <TabsTrigger value="colors" disabled={!current}>
                {t("editDialog.tabs.colors")}
              </TabsTrigger>
              <TabsTrigger value="promos" disabled={!current}>
                {t("editDialog.tabs.promos")}
              </TabsTrigger>
              <TabsTrigger value="preview">{t("editDialog.tabs.preview")}</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="mt-4">
          <form onSubmit={submit} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="slug">{t("editDialog.slugLabel")}</Label>
                <Input
                  id="slug"
                  name="slug"
                  required
                  pattern="[a-z0-9\-]+"
                  defaultValue={current?.slug ?? ""}
                  placeholder={t("editDialog.slugPlaceholder")}
                  className="figures"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="category">{t("editDialog.categoryLabel")}</Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder={t("editDialog.categoryPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    {categories
                      .filter((c) => !c.archivedAt || c.id === current?.categoryId)
                      .map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.labelEn}
                          {c.archivedAt ? t("editDialog.categoryArchivedSuffix") : ""}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="sku">{t("editDialog.skuLabel")}</Label>
              <Input
                id="sku"
                name="sku"
                defaultValue={current?.sku ?? ""}
                placeholder={t("editDialog.skuPlaceholder")}
                className="figures"
              />
            </div>

            <div onInput={(e) => {
              const target = e.target as HTMLInputElement;
              if (target.name === "titleEn") setDraft((d) => ({ ...d, title: target.value }));
              if (target.name === "descriptionEn")
                setDraft((d) => ({ ...d, description: target.value }));
            }}>
            <TriLingualField
              name="title"
              label={t("editDialog.titleFieldLabel")}
              values={
                current ? { En: current.titleEn, Ar: current.titleAr, Fr: current.titleFr } : undefined
              }
            />

            <TriLingualField
              name="description"
              label={t("editDialog.descriptionFieldLabel")}
              multiline
              values={
                current
                  ? {
                      En: current.descriptionEn,
                      Ar: current.descriptionAr,
                      Fr: current.descriptionFr,
                    }
                  : undefined
              }
            />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="price">{t("editDialog.priceLabel")}</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  min={0}
                  step="1"
                  required
                  defaultValue={current ? toDinars(current.priceDzd) : ""}
                  className="figures"
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, price: Number(e.target.value) || 0 }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="compareAt">{t("editDialog.compareAtLabel")}</Label>
                <Input
                  id="compareAt"
                  name="compareAt"
                  type="number"
                  min={0}
                  step="1"
                  defaultValue={current?.compareAtDzd ? toDinars(current.compareAtDzd) : ""}
                  placeholder={tc("optional")}
                  className="figures"
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, compareAt: Number(e.target.value) || 0 }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="stockCount">{t("editDialog.stockLabel")}</Label>
                <Input
                  id="stockCount"
                  name="stockCount"
                  type="number"
                  min={0}
                  required
                  defaultValue={current?.stockCount ?? 0}
                  className="figures"
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, stockCount: Number(e.target.value) || 0 }))
                  }
                />
              </div>
            </div>

            <div className="space-y-3 rounded-md border border-border p-3">
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  name="containsAccessCode"
                  checked={hasCard}
                  onChange={(e) => setHasCard(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-[oklch(0.588_0.226_27.5)]"
                />
                <span>
                  <span className="block text-sm font-medium">{t("editDialog.hasCardTitle")}</span>
                  <span className="block text-xs text-muted-foreground">
                    {t("editDialog.hasCardHint")}
                  </span>
                </span>
              </label>

              {hasCard && (
                <div className="space-y-1.5 ps-7">
                  <Label htmlFor="accessPackage">{t("editDialog.cardOpensLabel")}</Label>
                  <Select value={packageId} onValueChange={setPackageId}>
                    <SelectTrigger id="accessPackage">
                      <SelectValue placeholder={t("editDialog.cardOpensPlaceholder")} />
                    </SelectTrigger>
                    <SelectContent>
                      {packages.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {t("editDialog.cardOpensHint")}
                  </p>
                </div>
              )}
            </div>

            <label className="flex items-start gap-3 rounded-md border border-border p-3">
              <input
                type="checkbox"
                name="isFeatured"
                checked={draft.isFeatured}
                onChange={(e) => setDraft((d) => ({ ...d, isFeatured: e.target.checked }))}
                className="mt-0.5 h-4 w-4 accent-[oklch(0.588_0.226_27.5)]"
              />
              <span>
                <span className="block text-sm font-medium">{t("editDialog.featuredTitle")}</span>
                <span className="block text-xs text-muted-foreground">
                  {t("editDialog.featuredHint")}
                </span>
              </span>
            </label>

            <div className="space-y-1.5">
              <Label htmlFor="images">{t("editDialog.imagesLabel")}</Label>
              <Input id="images" name="images" type="file" accept="image/*" multiple />
              <p className="text-xs text-muted-foreground">{t("editDialog.imagesHint")}</p>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditing(null)}>
                {tc("cancel")}
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                {tc("save")}
              </Button>
            </DialogFooter>
          </form>
            </TabsContent>

            <TabsContent value="media" className="mt-4">
              {current && <ProductGallery productId={current.id} images={current.images} />}
            </TabsContent>

            <TabsContent value="specs" className="mt-4">
              {current && (
                <ProductSpecsEditor productId={current.id} initial={current.specs} />
              )}
            </TabsContent>

            <TabsContent value="offers" className="mt-4">
              {current && (
                <ProductOffersEditor
                  productId={current.id}
                  priceDzd={current.priceDzd}
                  initial={current.offers}
                />
              )}
            </TabsContent>

            <TabsContent value="colors" className="mt-4">
              {current && (
                <ProductColorsEditor productId={current.id} colors={current.colors} />
              )}
            </TabsContent>

            <TabsContent value="promos" className="mt-4">
              {current && (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground">
                    {t("editDialog.promosReadOnly")}{" "}
                    <Link href="/admin/promo-codes" className="underline underline-offset-4">
                      {t("editDialog.promosLink")}
                    </Link>
                    .
                  </p>
                  {current.activePromoCodes.length === 0 ? (
                    <p className="rounded-md border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground">
                      {t("editDialog.promosNone")}
                    </p>
                  ) : (
                    <ul className="divide-y divide-border rounded-lg border border-border">
                      {current.activePromoCodes.map((promo, i) => (
                        <li
                          key={`${promo.code}-${i}`}
                          className="flex items-center justify-between px-3 py-2.5"
                        >
                          <span className="figures text-sm font-medium">{promo.code}</span>
                          <span className="text-xs text-muted-foreground">
                            {promo.via === "product"
                              ? t("editDialog.promosViaProduct")
                              : promo.via === "category"
                                ? t("editDialog.promosViaCategory")
                                : t("editDialog.promosViaProducts")}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="preview" className="mt-4">
              <ProductPreview
                title={draft.title}
                description={draft.description}
                priceDzd={toCentimes(draft.price)}
                compareAtDzd={draft.compareAt ? toCentimes(draft.compareAt) : null}
                stockCount={draft.stockCount}
                imagePath={current?.images[0]?.path ?? null}
                containsAccessCode={hasCard}
                isFeatured={draft.isFeatured}
              />
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
}
