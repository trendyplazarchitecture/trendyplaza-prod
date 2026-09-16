import { getTranslations } from "next-intl/server";
import { PageHead } from "@/components/admin/AdminChrome";
import { ProductsManager, type ProductRow } from "@/components/admin/ProductsManager";
import { PermissionGate } from "@/components/admin/PermissionGate";
import { requireStaffOrNotFound } from "@/server/session";
import { listAdminProductCategories, listAllProducts, listProductDetails } from "@/server/admin";
import { listPackages } from "@/server/catalogue";
import { toDinars } from "@/lib/money";
import type { Locale } from "@/lib/i18n-content";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{
    q?: string;
    sort?: string;
    direction?: "asc" | "desc";
    page?: string;
  }>;
}) {
  const t = await getTranslations("admin.products");
  const user = await requireStaffOrNotFound();
  if (!user.permissions.has("products.manage")) {
    return (
      <div className="space-y-6">
        <PageHead title={t("pageTitle")} />
        <PermissionGate permission="products.manage" />
      </div>
    );
  }
  const { locale } = await params;
  const { q, sort, direction, page } = await searchParams;

  const [result, packages, details, categories] = await Promise.all([
    listAllProducts({ search: q, sort, direction, page }),
    listPackages(locale),
    listProductDetails(),
    listAdminProductCategories(),
  ]);

  // Grouped once here rather than filtered per row inside the map, which is
  // O(products × images) and grows quietly as the catalogue does.
  const by = <T extends { productId: string }>(rows: T[]) => {
    const map = new Map<string, T[]>();
    for (const row of rows) {
      const list = map.get(row.productId) ?? [];
      list.push(row);
      map.set(row.productId, list);
    }
    return map;
  };
  const imagesBy = by(details.images);
  const specsBy = by(details.specs);
  const offersBy = by(details.offers);
  const colorsBy = by(details.colors);

  const promoByCategory = new Map<string, typeof details.promoCodesActive>();
  const promoByProduct = new Map<string, typeof details.promoCodesActive>();
  for (const promo of details.promoCodesActive) {
    if (promo.scopeType === "category" && promo.categoryId) {
      const list = promoByCategory.get(promo.categoryId) ?? [];
      list.push(promo);
      promoByCategory.set(promo.categoryId, list);
    } else if (promo.scopeType === "product" && promo.productId) {
      const list = promoByProduct.get(promo.productId) ?? [];
      list.push(promo);
      promoByProduct.set(promo.productId, list);
    }
  }
  const promoByJoin = new Map<string, { code: string }[]>();
  for (const r of details.promoCodeProductRows) {
    const list = promoByJoin.get(r.productId) ?? [];
    list.push({ code: r.code });
    promoByJoin.set(r.productId, list);
  }

  const rows: ProductRow[] = result.rows.map((p) => ({
    id: p.id,
    slug: p.slug,
    titleEn: p.titleEn,
    titleAr: p.titleAr,
    titleFr: p.titleFr,
    descriptionEn: p.descriptionEn,
    descriptionAr: p.descriptionAr,
    descriptionFr: p.descriptionFr,
    categoryId: p.categoryId,
    priceDzd: p.priceDzd,
    compareAtDzd: p.compareAtDzd,
    stockCount: p.stockCount,
    containsAccessCode: p.containsAccessCode,
    accessPackageId: p.accessPackageId,
    isVisible: p.isVisible,
    isFeatured: p.isFeatured,
    sku: p.sku,
    archivedAt: p.archivedAt,
    images: (imagesBy.get(p.id) ?? []).map((i) => ({
      id: i.id,
      path: i.path,
      position: i.position,
      altEn: i.altEn,
    })),
    specs: (specsBy.get(p.id) ?? []).map((sp) => ({
      labelEn: sp.labelEn,
      labelFr: sp.labelFr,
      labelAr: sp.labelAr,
      valueEn: sp.valueEn,
      valueFr: sp.valueFr,
      valueAr: sp.valueAr,
    })),
    // Offers come back in centimes and the editor types in dinars, the same
    // way the price field does.
    offers: (offersBy.get(p.id) ?? []).map((o) => ({
      minQuantity: o.minQuantity,
      kind: o.kind,
      value: o.kind === "percent" ? o.value : toDinars(o.value),
    })),
    colors: (colorsBy.get(p.id) ?? []).map((c) => ({
      id: c.id,
      nameEn: c.nameEn,
      nameFr: c.nameFr,
      nameAr: c.nameAr,
      hex: c.hex,
      stockCount: c.stockCount,
      isVisible: c.isVisible,
      archivedAt: c.archivedAt,
    })),
    activePromoCodes: [
      ...(promoByProduct.get(p.id) ?? []).map((promo) => ({ code: promo.code, via: "product" as const })),
      ...(promoByCategory.get(p.categoryId) ?? []).map((promo) => ({ code: promo.code, via: "category" as const })),
      ...(promoByJoin.get(p.id) ?? []).map((promo) => ({ code: promo.code, via: "products" as const })),
    ],
  }));

  const listed = rows.filter((r) => r.isVisible && !r.archivedAt).length;
  const out = rows.filter((r) => r.stockCount === 0 && !r.archivedAt).length;

  return (
    <div className="space-y-6">
      <PageHead
        title={t("pageTitle")}
        meta={
          <>
            {t("pageMeta", { listed })}
            {out > 0 && (
              <>
                {" "}
                <span className="text-primary-press">{t("pageMetaOutOfStock", { count: out })}</span>
              </>
            )}{" "}
            {t("pageMetaFooter")}
          </>
        }
      />
      <ProductsManager rows={rows} packages={packages} categories={categories} />
    </div>
  );
}
