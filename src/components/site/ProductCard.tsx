"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ShoppingBag } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Link } from "../../../i18n/navigation";
import { AddToCartIcon } from "@/components/site/AddToCart";
import { Badge } from "@/components/ui/badge";
import type { CatalogueProduct } from "@/server/catalogue";
import { formatDzd } from "@/lib/money";
import { productImageUrl } from "@/lib/media";
import { scaleIn } from "@/lib/motion";

export function ProductCard({ product }: { product: CatalogueProduct }) {
  const t = useTranslations("products");
  const tAction = useTranslations("actions");
  const locale = useLocale() as "en" | "ar" | "fr";
  const shouldReduceMotion = useReducedMotion();

  const discount = product.compareAtDzd
    ? Math.round(((product.compareAtDzd - product.priceDzd) / product.compareAtDzd) * 100)
    : null;

  const image = productImageUrl(product.image?.path);

  return (
    <motion.article variants={shouldReduceMotion ? {} : scaleIn} className="group relative flex flex-col">
      <Link
        href={`/products/${product.slug}`}
        className="block overflow-hidden rounded-xl border border-border bg-paper transition-all duration-300 group-hover:border-primary/20 group-hover:shadow-lg group-hover:shadow-primary/5"
      >
        <div className="relative aspect-square overflow-hidden">
          {image ? (
            <img
              src={image}
              alt={product.image?.alt ?? product.title}
              width={600}
              height={600}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="h-full w-full bg-paper" aria-hidden="true" />
          )}

          {/*
            Slides up on hover. Purely a pointer affordance: on touch the whole
            card is the tap target, so nothing is lost by never seeing it.
          */}
          <div
            aria-hidden="true"
            className="absolute inset-x-0 bottom-0 flex translate-y-full items-center justify-center bg-gradient-to-t from-foreground/80 via-foreground/40 to-transparent p-4 transition-transform duration-300 group-hover:translate-y-0 motion-reduce:transition-none"
          >
            <span className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground">
              <ShoppingBag className="h-3.5 w-3.5" />
              {tAction("viewProduct")}
            </span>
          </div>

          <div className="absolute start-2 top-2 flex flex-col items-start gap-1.5">
            {discount !== null && discount > 0 && (
              <Badge className="bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
                <bdi dir="ltr">-{discount}%</bdi>
              </Badge>
            )}
            {product.containsAccessCode && (
              <Badge variant="secondary" className="px-2 py-0.5 text-[10px] font-medium">
                {t("cardIncluded")}
              </Badge>
            )}
            {!product.inStock && (
              <Badge variant="outline" className="bg-background px-2 py-0.5 text-[10px] font-medium">
                {t("outOfStock")}
              </Badge>
            )}
          </div>
        </div>

        <div className="p-4">
          <h3 className="line-clamp-2 text-sm leading-tight font-semibold">{product.title}</h3>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-base font-bold text-foreground">
              {formatDzd(product.priceDzd, locale === "en" ? "fr" : locale)}
            </span>
            {product.compareAtDzd && (
              <span className="text-xs text-muted-foreground line-through">
                {formatDzd(product.compareAtDzd, locale === "en" ? "fr" : locale)}
              </span>
            )}
          </div>
        </div>
      </Link>

      {/*
        A sibling of the link, never a child of it: a button inside an anchor
        is invalid markup and a keyboard user ends up with one focus stop that
        does two things. Always visible on touch, revealed on hover on a
        pointer device, and it stays visible while it has focus.
      */}
      {product.inStock && (
        <div className="absolute end-2 top-2 transition-opacity duration-300 focus-within:opacity-100 md:opacity-0 md:group-hover:opacity-100">
          <AddToCartIcon productId={product.id} />
        </div>
      )}
    </motion.article>
  );
}
