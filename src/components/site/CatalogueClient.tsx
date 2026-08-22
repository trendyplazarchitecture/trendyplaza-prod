"use client";

import { useSearchParams } from "next/navigation";
import { Package, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";

import { Link } from "../../../i18n/navigation";
import { ProductCard } from "@/components/site/ProductCard";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { CatalogueCategory, CatalogueProduct } from "@/server/catalogue";
import { staggerContainer } from "@/lib/motion";

export function CatalogueClient({
  products,
  categories,
}: {
  products: CatalogueProduct[];
  categories: CatalogueCategory[];
}) {
  const t = useTranslations();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const shouldReduceMotion = useReducedMotion();

  const requested = searchParams.get("category");
  const category = categories.some((c) => c.key === requested) ? requested : null;

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      const matchesCategory = !category || p.category === category;
      const matchesQuery = !q || `${p.title} ${p.description}`.toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [category, query, products]);

  return (
    <>
      <section className="border-b border-border bg-paper">
        <div className="mx-auto w-full max-w-[1536px] px-4 py-14 sm:px-6 lg:px-12">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/">{t("nav.home")}</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{t("catalogue.title")}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <h1 className="mt-6 text-4xl font-bold sm:text-5xl">{t("catalogue.title")}</h1>
          <p className="mt-4 max-w-xl text-muted-foreground">{t("catalogue.subtitle")}</p>

          <div className="relative mt-8 max-w-md">
            <Search
              className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("catalogue.searchPlaceholder")}
              aria-label={t("catalogue.searchPlaceholder")}
              className="h-11 ps-10"
            />
          </div>
        </div>
      </section>

      <div className="mx-auto w-full max-w-[1536px] px-4 py-12 sm:px-6 lg:px-12">
        <div className="flex flex-wrap gap-2">
          <Button asChild variant={category ? "outline" : "default"} size="sm">
            <Link href="/catalogue">{t("catalogue.filterAll")}</Link>
          </Button>
          {categories.map(({ key, label }) => (
            <Button
              key={key}
              asChild
              variant={category === key ? "default" : "outline"}
              size="sm"
            >
              <Link href={`/catalogue?category=${key}`}>
                <Package className="h-4 w-4" aria-hidden="true" />
                {label}
              </Link>
            </Button>
          ))}
        </div>

        {/* ICU plural, so Arabic gets its dual and its two plural forms rather
            than an English "s" bolted on. */}
        <p className="mt-8 text-sm text-muted-foreground" aria-live="polite">
          {t("products.count", { count: visible.length })}
        </p>

        {visible.length > 0 ? (
          <motion.div
            layout={!shouldReduceMotion}
            variants={shouldReduceMotion ? {} : staggerContainer}
            initial="hidden"
            animate="visible"
            className="mt-6 grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-3"
          >
            <AnimatePresence mode="popLayout">
              {visible.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          // An empty state that invites the next action rather than describing
          // the emptiness.
          <div className="mt-16 flex flex-col items-center text-center">
            <p className="text-sm text-muted-foreground">{t("products.empty")}</p>
            <Button asChild variant="outline" size="sm" className="mt-4">
              <Link href="/catalogue">{t("catalogue.filterAll")}</Link>
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
