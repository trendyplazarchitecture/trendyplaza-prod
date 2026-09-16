"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { formatDzd } from "@/lib/money";
import { productImageUrl } from "@/lib/media";
import { cn } from "@/lib/utils";

/**
 * What the shop will show, drawn from the form as it is being typed.
 *
 * Not a screenshot and not an iframe of the real page: it is the card and the
 * heading block at the two sizes that decide whether a product reads well, so
 * the client can see a title overflow or a missing image before saving rather
 * than by visiting the shop afterwards.
 *
 * Deliberately not pixel-identical to the storefront. A preview that claims to
 * be exact and is not is worse than one that is honestly a sketch.
 */
export function ProductPreview({
  title,
  description,
  priceDzd,
  compareAtDzd,
  stockCount,
  imagePath,
  containsAccessCode,
  isFeatured,
}: {
  title: string;
  description: string;
  priceDzd: number;
  compareAtDzd: number | null;
  stockCount: number;
  imagePath: string | null;
  containsAccessCode: boolean;
  isFeatured: boolean;
}) {
  const t = useTranslations("admin.productPreview");
  const url = productImageUrl(imagePath);
  const off =
    compareAtDzd && compareAtDzd > priceDzd
      ? Math.round(((compareAtDzd - priceDzd) / compareAtDzd) * 100)
      : null;

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">{t("intro")}</p>

      <div className="grid gap-6 sm:grid-cols-[minmax(0,14rem)_1fr]">
        {/* The card, as it sits in the catalogue grid. */}
        <div>
          <span className="ui-dense mb-2 block text-[11px] font-semibold tracking-[0.1em] text-muted-foreground uppercase">
            {t("onTheShopGrid")}
          </span>
          <div className="overflow-hidden rounded-lg border border-border bg-card">
            <div className="relative aspect-square bg-paper">
              {url ? (
                <img src={url} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="flex h-full items-center justify-center text-xs text-muted-foreground">
                  {t("noImage")}
                </span>
              )}
              <div className="absolute top-2 start-2 flex flex-col items-start gap-1">
                {off !== null && (
                  <span className="figures rounded bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
                    -{off}%
                  </span>
                )}
                {containsAccessCode && (
                  <span className="ui-dense rounded bg-foreground px-1.5 py-0.5 text-[10px] font-semibold text-background">
                    {t("accessCardIncluded")}
                  </span>
                )}
              </div>
            </div>
            <div className="p-3">
              <p className="line-clamp-2 text-sm font-semibold">
                {title || t("untitledProduct")}
              </p>
              <p className="figures mt-1.5 flex items-baseline gap-2">
                <span className="font-bold">{formatDzd(priceDzd)}</span>
                {compareAtDzd ? (
                  <span className="text-xs text-muted-foreground line-through">
                    {formatDzd(compareAtDzd)}
                  </span>
                ) : null}
              </p>
            </div>
          </div>
        </div>

        {/* The heading block on the product page. */}
        <div>
          <span className="ui-dense mb-2 block text-[11px] font-semibold tracking-[0.1em] text-muted-foreground uppercase">
            {t("onTheProductPage")}
          </span>
          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="text-xl font-extrabold">{title || t("untitledProduct")}</h3>
            <p className="mt-2 line-clamp-4 text-sm text-muted-foreground">
              {description || t("noDescriptionYet")}
            </p>
            <p className="figures mt-4 flex flex-wrap items-baseline gap-3">
              <span className="text-2xl font-extrabold">{formatDzd(priceDzd)}</span>
              {compareAtDzd ? (
                <span className="text-sm text-muted-foreground line-through">
                  {formatDzd(compareAtDzd)}
                </span>
              ) : null}
              <span
                className={cn(
                  "text-xs font-medium",
                  stockCount === 0
                    ? "text-primary-press"
                    : stockCount <= 5
                      ? "text-amber-700"
                      : "text-muted-foreground",
                )}
              >
                {stockCount === 0
                  ? t("outOfStock")
                  : stockCount <= 5
                    ? t("onlyLeft", { count: stockCount })
                    : t("inStock")}
              </span>
            </p>
            {isFeatured && (
              <Badge variant="secondary" className="mt-4">
                {t("shownOnHomePage")}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
