"use client";

import { ArrowRight } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";

import { Link } from "../../../i18n/navigation";
import { ProductCard } from "@/components/site/ProductCard";
import type { CatalogueProduct } from "@/server/catalogue";
import { staggerContainer, fadeInUp, viewportOnce } from "@/lib/motion";

/**
 * Two rows of three, the order the client specified for the landing page.
 *
 * The selection is made in `listFeaturedProducts`, not here: which products
 * appear is the client's decision in the admin, and a component slicing the
 * catalogue would quietly overrule it.
 */
export function Products({ items }: { items: CatalogueProduct[] }) {
  const t = useTranslations("products");
  const tAction = useTranslations("actions");
  const shouldReduceMotion = useReducedMotion();

  if (items.length === 0) return null;
  const featured = items;

  return (
    <section className="border-b border-border bg-paper">
      <div className="mx-auto w-full max-w-[1536px] px-4 py-20 sm:px-6 lg:px-12">
        <motion.div
          variants={shouldReduceMotion ? {} : fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          className="flex flex-wrap items-end justify-between gap-4"
        >
          <div>
            <h2 className="mt-2 text-3xl font-extrabold sm:text-4xl">{t("title")}</h2>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">{t("subtitle")}</p>
          </div>
          <Link
            href="/catalogue"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground transition-colors hover:text-primary"
          >
            {tAction("viewAll")}
            <ArrowRight className="h-4 w-4 rtl:-scale-x-100" aria-hidden="true" />
          </Link>
        </motion.div>

        <motion.div
          variants={shouldReduceMotion ? {} : staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          className="mt-12 grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-3"
        >
          {featured.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </motion.div>

        <motion.div
          variants={shouldReduceMotion ? {} : fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          className="mt-14 flex justify-center"
        >
          <Link
            href="/catalogue"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-border bg-background px-8 text-sm font-semibold transition-all hover:border-primary hover:bg-primary hover:text-primary-foreground"
          >
            {tAction("viewCatalogue")}
            <ArrowRight className="h-4 w-4 rtl:-scale-x-100" aria-hidden="true" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
