import "server-only";

import { cache } from "react";
import { and, asc, eq, inArray, isNull } from "drizzle-orm";
import { db } from "@/db";
import {
  lmsPackages,
  productCategories,
  productColors,
  productImages,
  productOffers,
  productSpecs,
  products,
} from "@/db/schema";
import type { Locale } from "@/lib/i18n-content";
import { pick } from "@/lib/i18n-content";
import type { Offer } from "@/lib/offers";
import { offerLadder, priceLine } from "@/lib/offers";

export type CatalogueProduct = {
  id: string;
  slug: string;
  title: string;
  description: string;
  priceDzd: number;
  compareAtDzd: number | null;
  inStock: boolean;
  stockCount: number;
  containsAccessCode: boolean;
  isFeatured: boolean;
  category: string;
  type: "physical" | "lms_access";
  image: { path: string; alt: string } | null;
};

const visible = () => and(eq(products.isVisible, true), isNull(products.archivedAt));

import { PRODUCTS as SEED_PRODUCTS } from "@/db/seed/catalogue";

function fallbackProducts(locale: Locale): CatalogueProduct[] {
  return SEED_PRODUCTS.map((p, i) => ({
    id: `seed-${i + 1}`,
    slug: p.slug,
    title: pick(locale, { en: p.titleEn, ar: p.titleAr, fr: p.titleFr }),
    description: pick(locale, { en: p.descriptionEn, ar: p.descriptionAr, fr: p.descriptionFr }),
    priceDzd: p.priceDzd,
    compareAtDzd: p.compareAtDzd ?? null,
    inStock: (p.stockCount ?? 10) > 0,
    stockCount: p.stockCount ?? 10,
    containsAccessCode: false,
    isFeatured: p.isFeatured ?? false,
    category: p.category,
    type: "physical",
    image: p.image
      ? { path: p.image, alt: pick(locale, { en: p.altEn ?? "", ar: p.altAr ?? "", fr: p.altFr ?? "" }) }
      : null,
  }));
}

export const listProducts = cache(
  async (locale: Locale): Promise<CatalogueProduct[]> => {
    try {
      const rows = await db
        .select()
        .from(products)
        .where(visible())
        .orderBy(asc(products.position), asc(products.titleEn));

      const images = await db
        .select()
        .from(productImages)
        .orderBy(asc(productImages.position));

      const firstImage = new Map<string, (typeof images)[number]>();
      for (const image of images) {
        if (!firstImage.has(image.productId)) firstImage.set(image.productId, image);
      }

      const categoryKeys = new Map(
        (await db.select().from(productCategories)).map((c) => [c.id, c.key]),
      );

      return rows.map((p) => {
        const image = firstImage.get(p.id);
        return {
          id: p.id,
          slug: p.slug,
          title: pick(locale, { en: p.titleEn, ar: p.titleAr, fr: p.titleFr }),
          description: pick(locale, { en: p.descriptionEn, ar: p.descriptionAr, fr: p.descriptionFr }),
          priceDzd: p.priceDzd,
          compareAtDzd: p.compareAtDzd,
          inStock: p.stockCount > 0,
          stockCount: p.stockCount,
          containsAccessCode: p.containsAccessCode,
          isFeatured: p.isFeatured,
          category: categoryKeys.get(p.categoryId) ?? "",
          type: p.type,
          image: image
            ? { path: image.path, alt: pick(locale, { en: image.altEn, ar: image.altAr, fr: image.altFr }) }
            : null,
        };
      });
    } catch (err) {
      console.error("Database query failed in listProducts, using fallback mock catalogue:", err);
      return fallbackProducts(locale);
    }
  },
);

export const getProductBySlug = cache(async (slug: string, locale: Locale) => {
  try {
    const [row] = await db
      .select()
      .from(products)
      .where(and(eq(products.slug, slug), visible()))
      .limit(1);
    if (!row) {
      const fallback = fallbackProducts(locale).find((p) => p.slug === slug);
      if (!fallback) return null;
      return {
        ...fallback,
        sku: "TP-DEMO",
        unlocks: null,
        gallery: fallback.image ? [fallback.image] : [],
        specs: [],
        offers: [],
        colors: [],
      };
    }

    const [category] = await db
      .select({ key: productCategories.key })
      .from(productCategories)
      .where(eq(productCategories.id, row.categoryId))
      .limit(1);

    const gallery = await db
      .select()
      .from(productImages)
      .where(eq(productImages.productId, row.id))
      .orderBy(asc(productImages.position));

    // Only stated when the box actually contains a card, and then it says what
    // the card opens rather than leaving the buyer to guess.
    let unlocks: string | null = null;
    if (row.containsAccessCode && row.accessPackageId) {
      const [pkg] = await db
        .select()
        .from(lmsPackages)
        .where(eq(lmsPackages.id, row.accessPackageId))
        .limit(1);
      if (pkg) unlocks = pick(locale, { en: pkg.titleEn, ar: pkg.titleAr, fr: pkg.titleFr });
    }

    const specs = await db
      .select()
      .from(productSpecs)
      .where(and(eq(productSpecs.productId, row.id), isNull(productSpecs.archivedAt)))
      .orderBy(asc(productSpecs.position));

    const offers = (await activeOffersFor([row.id])).get(row.id) ?? [];

    const colors = await db
      .select()
      .from(productColors)
      .where(
        and(
          eq(productColors.productId, row.id),
          eq(productColors.isVisible, true),
          isNull(productColors.archivedAt),
        ),
      )
      .orderBy(asc(productColors.position));

    return {
      id: row.id,
      slug: row.slug,
      sku: row.sku,
      title: pick(locale, { en: row.titleEn, ar: row.titleAr, fr: row.titleFr }),
      description: pick(locale, { en: row.descriptionEn, ar: row.descriptionAr, fr: row.descriptionFr }),
      priceDzd: row.priceDzd,
      compareAtDzd: row.compareAtDzd,
      inStock: row.stockCount > 0,
      stockCount: row.stockCount,
      containsAccessCode: row.containsAccessCode,
      unlocks,
      category: category?.key ?? "",
      type: row.type,
      gallery: gallery.map((g) => ({
        path: g.path,
        alt: pick(locale, { en: g.altEn, ar: g.altAr, fr: g.altFr }),
      })),
      specs: specs.map((s) => ({
        label: pick(locale, { en: s.labelEn, ar: s.labelAr, fr: s.labelFr }),
        value: pick(locale, { en: s.valueEn, ar: s.valueAr, fr: s.valueFr }),
      })),
      offers: offerLadder(row.priceDzd, offers),
      colors: colors.map((c) => ({
        id: c.id,
        name: pick(locale, { en: c.nameEn, ar: c.nameAr, fr: c.nameFr }),
        hex: c.hex,
        inStock: c.stockCount > 0,
        stockCount: c.stockCount,
      })),
    };
  } catch (err) {
    console.error("Database query failed in getProductBySlug, using fallback mock product:", err);
    const fallback = fallbackProducts(locale).find((p) => p.slug === slug);
    if (!fallback) return null;
    return {
      ...fallback,
      sku: "TP-DEMO",
      unlocks: null,
      gallery: fallback.image ? [fallback.image] : [],
      specs: [],
      offers: [],
      colors: [],
    };
  }
});

/**
 * The landing page. `is_featured` is a decision the client makes per product,
 * not the accident of being first in the catalogue order.
 *
 * Falls back to the head of the catalogue when nothing is featured yet, so a
 * fresh install does not render an empty band where the shop should be.
 */
export const listFeaturedProducts = cache(
  async (locale: Locale, limit = 6): Promise<CatalogueProduct[]> => {
    const all = await listProducts(locale);
    const featured = all.filter((p) => p.isFeatured);
    return (featured.length > 0 ? featured : all).slice(0, limit);
  },
);

export type CatalogueCategory = { key: string; label: string };

/** Live category set for the storefront filter — admin-managed, not the static i18n rayons on the homepage. */
export const listCategories = cache(
  async (locale: Locale): Promise<CatalogueCategory[]> => {
    try {
      const rows = await db
        .select()
        .from(productCategories)
        .where(isNull(productCategories.archivedAt))
        .orderBy(asc(productCategories.position));

      return rows.map((c) => ({
        key: c.key,
        label: pick(locale, { en: c.labelEn, ar: c.labelAr, fr: c.labelFr }),
      }));
    } catch (err) {
      console.error("Database query failed in listCategories:", err);
      return [];
    }
  },
);

export const listProductSlugs = cache(async () => {
  try {
    const rows = await db.select({ slug: products.slug }).from(products).where(visible());
    return rows.map((r) => r.slug);
  } catch (err) {
    console.error("Database query failed in listProductSlugs:", err);
    return SEED_PRODUCTS.map((p) => p.slug);
  }
});

/** Cart contents come from a cookie, so the prices are resolved here. */
export async function resolveCart(
  items: { productId: string; colorId?: string | null; quantity: number }[],
  locale: Locale,
) {
  if (items.length === 0) return { lines: [], subtotalDzd: 0, savingDzd: 0 };

  try {
    const rows = await db
      .select()
      .from(products)
      .where(
        and(
          visible(),
          inArray(
            products.id,
            items.map((i) => i.productId),
          ),
        ),
      );

    const offers = await activeOffersFor(rows.map((p) => p.id));

    // A product sells by color the moment it has any visible one. A line
    // whose color is missing or no longer valid (archived, hidden, or from a
    // stale cart predating colors on this product) is dropped rather than
    // shown at a price it can no longer be bought at.
    const colorRows = await db
      .select()
      .from(productColors)
      .where(
        and(
          inArray(productColors.productId, rows.map((p) => p.id)),
          eq(productColors.isVisible, true),
          isNull(productColors.archivedAt),
        ),
      );
    const colorsByProduct = new Map<string, (typeof colorRows)[number][]>();
    for (const c of colorRows) {
      const list = colorsByProduct.get(c.productId) ?? [];
      list.push(c);
      colorsByProduct.set(c.productId, list);
    }
    const colorById = new Map(colorRows.map((c) => [c.id, c]));

    const byId = new Map(rows.map((p) => [p.id, p]));
    const lines = items
      .filter((i) => byId.has(i.productId))
      .filter((i) => {
        const required = colorsByProduct.get(i.productId);
        if (!required || required.length === 0) return true;
        return i.colorId ? colorById.get(i.colorId)?.productId === i.productId : false;
      })
      .map((i) => {
        const p = byId.get(i.productId)!;
        const color = i.colorId ? colorById.get(i.colorId) : undefined;
        // Same function the checkout uses. The cart preview and the order total
        // cannot disagree, because there is only one calculation.
        const priced = priceLine(p.priceDzd, i.quantity, offers.get(p.id) ?? []);
        return {
          productId: p.id,
          colorId: color?.id ?? null,
          colorName: color
            ? pick(locale, { en: color.nameEn, ar: color.nameAr, fr: color.nameFr })
            : null,
          slug: p.slug,
          title: pick(locale, { en: p.titleEn, ar: p.titleAr, fr: p.titleFr }),
          priceDzd: priced.unitDzd,
          listPriceDzd: priced.listUnitDzd,
          savingDzd: priced.savingDzd,
          quantity: i.quantity,
          lineTotalDzd: priced.totalDzd,
          maxQuantity: color
            ? color.stockCount
            : p.type === "lms_access"
              ? 20
              : p.stockCount,
        };
      });

    return {
      lines,
      subtotalDzd: lines.reduce((sum, l) => sum + l.lineTotalDzd, 0),
      savingDzd: lines.reduce((sum, l) => sum + l.savingDzd, 0),
    };
  } catch (err) {
    console.error("Database query failed in resolveCart:", err);
    return { lines: [], subtotalDzd: 0, savingDzd: 0 };
  }
}

/**
 * Live offer tiers, keyed by product. Archived and deactivated rows never come
 * back, so an offer the client switched off cannot price an order.
 */
export async function activeOffersFor(
  productIds: string[],
): Promise<Map<string, Offer[]>> {
  const byProduct = new Map<string, Offer[]>();
  if (productIds.length === 0) return byProduct;

  try {
    const rows = await db
      .select()
      .from(productOffers)
      .where(
        and(
          inArray(productOffers.productId, productIds),
          eq(productOffers.isActive, true),
          isNull(productOffers.archivedAt),
        ),
      )
      .orderBy(asc(productOffers.minQuantity));

    for (const row of rows) {
      const list = byProduct.get(row.productId) ?? [];
      list.push({ minQuantity: row.minQuantity, kind: row.kind, value: row.value });
      byProduct.set(row.productId, list);
    }

    return byProduct;
  } catch (err) {
    console.error("Database query failed in activeOffersFor:", err);
    return byProduct;
  }
}

export const listPackages = cache(async (locale: Locale) => {
  try {
    const rows = await db
      .select()
      .from(lmsPackages)
      .where(and(eq(lmsPackages.isVisible, true), isNull(lmsPackages.archivedAt)));

    return rows.map((p) => ({
      id: p.id,
      title: pick(locale, { en: p.titleEn, ar: p.titleAr, fr: p.titleFr }),
      description: pick(locale, { en: p.descriptionEn, ar: p.descriptionAr, fr: p.descriptionFr }),
      priceDzd: p.priceDzd,
      defaultDurationDays: p.defaultDurationDays,
    }));
  } catch (err) {
    console.error("Database query failed in listPackages:", err);
    return [];
  }
});
