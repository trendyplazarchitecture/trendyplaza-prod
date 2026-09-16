"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Archive, Loader2, Pencil, Plus, RotateCcw, Trash2, X as XIcon } from "lucide-react";
import { toast } from "sonner";

import {
  archiveProductColorAction,
  deleteProductColorAction,
  restoreProductColorAction,
  saveProductColorAction,
  type ActionResult,
} from "@/server/actions/products";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { TriLingualField } from "./TriLingual";
import { cn } from "@/lib/utils";

/**
 * A controlled switch with a hidden field, rather than trusting the
 * uncontrolled `name` prop to bubble a real form value — `formData.get`
 * needs a plain input in the tree, not a Radix button.
 */
function VisibleField({ id, defaultChecked }: { id: string; defaultChecked: boolean }) {
  const t = useTranslations("admin.productColors");
  const [checked, setChecked] = useState(defaultChecked);
  return (
    <div className="flex items-end justify-between gap-2 pb-1">
      <Label className="text-xs" htmlFor={id}>
        {t("visible")}
      </Label>
      <input type="hidden" name="isVisible" value={checked ? "true" : "false"} />
      {/* dir="ltr": a toggle's thumb travel is not text direction. */}
      <Switch dir="ltr" id={id} checked={checked} onCheckedChange={setChecked} />
    </div>
  );
}

/**
 * A round swatch button that opens the browser's native color picker —
 * cleaner than typing a hex string, and the value shown is exactly what gets
 * saved. "No swatch" is a real, distinct state (some colors, like "Natural
 * wood", are not literal colors), so picking one is opt-in rather than
 * defaulting to black.
 */
function HexPickerField({ id, defaultValue }: { id: string; defaultValue: string | null }) {
  const t = useTranslations("admin.productColors");
  const [hex, setHex] = useState(defaultValue ?? "");

  return (
    <div className="space-y-1">
      <Label className="text-xs" htmlFor={id}>
        {t("swatch")}
      </Label>
      <div className="flex h-8 items-center gap-2">
        <span className="relative inline-flex h-7 w-7 shrink-0">
          <input
            type="color"
            id={id}
            value={hex || "#94a3b8"}
            onChange={(e) => setHex(e.target.value)}
            aria-label={t("pickSwatchColor")}
            className="h-7 w-7 cursor-pointer appearance-none rounded-full border border-border bg-transparent p-0 [&::-webkit-color-swatch-wrapper]:rounded-full [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-full [&::-webkit-color-swatch]:border-none"
          />
          {!hex && (
            <span className="pointer-events-none absolute inset-0 rounded-full border border-dashed border-muted-foreground/40" />
          )}
        </span>
        <input type="hidden" name="hex" value={hex} />
        {hex ? (
          <>
            <span className="figures text-xs text-muted-foreground uppercase">{hex}</span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground"
              aria-label={t("clearSwatch")}
              onClick={() => setHex("")}
            >
              <XIcon className="h-3 w-3" />
            </Button>
          </>
        ) : (
          <span className="text-xs text-muted-foreground">{t("noSwatch")}</span>
        )}
      </div>
    </div>
  );
}

export type ColorRow = {
  id: string;
  nameEn: string;
  nameFr: string | null;
  nameAr: string | null;
  hex: string | null;
  stockCount: number;
  isVisible: boolean;
  archivedAt: Date | null;
};

/**
 * Color options for one product, edited freely: add, rename, restock,
 * archive, or delete (only once nothing has ordered it — same guard shape as
 * a category). Once any visible color exists, the storefront requires a
 * buyer to pick one and stock moves off the color row, not the product row.
 */
export function ProductColorsEditor({
  productId,
  colors,
}: {
  productId: string;
  colors: ColorRow[];
}) {
  const t = useTranslations("admin.productColors");
  const tc = useTranslations("admin.common");
  const router = useRouter();
  const [editing, setEditing] = useState<ColorRow | "new" | null>(null);
  const [isPending, startTransition] = useTransition();

  function act(fn: () => Promise<ActionResult>) {
    startTransition(async () => {
      try {
        const result = await fn();
        if (result.ok) {
          toast.success(result.message);
          setEditing(null);
          router.refresh();
        } else {
          toast.error(result.message);
        }
      } catch {
        toast.error(t("genericError"));
      }
    });
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    form.set("productId", productId);
    if (editing && editing !== "new") form.set("id", editing.id);
    act(() => saveProductColorAction(form));
  }

  const current = editing !== "new" ? editing : null;

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">{t("intro")}</p>

      {colors.length === 0 && editing !== "new" ? (
        <p className="rounded-md border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground">
          {t("emptyHint")}
        </p>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border">
          {colors.map((c) =>
            editing !== "new" && current?.id === c.id ? (
              <li key={c.id} className="p-3">
                <form onSubmit={submit} className="space-y-3">
                  <TriLingualField
                    name="name"
                    label={t("nameFieldLabel")}
                    values={{ En: c.nameEn, Ar: c.nameAr, Fr: c.nameFr }}
                  />
                  <div className="grid grid-cols-3 gap-2">
                    <HexPickerField id={`hex-${c.id}`} defaultValue={c.hex} />
                    <div className="space-y-1">
                      <Label className="text-xs">{t("stockLabel")}</Label>
                      <Input
                        type="number"
                        name="stockCount"
                        min={0}
                        defaultValue={c.stockCount}
                        className="figures ui-dense h-8 text-sm"
                      />
                    </div>
                    <VisibleField id={`visible-${c.id}`} defaultChecked={c.isVisible} />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" size="sm" variant="outline" onClick={() => setEditing(null)}>
                      {tc("cancel")}
                    </Button>
                    <Button type="submit" size="sm" disabled={isPending}>
                      {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />}
                      {tc("save")}
                    </Button>
                  </div>
                </form>
              </li>
            ) : (
              <li
                key={c.id}
                className={cn(
                  "flex items-center justify-between gap-3 px-3 py-2.5",
                  c.archivedAt && "opacity-60",
                )}
              >
                <div className="flex min-w-0 items-center gap-2">
                  {c.hex && (
                    <span
                      className="h-4 w-4 shrink-0 rounded-full border border-border"
                      style={{ backgroundColor: c.hex }}
                      aria-hidden="true"
                    />
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{c.nameEn}</p>
                    <p className="figures truncate text-xs text-muted-foreground">
                      {t("inStock", { count: c.stockCount })}
                      {!c.isVisible && !c.archivedAt && <span className="ms-2">· {t("hidden")}</span>}
                      {c.archivedAt && <span className="ms-2">· {t("archivedSuffix")}</span>}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {c.archivedAt ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      aria-label={t("restore", { name: c.nameEn })}
                      disabled={isPending}
                      onClick={() => act(() => restoreProductColorAction({ colorId: c.id }))}
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        aria-label={t("edit", { name: c.nameEn })}
                        onClick={() => setEditing(c)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        aria-label={t("archive", { name: c.nameEn })}
                        disabled={isPending}
                        onClick={() => act(() => archiveProductColorAction({ colorId: c.id }))}
                      >
                        <Archive className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-primary-press"
                    aria-label={t("delete", { name: c.nameEn })}
                    disabled={isPending}
                    onClick={() => {
                      if (confirm(t("deleteConfirm", { name: c.nameEn }))) {
                        act(() => deleteProductColorAction({ colorId: c.id }));
                      }
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </li>
            ),
          )}
        </ul>
      )}

      {editing === "new" ? (
        <form onSubmit={submit} className="space-y-3 rounded-lg border border-border p-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">{t("newHeading")}</p>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setEditing(null)}
            >
              <XIcon className="h-3.5 w-3.5" />
            </Button>
          </div>
          <TriLingualField name="name" label={t("nameFieldLabel")} />
          <div className="grid grid-cols-3 gap-2">
            <HexPickerField id="hex-new" defaultValue={null} />
            <div className="space-y-1">
              <Label className="text-xs">{t("stockLabel")}</Label>
              <Input
                type="number"
                name="stockCount"
                min={0}
                defaultValue={0}
                className="figures ui-dense h-8 text-sm"
              />
            </div>
            <VisibleField id="visible-new" defaultChecked />
          </div>
          <div className="flex justify-end">
            <Button type="submit" size="sm" disabled={isPending}>
              {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />}
              {t("add")}
            </Button>
          </div>
        </form>
      ) : (
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="gap-1.5"
          onClick={() => setEditing("new")}
        >
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          {t("newButton")}
        </Button>
      )}
    </div>
  );
}
