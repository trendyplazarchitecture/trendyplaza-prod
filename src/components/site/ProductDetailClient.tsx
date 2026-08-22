"use client";

import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  IdCard,
  Maximize2,
  ShoppingBag,
  Truck,
  X,
} from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";

import { Link } from "../../../i18n/navigation";
import { AddToCartButton } from "@/components/site/AddToCart";
import { ProductCard } from "@/components/site/ProductCard";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { CatalogueProduct } from "@/server/catalogue";
import { formatDzd } from "@/lib/money";
import { productImageUrl } from "@/lib/media";

export type ProductDetail = {
  id: string;
  slug: string;
  title: string;
  description: string;
  priceDzd: number;
  compareAtDzd: number | null;
  inStock: boolean;
  stockCount: number;
  containsAccessCode: boolean;
  unlocks: string | null;
  category: string;
  sku?: string | null;
  gallery: { path: string; alt: string }[];
  specs?: { label: string; value: string }[];
  /** Priced on the server, so the page cannot advertise a rate the checkout refuses. */
  offers?: { minQuantity: number; unitDzd: number; totalDzd: number; savingDzd: number }[];
  /** Visible, unarchived colors only. Present and non-empty means a buyer must pick one. */
  colors?: { id: string; name: string; hex: string | null; inStock: boolean; stockCount: number }[];
};

export function ProductDetailClient({
  product,
  related,
}: {
  product: ProductDetail;
  related: CatalogueProduct[];
}) {
  const t = useTranslations();
  const locale = useLocale() as "en" | "ar" | "fr";
  const priceLocale = locale === "en" ? "fr" : locale;
  const isRtl = locale === "ar";
  const [active, setActive] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  const colors = product.colors ?? [];
  const [selectedColorId, setSelectedColorId] = useState<string | null>(colors[0]?.id ?? null);
  const selectedColor = colors.find((c) => c.id === selectedColorId) ?? null;
  // A product sells as a whole or by color, never both: once any visible
  // color exists, that is what governs stock and what the buyer must pick.
  const sellsByColor = colors.length > 0;
  const canAddToCart = sellsByColor
    ? selectedColor !== null && selectedColor.inStock
    : product.inStock;
  const effectiveStockCount = sellsByColor ? (selectedColor?.stockCount ?? 0) : product.stockCount;

  const totalShots = product.gallery.length;
  const shot = product.gallery[active] ?? product.gallery[0];
  const shotUrl = productImageUrl(shot?.path);

  const nextImage = useCallback(() => {
    if (totalShots <= 1) return;
    setActive((curr) => (curr + 1) % totalShots);
  }, [totalShots]);

  const prevImage = useCallback(() => {
    if (totalShots <= 1) return;
    setActive((curr) => (curr - 1 + totalShots) % totalShots);
  }, [totalShots]);

  // Keyboard navigation for modal & page
  useEffect(() => {
    if (!isModalOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsModalOpen(false);
      } else if (e.key === "ArrowRight") {
        if (isRtl) prevImage();
        else nextImage();
      } else if (e.key === "ArrowLeft") {
        if (isRtl) nextImage();
        else prevImage();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isModalOpen, nextImage, prevImage, isRtl]);

  return (
    <div className="w-full max-w-full overflow-x-hidden">
      <div className="mx-auto w-full max-w-[1536px] px-4 pt-6 sm:px-6 lg:px-12">
        <Breadcrumb>
          <BreadcrumbList className="flex flex-wrap items-center gap-1.5 text-xs sm:text-sm text-muted-foreground">
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/">{t("nav.home")}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/catalogue">{t("catalogue.title")}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem className="min-w-0 truncate">
              <BreadcrumbPage className="truncate max-w-[140px] sm:max-w-xs">{product.title}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <section className="mx-auto w-full max-w-[1536px] px-4 py-6 sm:px-6 lg:px-12">
        <div className="grid gap-8 lg:gap-12 lg:grid-cols-2 w-full min-w-0">
          {/* 1:1 Interactive Image Gallery */}
          <div className="flex flex-col w-full min-w-0">
            <div className="group relative aspect-square w-full overflow-hidden rounded-2xl border border-border bg-paper shadow-sm">
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="h-full w-full cursor-zoom-in text-start focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-label={shot?.alt ?? product.title}
              >
                <AnimatePresence mode="wait">
                  <motion.img
                    key={shotUrl ?? "empty"}
                    src={shotUrl ?? undefined}
                    alt={shot?.alt ?? product.title}
                    width={1000}
                    height={1000}
                    decoding="async"
                    initial={shouldReduceMotion ? undefined : { opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={shouldReduceMotion ? undefined : { opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </AnimatePresence>
              </button>

              {/* Click to open badge / zoom affordance */}
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                aria-label="Open gallery fullscreen"
                className="absolute bottom-3 end-3 inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-background/85 px-3 py-1.5 text-xs font-semibold text-foreground shadow-sm backdrop-blur-md transition-all hover:bg-background hover:shadow-md md:opacity-0 md:group-hover:opacity-100 focus-visible:opacity-100 cursor-pointer"
              >
                <Maximize2 className="h-3.5 w-3.5" aria-hidden="true" />
              </button>

              {/* Image counter indicator */}
              {totalShots > 1 && (
                <span className="figures absolute top-3 start-3 rounded-md border border-border/50 bg-background/85 px-2.5 py-1 text-[11px] font-bold text-foreground backdrop-blur-md shadow-sm">
                  {active + 1} / {totalShots}
                </span>
              )}

              {/* Navigation arrows for quick cycling on page */}
              {totalShots > 1 && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isRtl) nextImage();
                      else prevImage();
                    }}
                    aria-label="Previous image"
                    className="absolute start-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full border border-border/60 bg-background/85 text-foreground shadow-md backdrop-blur-md transition-all hover:bg-background hover:scale-105 active:scale-95 md:opacity-0 md:group-hover:opacity-100 focus-visible:opacity-100 cursor-pointer"
                  >
                    <ChevronLeft className="h-4 w-4 rtl:-scale-x-100" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isRtl) prevImage();
                      else nextImage();
                    }}
                    aria-label="Next image"
                    className="absolute end-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full border border-border/60 bg-background/85 text-foreground shadow-md backdrop-blur-md transition-all hover:bg-background hover:scale-105 active:scale-95 md:opacity-0 md:group-hover:opacity-100 focus-visible:opacity-100 cursor-pointer"
                  >
                    <ChevronRight className="h-4 w-4 rtl:-scale-x-100" aria-hidden="true" />
                  </button>
                </>
              )}
            </div>

            {/* 1:1 Thumbnails */}
            {totalShots > 1 && (
              <ul className="mt-4 flex gap-2.5 sm:gap-3 overflow-x-auto pb-1 scrollbar-none max-w-full w-full">
                {product.gallery.map((image, i) => (
                  <li key={`${image.path}-${i}`} className="shrink-0">
                    <button
                      type="button"
                      onClick={() => setActive(i)}
                      aria-label={image.alt || `${product.title} ${i + 1}`}
                      aria-current={i === active}
                      className={`relative aspect-square h-14 w-14 sm:h-20 sm:w-20 overflow-hidden rounded-xl border transition-all cursor-pointer ${
                        i === active
                          ? "border-primary ring-2 ring-primary/30 shadow-sm scale-105"
                          : "border-border opacity-70 hover:opacity-100 hover:border-foreground/60"
                      }`}
                    >
                      <img
                        src={productImageUrl(image.path) ?? undefined}
                        alt=""
                        width={160}
                        height={160}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover"
                      />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Fullscreen Lightbox Modal */}
          <AnimatePresence>
            {isModalOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-black/92 p-4 text-white backdrop-blur-2xl sm:p-6 select-none"
                onClick={() => setIsModalOpen(false)}
              >
                {/* Modal Top Bar */}
                <div
                  className="flex w-full max-w-5xl items-center justify-between pt-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-sm sm:text-base font-bold text-white truncate max-w-xs sm:max-w-md">
                      {product.title}
                    </span>
                    {totalShots > 1 && (
                      <span className="figures shrink-0 rounded-full bg-white/15 px-3 py-0.5 text-xs font-bold text-white border border-white/20">
                        {active + 1} / {totalShots}
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    aria-label="Close fullscreen gallery"
                    className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition-all hover:bg-white/20 hover:scale-110 active:scale-95 cursor-pointer"
                  >
                    <X className="h-5 w-5" aria-hidden="true" />
                  </button>
                </div>

                {/* Main Lightbox Viewport - Large & Full Resolution */}
                <div
                  className="relative my-auto flex h-full max-h-[75vh] w-full max-w-5xl items-center justify-center p-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  {totalShots > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        if (isRtl) nextImage();
                        else prevImage();
                      }}
                      aria-label="Previous image"
                      className="absolute start-2 sm:start-4 z-20 flex h-12 w-12 items-center justify-center rounded-full border border-white/30 bg-black/60 text-white shadow-2xl backdrop-blur-md transition-all hover:bg-black/80 hover:scale-110 active:scale-95 cursor-pointer"
                    >
                      <ChevronLeft className="h-6 w-6 rtl:-scale-x-100" aria-hidden="true" />
                    </button>
                  )}

                  <div className="relative flex h-full max-h-[75vh] w-full items-center justify-center overflow-hidden">
                    <AnimatePresence mode="wait">
                      <motion.img
                        key={shotUrl ?? "empty-modal"}
                        src={shotUrl ?? undefined}
                        alt={shot?.alt ?? product.title}
                        width={1600}
                        height={1600}
                        decoding="async"
                        initial={shouldReduceMotion ? undefined : { opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={shouldReduceMotion ? undefined : { opacity: 0, scale: 0.96 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                        className="max-h-[75vh] w-auto max-w-full rounded-2xl object-contain shadow-2xl select-none"
                      />
                    </AnimatePresence>
                  </div>

                  {totalShots > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        if (isRtl) prevImage();
                        else nextImage();
                      }}
                      aria-label="Next image"
                      className="absolute end-2 sm:end-4 z-20 flex h-12 w-12 items-center justify-center rounded-full border border-white/30 bg-black/60 text-white shadow-2xl backdrop-blur-md transition-all hover:bg-black/80 hover:scale-110 active:scale-95 cursor-pointer"
                    >
                      <ChevronRight className="h-6 w-6 rtl:-scale-x-100" aria-hidden="true" />
                    </button>
                  )}
                </div>

                {/* Modal Bottom Thumbnail Strip */}
                {totalShots > 1 && (
                  <div
                    className="w-full max-w-2xl overflow-x-auto py-2 scrollbar-none"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ul className="flex items-center justify-center gap-3">
                      {product.gallery.map((image, i) => (
                        <li key={`modal-${image.path}-${i}`} className="shrink-0">
                          <button
                            type="button"
                            onClick={() => setActive(i)}
                            aria-label={image.alt || `${product.title} ${i + 1}`}
                            aria-current={i === active}
                            className={`relative aspect-square h-14 w-14 sm:h-16 sm:w-16 overflow-hidden rounded-xl border transition-all cursor-pointer ${
                              i === active
                                ? "border-primary ring-2 ring-primary scale-105 shadow-lg"
                                : "border-white/20 opacity-40 hover:opacity-100 hover:border-white/50"
                            }`}
                          >
                            <img
                              src={productImageUrl(image.path) ?? undefined}
                              alt=""
                              width={120}
                              height={120}
                              loading="lazy"
                              decoding="async"
                              className="h-full w-full object-cover"
                            />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="w-full min-w-0 lg:pt-2">
            <Link
              href={`/catalogue?category=${product.category}`}
              className="text-xs font-semibold tracking-[0.16em] text-primary uppercase transition-colors hover:text-primary-press"
            >
              {t(`categories.${product.category}.label`)}
            </Link>

            <h1 className="mt-3 text-2xl sm:text-3xl lg:text-4xl font-bold break-words">{product.title}</h1>
            <p className="mt-4 text-sm sm:text-base leading-relaxed text-muted-foreground break-words">
              {product.description}
            </p>

            {product.containsAccessCode && product.unlocks && (
              <div className="mt-5 flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4">
                <IdCard className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                <p className="text-sm leading-relaxed text-foreground">
                  {t("product.cardNotice", { package: product.unlocks })}
                </p>
              </div>
            )}

            <div className="mt-6 flex flex-wrap items-baseline gap-3">
              <span className="text-2xl sm:text-3xl font-extrabold text-foreground">
                {formatDzd(product.priceDzd, priceLocale)}
              </span>
              {product.compareAtDzd && (
                <span className="text-sm text-muted-foreground line-through">
                  {formatDzd(product.compareAtDzd, priceLocale)}
                </span>
              )}
              {canAddToCart ? (
                effectiveStockCount <= 5 && (
                  <Badge variant="secondary">
                    {t("products.lowStock", { count: effectiveStockCount })}
                  </Badge>
                )
              ) : (
                <Badge variant="outline">{t("products.outOfStock")}</Badge>
              )}
            </div>

            {sellsByColor && (
              <div className="mt-6">
                <p className="text-sm font-semibold">
                  {t("product.colorLabel")}
                  {selectedColor && <span className="ms-2 font-normal text-muted-foreground">{selectedColor.name}</span>}
                </p>
                <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label={t("product.colorLabel")}>
                  {colors.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      role="radio"
                      aria-checked={c.id === selectedColorId}
                      aria-label={c.name}
                      title={c.inStock ? c.name : `${c.name} — ${t("products.outOfStock")}`}
                      disabled={!c.inStock}
                      onClick={() => setSelectedColorId(c.id)}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                        c.id === selectedColorId
                          ? "border-primary bg-primary/5 text-foreground"
                          : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground"
                      }`}
                    >
                      {c.hex && (
                        <span
                          className="h-3.5 w-3.5 shrink-0 rounded-full border border-border/60"
                          style={{ backgroundColor: c.hex }}
                          aria-hidden="true"
                        />
                      )}
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* The offer ladder */}
            {product.offers && product.offers.length > 0 && (
              <div className="mt-6 overflow-hidden rounded-lg border border-rule w-full max-w-full">
                <p className="ui-dense border-b border-rule bg-paper px-3 py-2 text-[11px] font-semibold tracking-[0.1em] text-muted-foreground uppercase">
                  {t("product.offersTitle")}
                </p>
                <ul className="divide-y divide-border">
                  {product.offers.map((tier) => (
                    <li
                      key={tier.minQuantity}
                      className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 min-w-0"
                    >
                      <span className="text-xs sm:text-sm font-medium">
                        {t("product.offerQuantity", { count: tier.minQuantity })}
                      </span>
                      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                        <span className="figures text-xs sm:text-sm font-semibold">
                          {formatDzd(tier.unitDzd, priceLocale)}
                        </span>
                        <span className="ui-dense text-[10px] sm:text-[11px] text-muted-foreground">
                          {t("product.offerEach")}
                        </span>
                        <Badge variant="secondary" className="figures text-[10px] px-1.5 py-0.5">
                          {t("product.offerSaving", {
                            amount: formatDzd(tier.savingDzd, priceLocale),
                          })}
                        </Badge>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <AddToCartButton
                productId={product.id}
                colorId={selectedColorId}
                disabled={!canAddToCart}
                maxQuantity={effectiveStockCount}
                className="flex-1"
              />
              <Button
                asChild
                variant="outline"
                size="lg"
                className="h-12 w-full sm:w-auto rounded-xl px-8 text-base font-semibold border-border hover:bg-paper cursor-pointer"
              >
                <Link href="/checkout">
                  <ShoppingBag className="h-4 w-4" aria-hidden="true" />
                  {t("actions.order")}
                </Link>
              </Button>
            </div>

            <p className="mt-5 inline-flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Truck className="h-4 w-4 text-primary" aria-hidden="true" />
              {t("product.deliveryNote")}
            </p>

            <Separator className="my-8" />

            {/* Spec table */}
            {product.specs && product.specs.length > 0 && (
              <div className="w-full max-w-full">
                <h2 className="text-sm font-semibold">{t("product.specsTitle")}</h2>
                <dl className="mt-3 divide-y divide-border border-y border-border">
                  {product.specs.map((spec) => (
                    <div
                      key={spec.label}
                      className="grid grid-cols-[1fr_1fr] sm:grid-cols-[minmax(6rem,10rem)_1fr] gap-3 py-2.5 text-sm min-w-0"
                    >
                      <dt className="text-muted-foreground break-words">{spec.label}</dt>
                      <dd className="font-medium break-words">{spec.value}</dd>
                    </div>
                  ))}
                  {product.sku && (
                    <div className="grid grid-cols-[1fr_1fr] sm:grid-cols-[minmax(6rem,10rem)_1fr] gap-3 py-2.5 text-sm min-w-0">
                      <dt className="text-muted-foreground">{t("product.sku")}</dt>
                      <dd className="figures font-medium">{product.sku}</dd>
                    </div>
                  )}
                </dl>
              </div>
            )}
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="border-t border-border bg-paper w-full max-w-full overflow-hidden">
          <div className="mx-auto w-full max-w-[1536px] px-4 py-16 sm:px-6 lg:px-12">
            <div className="flex flex-wrap items-baseline justify-between gap-4">
              <h2 className="text-2xl font-bold sm:text-3xl">{t("product.related")}</h2>
              <Link
                href="/catalogue"
                className="inline-flex items-center gap-1.5 text-sm font-semibold transition-colors hover:text-primary-press"
              >
                {t("actions.viewAll")}
                <ArrowRight className="h-4 w-4 rtl:-scale-x-100" aria-hidden="true" />
              </Link>
            </div>
            <div className="mt-10 grid grid-cols-2 gap-3 sm:gap-6 md:grid-cols-3 min-w-0 w-full">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
