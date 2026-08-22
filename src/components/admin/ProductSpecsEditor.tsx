"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowDown, ArrowUp, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { saveProductSpecsAction } from "@/server/actions/products";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type SpecRow = {
  labelEn: string;
  labelFr: string | null;
  labelAr: string | null;
  valueEn: string;
  valueFr: string | null;
  valueAr: string | null;
};

const EMPTY: SpecRow = {
  labelEn: "",
  labelFr: null,
  labelAr: null,
  valueEn: "",
  valueFr: null,
  valueAr: null,
};

/**
 * The spec table, edited as a list.
 *
 * Saved as a whole set rather than row by row: the client rearranges four rows
 * and presses save once, and a per-row action would mean four writes, four
 * toasts, and a half-saved table if the third one fails.
 *
 * French and Arabic are visibly optional. `_en` is the authoring language and
 * `pick()` falls back, so a spec entered in English alone renders in all three
 * locales rather than as a blank line. The placeholder says so, because the
 * previous form looked like three mandatory fields and was not.
 */
export function ProductSpecsEditor({
  productId,
  initial,
}: {
  productId: string;
  initial: SpecRow[];
}) {
  const t = useTranslations("admin.productSpecs");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [rows, setRows] = useState<SpecRow[]>(initial);

  function update(index: number, patch: Partial<SpecRow>) {
    setRows(rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function move(index: number, by: -1 | 1) {
    const next = [...rows];
    const target = index + by;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setRows(next);
  }

  function save() {
    const cleaned = rows.filter((r) => r.labelEn.trim() && r.valueEn.trim());
    startTransition(async () => {
      const result = await saveProductSpecsAction({ productId, rows: cleaned });
      if (result.ok) {
        setRows(cleaned);
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">{t("intro")}</p>

      {rows.length === 0 ? (
        <p className="rounded-md border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground">
          {t("emptyHint")}
        </p>
      ) : (
        <ul className="space-y-3">
          {rows.map((row, index) => (
            <li key={index} className="rounded-md border border-border p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="ui-dense text-[11px] font-semibold tracking-[0.1em] text-muted-foreground uppercase">
                  {t("rowNumber", { number: index + 1 })}
                </span>
                <div className="flex">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    disabled={index === 0}
                    aria-label={t("moveUp", { number: index + 1 })}
                    onClick={() => move(index, -1)}
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    disabled={index === rows.length - 1}
                    aria-label={t("moveDown", { number: index + 1 })}
                    onClick={() => move(index, 1)}
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-primary-press"
                    aria-label={t("removeRow", { number: index + 1 })}
                    onClick={() => setRows(rows.filter((_, i) => i !== index))}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-xs">{t("labelEnglish")}</Label>
                  <Input
                    value={row.labelEn}
                    placeholder={t("labelPlaceholderExample")}
                    onChange={(e) => update(index, { labelEn: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{t("valueEnglish")}</Label>
                  <Input
                    value={row.valueEn}
                    placeholder={t("valuePlaceholderExample")}
                    onChange={(e) => update(index, { valueEn: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">{t("labelFrench")}</Label>
                  <Input
                    value={row.labelFr ?? ""}
                    placeholder={t("optionalPlaceholder")}
                    onChange={(e) => update(index, { labelFr: e.target.value || null })}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">{t("valueFrench")}</Label>
                  <Input
                    value={row.valueFr ?? ""}
                    placeholder={t("optionalPlaceholder")}
                    onChange={(e) => update(index, { valueFr: e.target.value || null })}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">{t("labelArabic")}</Label>
                  <Input
                    dir="rtl"
                    value={row.labelAr ?? ""}
                    placeholder={t("optionalPlaceholder")}
                    onChange={(e) => update(index, { labelAr: e.target.value || null })}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">{t("valueArabic")}</Label>
                  <Input
                    dir="rtl"
                    value={row.valueAr ?? ""}
                    placeholder={t("optionalPlaceholder")}
                    onChange={(e) => update(index, { valueAr: e.target.value || null })}
                  />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => setRows([...rows, { ...EMPTY }])}
        >
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          {t("addRow")}
        </Button>
        <Button type="button" size="sm" disabled={isPending} onClick={save}>
          {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />}
          {t("saveSpecs")}
        </Button>
      </div>
    </div>
  );
}
