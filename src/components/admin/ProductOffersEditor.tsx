"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { saveProductOffersAction } from "@/server/actions/products";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDzd, toCentimes, toDinars } from "@/lib/money";
import { offerLadder } from "@/lib/offers";

export type OfferRow = {
  minQuantity: number;
  kind: "percent" | "unit_price";
  /** Percent points, or a unit price in dinars as typed. */
  value: number;
};

/**
 * Quantity offers: buy two, buy three, buy the class set.
 *
 * The preview under the rows is the point. A client typing "10" into a percent
 * field is not thinking in centimes, and the question they actually have is
 * "what does a student pay for three". So it is answered on screen, using the
 * same `offerLadder` the product page calls, before anything is saved.
 */
export function ProductOffersEditor({
  productId,
  priceDzd,
  initial,
}: {
  productId: string;
  priceDzd: number;
  initial: OfferRow[];
}) {
  const t = useTranslations("admin.productOffers");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [rows, setRows] = useState<OfferRow[]>(initial);

  function update(index: number, patch: Partial<OfferRow>) {
    setRows(rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function save() {
    startTransition(async () => {
      const result = await saveProductOffersAction({ productId, rows });
      if (result.ok) {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  // The same function the storefront uses, fed the values as typed. Dinars go
  // to centimes here exactly as the action does it, so the number on screen is
  // the number that will be saved.
  const preview = offerLadder(
    priceDzd,
    rows.map((r) => ({
      minQuantity: r.minQuantity,
      kind: r.kind,
      value: r.kind === "percent" ? r.value : toCentimes(r.value),
    })),
  );

  const nextQuantity = rows.length === 0 ? 2 : Math.max(...rows.map((r) => r.minQuantity)) + 1;

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        {t.rich("intro", { em: (chunks) => <em>{chunks}</em>, price: formatDzd(priceDzd) })}
      </p>

      {rows.length === 0 ? (
        <p className="rounded-md border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground">
          {t("emptyHint")}
        </p>
      ) : (
        <ul className="space-y-3">
          {rows.map((row, index) => (
            <li
              key={index}
              className="grid items-end gap-2 rounded-md border border-border p-3 sm:grid-cols-[7rem_10rem_1fr_auto]"
            >
              <div className="space-y-1">
                <Label className="text-xs">{t("fromLabel")}</Label>
                <Input
                  type="number"
                  min={2}
                  max={100}
                  className="figures"
                  value={row.minQuantity}
                  onChange={(e) =>
                    update(index, { minQuantity: Number(e.target.value) || 2 })
                  }
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">{t("offerLabel")}</Label>
                <Select
                  value={row.kind}
                  onValueChange={(kind) =>
                    update(index, { kind: kind as OfferRow["kind"], value: 0 })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percent">{t("percentOff")}</SelectItem>
                    <SelectItem value="unit_price">{t("priceEach")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">
                  {row.kind === "percent" ? t("percentLabel") : t("eachDaLabel")}
                </Label>
                <Input
                  type="number"
                  min={0}
                  max={row.kind === "percent" ? 100 : undefined}
                  className="figures"
                  value={row.value}
                  onChange={(e) => update(index, { value: Number(e.target.value) || 0 })}
                />
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-muted-foreground hover:text-primary-press"
                aria-label={t("removeOffer", { quantity: row.minQuantity })}
                onClick={() => setRows(rows.filter((_, i) => i !== index))}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      {preview.length > 0 && (
        <div className="overflow-hidden rounded-md border border-rule">
          <p className="ui-dense border-b border-rule bg-paper px-3 py-1.5 text-[11px] font-semibold tracking-[0.1em] text-muted-foreground uppercase">
            {t("whatTheBuyerSees")}
          </p>
          <ul className="divide-y divide-border">
            {preview.map((tier) => (
              <li
                key={tier.minQuantity}
                className="figures flex items-baseline justify-between gap-4 px-3 py-2 text-sm"
              >
                <span>{t("orMore", { quantity: tier.minQuantity })}</span>
                <span>
                  <strong>{formatDzd(tier.unitDzd)}</strong> {t("each")} &middot;{" "}
                  {t("totalForQuantity", {
                    total: formatDzd(tier.totalDzd),
                    quantity: tier.minQuantity,
                  })}{" "}
                  &middot; {t("saves", { amount: formatDzd(tier.savingDzd) })}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5"
          disabled={nextQuantity > 100}
          onClick={() =>
            setRows([
              ...rows,
              {
                minQuantity: nextQuantity,
                kind: "unit_price",
                // Opens at 10% under list, so the row is a working offer the
                // moment it appears rather than one that saves nothing.
                value: Math.round(toDinars(priceDzd) * 0.9),
              },
            ])
          }
        >
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          {t("addTier")}
        </Button>
        <Button type="button" size="sm" disabled={isPending} onClick={save}>
          {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />}
          {t("saveOffers")}
        </Button>
      </div>
    </div>
  );
}
