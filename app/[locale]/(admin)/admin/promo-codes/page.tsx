import { PageHead } from "@/components/admin/AdminChrome";
import { PromoCodesManager, type PromoCodeRow } from "@/components/admin/PromoCodesManager";
import { PermissionGate } from "@/components/admin/PermissionGate";
import { requireStaffOrNotFound } from "@/server/session";
import {
  listAdminPromoCodes,
  listAdminProductCategories,
  listAllProducts,
  listPromoCodeProductIds,
} from "@/server/admin";
import { toDinars } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function AdminPromoCodesPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    sort?: string;
    direction?: "asc" | "desc";
    page?: string;
  }>;
}) {
  const user = await requireStaffOrNotFound();
  if (!user.permissions.has("promoCodes.manage")) {
    return (
      <div className="space-y-6">
        <PageHead title="Promo codes" />
        <PermissionGate permission="promoCodes.manage" />
      </div>
    );
  }

  const { q, sort, direction, page } = await searchParams;

  const [result, categories, productsPaged, joinRows] = await Promise.all([
    listAdminPromoCodes({ search: q, sort, direction, page }),
    listAdminProductCategories(),
    // Every product, for the scope pickers. 200 is `_list.ts`'s hard cap
    // (requesting above it throws a ZodError, and Zod v4's ZodError.message
    // is getter-only, which crashes Next's error normalization outright
    // rather than surfacing a validation message) — comfortably above this
    // catalogue's size, so nothing is actually cut off.
    listAllProducts({ perPage: 200 }),
    listPromoCodeProductIds(),
  ]);

  const productIdsByPromo = new Map<string, string[]>();
  for (const r of joinRows) {
    const list = productIdsByPromo.get(r.promoCodeId) ?? [];
    list.push(r.productId);
    productIdsByPromo.set(r.promoCodeId, list);
  }

  const rows: PromoCodeRow[] = result.rows.map((p) => ({
    id: p.id,
    code: p.code,
    kind: p.kind,
    value: p.kind === "percent" ? p.value : toDinars(p.value),
    scopeType: p.scopeType,
    categoryId: p.categoryId,
    productId: p.productId,
    productIds: productIdsByPromo.get(p.id) ?? [],
    startsAt: p.startsAt,
    endsAt: p.endsAt,
    maxUses: p.maxUses,
    usedCount: p.usedCount,
    isActive: p.isActive,
    archivedAt: p.archivedAt,
  }));

  return (
    <div className="space-y-6">
      <PageHead
        title="Promo codes"
        meta={
          <>
            {rows.filter((r) => r.isActive && !r.archivedAt).length} active. Scoped to the whole
            cart, one category, one product, or a chosen set of products.
          </>
        }
      />
      <PromoCodesManager
        rows={rows}
        total={result.total}
        page={result.page}
        perPage={result.perPage}
        sort={result.sort}
        direction={result.direction}
        categories={categories.map((c) => ({ id: c.id, labelEn: c.labelEn }))}
        products={productsPaged.rows.map((p) => ({ id: p.id, titleEn: p.titleEn }))}
      />
    </div>
  );
}
