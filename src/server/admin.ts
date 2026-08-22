import "server-only";

import { and, count, desc, eq, gte, inArray, isNull, lte, sql } from "drizzle-orm";
import { db } from "@/db";
import { paged, resolveList, type ListQuery, type Sortable } from "./_list";
import {
  academicYears,
  accessCodes,
  accessRequests,
  activityLog,
  contactMessages,
  entitlements,
  lmsPackages,
  modules,
  orderItems,
  orders,
  packageContents,
  productCategories,
  productColors,
  productImages,
  productOffers,
  productSpecs,
  products,
  promoCodeProducts,
  promoCodes,
  resourceTypes,
  resources,
  semesters,
  universities,
  userProfiles,
  users,
} from "@/db/schema";

/**
 * Reads for the admin. Every one of these is called from a page or action that
 * has already run its own `requirePermission`; nothing here checks, so nothing
 * here may be called from an unguarded route.
 */

/** The four things a person opening the admin needs to decide what to do next. */
export async function getWorkload() {
  const [pendingOrders] = await db
    .select({ n: count() })
    .from(orders)
    .where(and(eq(orders.status, "pending"), isNull(orders.archivedAt)));

  const [readyToShip] = await db
    .select({ n: count() })
    .from(orders)
    .where(and(eq(orders.status, "confirmed"), isNull(orders.archivedAt)));

  const [pendingRequests] = await db
    .select({ n: count() })
    .from(accessRequests)
    .where(eq(accessRequests.status, "pending"));

  const [lowStock] = await db
    .select({ n: count() })
    .from(products)
    .where(
      and(
        isNull(products.archivedAt),
        eq(products.isVisible, true),
        lte(products.stockCount, 5),
      ),
    );

  const [pendingMessages] = await db
    .select({ n: count() })
    .from(contactMessages)
    .where(and(eq(contactMessages.status, "new"), isNull(contactMessages.archivedAt)));

  return {
    pendingOrders: pendingOrders?.n ?? 0,
    readyToShip: readyToShip?.n ?? 0,
    pendingRequests: pendingRequests?.n ?? 0,
    lowStock: lowStock?.n ?? 0,
    pendingMessages: pendingMessages?.n ?? 0,
  };
}

/** The title block: the state of the operation, in figures that do not move often. */
export async function getSheetFigures() {
  const since = new Date();
  since.setDate(since.getDate() - 30);

  const [revenue] = await db
    .select({
      /* Delivered only. An order that has not reached the customer is not
         money, it is a promise, and counting it inflates every report. */
      total: sql<number>`coalesce(sum(${orders.totalDzd}), 0)::int`,
      n: count(),
    })
    .from(orders)
    .where(
      and(
        eq(orders.status, "delivered"),
        gte(orders.createdAt, since),
        isNull(orders.archivedAt),
      ),
    );

  const [students] = await db
    .select({ n: count() })
    .from(entitlements)
    .where(eq(entitlements.status, "active"));

  const [codesLeft] = await db
    .select({ n: count() })
    .from(accessCodes)
    .where(and(eq(accessCodes.isRedeemed, false), isNull(accessCodes.voidedAt)));

  const [liveResources] = await db
    .select({ n: count() })
    .from(resources)
    .where(and(isNull(resources.archivedAt), eq(resources.isVisible, true)));

  return {
    revenueDzd: revenue?.total ?? 0,
    deliveredCount: revenue?.n ?? 0,
    activeStudents: students?.n ?? 0,
    unredeemedCodes: codesLeft?.n ?? 0,
    liveResources: liveResources?.n ?? 0,
  };
}

/**
 * Fourteen days of orders placed and delivered, zero-filled.
 *
 * The zero-fill matters: a chart that silently omits the days with no orders
 * draws a smooth line through a weekend the shop was shut and tells the client
 * a comforting lie.
 */
export async function getOrderTrend(days = 14) {
  const rows = await db
    .select({
      day: sql<string>`to_char(date_trunc('day', ${orders.createdAt}), 'YYYY-MM-DD')`,
      placed: count(),
      delivered: sql<number>`count(*) filter (where ${orders.status} = 'delivered')::int`,
    })
    .from(orders)
    .where(
      and(
        gte(orders.createdAt, sql`now() - make_interval(days => ${days})`),
        isNull(orders.archivedAt),
      ),
    )
    .groupBy(sql`date_trunc('day', ${orders.createdAt})`)
    .orderBy(sql`date_trunc('day', ${orders.createdAt})`);

  const byDay = new Map(rows.map((r) => [r.day, r]));
  const out: { day: string; placed: number; delivered: number }[] = [];

  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const row = byDay.get(key);
    out.push({
      day: key,
      placed: row?.placed ?? 0,
      delivered: row?.delivered ?? 0,
    });
  }

  return out;
}

/** Where the orders are going. Drives the wilaya bar chart. */
export async function getTopWilayas(limit = 6) {
  return db
    .select({
      wilayaCode: orders.wilayaCode,
      n: count(),
    })
    .from(orders)
    .groupBy(orders.wilayaCode)
    .orderBy(desc(count()))
    .limit(limit);
}

/** How the LMS is being entered: printed card, or receipt review. */
export async function getEntitlementSources() {
  const rows = await db
    .select({ source: entitlements.source, n: count() })
    .from(entitlements)
    .groupBy(entitlements.source);

  const get = (s: string) => rows.find((r) => r.source === s)?.n ?? 0;
  return { code: get("code"), request: get("request"), admin: get("admin") };
}

/** The revision table: who changed what, most recent first. */
export async function getRecentActivity(limit = 12) {
  return db
    .select({
      id: activityLog.id,
      action: activityLog.action,
      entity: activityLog.entity,
      entityId: activityLog.entityId,
      createdAt: activityLog.createdAt,
      actorName: users.name,
    })
    .from(activityLog)
    .leftJoin(users, eq(users.id, activityLog.actorId))
    .orderBy(desc(activityLog.createdAt))
    .limit(limit);
}

/** The revision trail for one entity, oldest last. Used on the order sheet. */
export async function getEntityActivity(entity: string, entityId: string, limit = 20) {
  return db
    .select({
      id: activityLog.id,
      action: activityLog.action,
      createdAt: activityLog.createdAt,
      actorName: users.name,
      after: activityLog.after,
    })
    .from(activityLog)
    .leftJoin(users, eq(users.id, activityLog.actorId))
    .where(and(eq(activityLog.entity, entity), eq(activityLog.entityId, entityId)))
    .orderBy(desc(activityLog.createdAt))
    .limit(limit);
}

/** Products at or below the reorder line, worst first. */
export async function getLowStock(threshold = 5, limit = 5) {
  return db
    .select({
      id: products.id,
      slug: products.slug,
      titleEn: products.titleEn,
      titleFr: products.titleFr,
      titleAr: products.titleAr,
      stockCount: products.stockCount,
    })
    .from(products)
    .where(
      and(
        isNull(products.archivedAt),
        eq(products.isVisible, true),
        lte(products.stockCount, threshold),
      ),
    )
    .orderBy(products.stockCount)
    .limit(limit);
}

/**
 * Totals for the overview's "see all" links.
 *
 * The panels show five rows each. Without the total, "see all" is a link into
 * an unknown quantity and the client cannot tell a quiet day from a backlog
 * of forty.
 */
export async function getOverviewTotals() {
  const [activity] = await db.select({ n: count() }).from(activityLog);
  return { activity: activity?.n ?? 0 };
}

/** Units sold per product, delivered orders only. */
export async function getTopProducts(limit = 5) {
  return db
    .select({
      productId: orderItems.productId,
      title: orderItems.titleAtPurchaseEn,
      units: sql<number>`sum(${orderItems.quantity})::int`,
      revenueDzd: sql<number>`sum(${orderItems.quantity} * ${orderItems.priceAtPurchaseDzd})::int`,
    })
    .from(orderItems)
    .innerJoin(orders, eq(orders.id, orderItems.orderId))
    .where(eq(orders.status, "delivered"))
    .groupBy(orderItems.productId, orderItems.titleAtPurchaseEn)
    .orderBy(desc(sql`sum(${orderItems.quantity})`))
    .limit(limit);
}

/**
 * Students, with their live entitlement state.
 *
 * `status` on the row is what the admin set; whether it is *usable* also
 * depends on `expires_at`, computed here rather than trusted, for the same
 * reason `src/server/entitlements.ts` computes it: no cron job can be relied
 * on to have run.
 */
/** The columns the students table may be sorted by. Never a raw string. */
export const STUDENT_SORT = {
  name: users.name,
  email: users.email,
  createdAt: users.createdAt,
  state: userProfiles.state,
  status: entitlements.status,
  expiresAt: entitlements.expiresAt,
} satisfies Sortable;

export async function listStudents(query: ListQuery = {}) {
  const resolved = resolveList(query, STUDENT_SORT, { sort: "createdAt" });

  const where = [];
  if (resolved.search) {
    const q = `%${resolved.search}%`;
    where.push(sql`(${users.name} ilike ${q} or ${users.email} ilike ${q})`);
  }
  const filter = where.length ? and(...where) : undefined;

  const rows = await db
    .select({
      userId: users.id,
      name: users.name,
      email: users.email,
      createdAt: users.createdAt,
      state: userProfiles.state,
      phone: userProfiles.phone,
      level: userProfiles.level,
      entitlementId: entitlements.id,
      entitlementStatus: entitlements.status,
      expiresAt: entitlements.expiresAt,
      source: entitlements.source,
      packageTitleEn: lmsPackages.titleEn,
      isExpired: sql<boolean>`(${entitlements.expiresAt} is not null and ${entitlements.expiresAt} <= now())`,
    })
    .from(users)
    .innerJoin(userProfiles, eq(userProfiles.userId, users.id))
    .leftJoin(entitlements, eq(entitlements.userId, users.id))
    .leftJoin(lmsPackages, eq(lmsPackages.id, entitlements.packageId))
    .where(filter)
    .orderBy(resolved.orderBy)
    .limit(resolved.limit)
    .offset(resolved.offset);

  // Counted over the same joins, or the total disagrees with the pages: a
  // student with two entitlements is two rows here, and saying "23" while
  // paging 31 is worse than not saying it.
  const [counted] = await db
    .select({ n: count() })
    .from(users)
    .innerJoin(userProfiles, eq(userProfiles.userId, users.id))
    .leftJoin(entitlements, eq(entitlements.userId, users.id))
    .where(filter);

  return paged(rows, counted?.n ?? 0, resolved);
}

/** Every product an admin can act on, archived rows included. */
/**
 * One student, with everything the person about to ring them needs on screen.
 *
 * Separate from `listStudents` because the list is a join that fans out one
 * row per entitlement; here the entitlements are a list inside one person.
 */
export async function getStudent(userId: string) {
  const [person] = await db
    .select({
      userId: users.id,
      name: users.name,
      email: users.email,
      createdAt: users.createdAt,
      fullName: userProfiles.fullName,
      phone: userProfiles.phone,
      level: userProfiles.level,
      locale: userProfiles.locale,
      state: userProfiles.state,
    })
    .from(users)
    .innerJoin(userProfiles, eq(userProfiles.userId, users.id))
    .where(eq(users.id, userId))
    .limit(1);

  if (!person) return null;

  const held = await db
    .select({
      id: entitlements.id,
      status: entitlements.status,
      source: entitlements.source,
      grantedAt: entitlements.grantedAt,
      expiresAt: entitlements.expiresAt,
      packageTitleEn: lmsPackages.titleEn,
      isExpired: sql<boolean>`(${entitlements.expiresAt} is not null and ${entitlements.expiresAt} <= now())`,
    })
    .from(entitlements)
    .leftJoin(lmsPackages, eq(lmsPackages.id, entitlements.packageId))
    .where(eq(entitlements.userId, userId))
    .orderBy(desc(entitlements.grantedAt));

  return { ...person, entitlements: held };
}

export const PRODUCT_SORT = {
  title: products.titleEn,
  price: products.priceDzd,
  stock: products.stockCount,
  category: productCategories.position,
  position: products.position,
  createdAt: products.createdAt,
} satisfies Sortable;

export async function listAllProducts(query: ListQuery = {}) {
  const resolved = resolveList(query, PRODUCT_SORT, {
    sort: "position",
    direction: "asc",
  });

  const filter = resolved.search
    ? sql`(${products.titleEn} ilike ${`%${resolved.search}%`} or ${products.slug} ilike ${`%${resolved.search}%`})`
    : undefined;

  const rows = await db
    .select({
      id: products.id,
      slug: products.slug,
      titleEn: products.titleEn,
      titleAr: products.titleAr,
      titleFr: products.titleFr,
      descriptionEn: products.descriptionEn,
      descriptionAr: products.descriptionAr,
      descriptionFr: products.descriptionFr,
      priceDzd: products.priceDzd,
      compareAtDzd: products.compareAtDzd,
      categoryId: products.categoryId,
      stockCount: products.stockCount,
      containsAccessCode: products.containsAccessCode,
      accessPackageId: products.accessPackageId,
      isVisible: products.isVisible,
      isFeatured: products.isFeatured,
      sku: products.sku,
      archivedAt: products.archivedAt,
    })
    .from(products)
    .innerJoin(productCategories, eq(productCategories.id, products.categoryId))
    .where(filter)
    .orderBy(resolved.orderBy)
    .limit(resolved.limit)
    .offset(resolved.offset);

  const [counted] = await db.select({ n: count() }).from(products).where(filter);

  return paged(rows, counted?.n ?? 0, resolved);
}

/** Every product category, archived included, for the admin's own editor. */
export async function listAdminProductCategories() {
  return db.select().from(productCategories).orderBy(productCategories.position);
}

/**
 * The gallery, the spec table and the offer tiers for every product, so the
 * products screen can open a fully populated editor without a round trip per
 * row. Archived rows are excluded here; the admin edits the live set.
 */
export async function listProductDetails() {
  const [images, specs, offers, colors, promoCodesActive, promoCodeProductRows] = await Promise.all([
    db.select().from(productImages).orderBy(productImages.productId, productImages.position),
    db
      .select()
      .from(productSpecs)
      .where(isNull(productSpecs.archivedAt))
      .orderBy(productSpecs.productId, productSpecs.position),
    db
      .select()
      .from(productOffers)
      .where(isNull(productOffers.archivedAt))
      .orderBy(productOffers.productId, productOffers.minQuantity),
    // Archived colors still shown in the admin editor (greyed out, restorable)
    // the same way archived categories are — only the storefront hides them.
    db.select().from(productColors).orderBy(productColors.productId, productColors.position),
    // Product- and category-scoped codes only — cart-wide already applies
    // everywhere, so listing it per product would be noise, not signal.
    db
      .select()
      .from(promoCodes)
      .where(
        and(
          inArray(promoCodes.scopeType, ["product", "category"]),
          isNull(promoCodes.archivedAt),
        ),
      ),
    db
      .select({ promoCodeId: promoCodeProducts.promoCodeId, productId: promoCodeProducts.productId, code: promoCodes.code })
      .from(promoCodeProducts)
      .innerJoin(promoCodes, eq(promoCodes.id, promoCodeProducts.promoCodeId))
      .where(isNull(promoCodes.archivedAt)),
  ]);

  return { images, specs, offers, colors, promoCodesActive, promoCodeProductRows };
}

export const PROMO_CODE_SORT = {
  code: promoCodes.code,
  createdAt: promoCodes.createdAt,
  usedCount: promoCodes.usedCount,
} satisfies Sortable;

/** Paged, per `01_RULES.md`'s list-shape convention — never a bare limit. */
export async function listAdminPromoCodes(query: ListQuery = {}) {
  const resolved = resolveList(query, PROMO_CODE_SORT, {
    sort: "createdAt",
    direction: "desc",
  });

  const filter = resolved.search
    ? sql`${promoCodes.code} ilike ${`%${resolved.search}%`}`
    : undefined;

  const rows = await db
    .select()
    .from(promoCodes)
    .where(filter)
    .orderBy(resolved.orderBy)
    .limit(resolved.limit)
    .offset(resolved.offset);

  const [counted] = await db.select({ n: count() }).from(promoCodes).where(filter);

  return paged(rows, counted?.n ?? 0, resolved);
}

/** The full `promo_code_products` table — small, read whole for the edit form's checkbox list. */
export async function listPromoCodeProductIds() {
  return db.select().from(promoCodeProducts);
}

export const ACTIVITY_SORT = {
  createdAt: activityLog.createdAt,
  action: activityLog.action,
  entity: activityLog.entity,
  actor: users.name,
} satisfies Sortable;

/** The full revision table, sorted and paged like every other admin list. */
export async function listActivity(query: ListQuery = {}) {
  const resolved = resolveList(query, ACTIVITY_SORT, { sort: "createdAt" });

  const rows = await db
    .select({
      id: activityLog.id,
      action: activityLog.action,
      entity: activityLog.entity,
      entityId: activityLog.entityId,
      before: activityLog.before,
      after: activityLog.after,
      ip: activityLog.ip,
      createdAt: activityLog.createdAt,
      actorName: users.name,
      actorEmail: users.email,
    })
    .from(activityLog)
    .leftJoin(users, eq(users.id, activityLog.actorId))
    .orderBy(resolved.orderBy)
    .limit(resolved.limit)
    .offset(resolved.offset);

  const [counted] = await db.select({ n: count() }).from(activityLog);

  return paged(rows, counted?.n ?? 0, resolved);
}

/**
 * The whole content tree for the admin: archived and hidden rows included,
 * because this is the screen where you un-archive something.
 */
export async function getAdminContentTree() {
  const unis = await db.select().from(universities).orderBy(universities.position);

  const rows = await db
    .select({
      universityId: academicYears.universityId,
      yearId: academicYears.id,
      level: academicYears.level,
      yearNameEn: academicYears.nameEn,
      yearNameAr: academicYears.nameAr,
      yearNameFr: academicYears.nameFr,
      yearPosition: academicYears.position,
      yearArchived: academicYears.archivedAt,
      semesterId: semesters.id,
      semesterNumber: semesters.number,
      semesterLabelEn: semesters.labelEn,
      semesterLabelAr: semesters.labelAr,
      semesterLabelFr: semesters.labelFr,
      semesterArchived: semesters.archivedAt,
      moduleId: modules.id,
      moduleNameEn: modules.nameEn,
      moduleNameAr: modules.nameAr,
      moduleNameFr: modules.nameFr,
      moduleVisible: modules.isVisible,
      moduleArchived: modules.archivedAt,
      modulePosition: modules.position,
      resourceCount: sql<number>`(
        select count(*)::int from ${resources}
        where ${resources.moduleId} = ${modules.id} and ${resources.archivedAt} is null
      )`,
    })
    .from(academicYears)
    /*
     * Left, not inner. A year created by hand has no terms in it for as long
     * as it takes to add the first one, and an inner join drops it from the
     * tree — so the admin adds a year, the screen does not change, and they
     * add it again. Same argument one level down for a term with no modules.
     */
    .leftJoin(semesters, eq(semesters.academicYearId, academicYears.id))
    .leftJoin(modules, eq(modules.semesterId, semesters.id))
    .orderBy(academicYears.position, semesters.number, modules.position);

  return { universities: unis, rows };
}

/**
 * Every LMS package, archived included, with what it opens resolved to a
 * readable path down the content tree.
 *
 * `package_contents.scope_id` is not a foreign key (it points at one of four
 * tables depending on `scope_type`), so the label is resolved here rather
 * than joined in SQL — against the same tree `getAdminContentTree` already
 * builds for the Content page, so this does not run its own copy of that
 * query's joins.
 */
export async function listAdminPackages() {
  const [pkgs, scopes, tree] = await Promise.all([
    db.select().from(lmsPackages).orderBy(desc(lmsPackages.createdAt)),
    db.select().from(packageContents),
    getAdminContentTree(),
  ]);

  const uniById = new Map(tree.universities.map((u) => [u.id, u]));
  const yearById = new Map<string, { nameEn: string; universityId: string }>();
  const semesterById = new Map<string, { labelEn: string; yearId: string }>();
  const moduleById = new Map<string, { nameEn: string; semesterId: string }>();

  for (const row of tree.rows) {
    if (!yearById.has(row.yearId)) {
      yearById.set(row.yearId, { nameEn: row.yearNameEn, universityId: row.universityId });
    }
    if (row.semesterId && !semesterById.has(row.semesterId)) {
      semesterById.set(row.semesterId, {
        labelEn: row.semesterLabelEn ?? `Semester ${row.semesterNumber}`,
        yearId: row.yearId,
      });
    }
    if (row.moduleId && !moduleById.has(row.moduleId)) {
      moduleById.set(row.moduleId, {
        nameEn: row.moduleNameEn ?? "",
        semesterId: row.semesterId!,
      });
    }
  }

  function scopeLabel(scopeType: string, scopeId: string): string {
    if (scopeType === "university") {
      return uniById.get(scopeId)?.nameEn ?? "Deleted university";
    }
    if (scopeType === "year") {
      const year = yearById.get(scopeId);
      if (!year) return "Deleted year";
      return `${uniById.get(year.universityId)?.nameEn ?? "?"} — ${year.nameEn}`;
    }
    if (scopeType === "semester") {
      const semester = semesterById.get(scopeId);
      if (!semester) return "Deleted term";
      const year = yearById.get(semester.yearId);
      const uniName = year ? uniById.get(year.universityId)?.nameEn : undefined;
      return `${uniName ?? "?"} — ${year?.nameEn ?? "?"} — ${semester.labelEn}`;
    }
    const mod = moduleById.get(scopeId);
    if (!mod) return "Deleted module";
    const semester = semesterById.get(mod.semesterId);
    const year = semester ? yearById.get(semester.yearId) : undefined;
    const uniName = year ? uniById.get(year.universityId)?.nameEn : undefined;
    return `${uniName ?? "?"} — ${year?.nameEn ?? "?"} — ${semester?.labelEn ?? "?"} — ${mod.nameEn}`;
  }

  // One scope row per package, by construction of `savePackageAction`.
  const scopeByPackage = new Map(scopes.map((s) => [s.packageId, s]));

  return pkgs.map((p) => {
    const scope = scopeByPackage.get(p.id);
    return {
      id: p.id,
      titleEn: p.titleEn,
      titleAr: p.titleAr,
      titleFr: p.titleFr,
      descriptionEn: p.descriptionEn,
      descriptionAr: p.descriptionAr,
      descriptionFr: p.descriptionFr,
      priceDzd: p.priceDzd,
      defaultDurationDays: p.defaultDurationDays,
      isVisible: p.isVisible,
      archivedAt: p.archivedAt,
      scopeType: scope?.scopeType ?? null,
      scopeId: scope?.scopeId ?? null,
      scopeLabel: scope ? scopeLabel(scope.scopeType, scope.scopeId) : "Nothing set",
    };
  });
}

/**
 * The tree a package's "Opens" picker walks: non-archived branches only,
 * since scoping a new package to an archived year would grant access to
 * something students cannot see.
 */
export async function getPackageScopeTree() {
  const { universities: unis, rows } = await getAdminContentTree();

  return unis
    .filter((u) => !u.archivedAt)
    .map((u) => ({
      id: u.id,
      nameEn: u.nameEn,
      years: rows
        .filter((r) => r.universityId === u.id && !r.yearArchived)
        .filter((r, i, all) => all.findIndex((x) => x.yearId === r.yearId) === i)
        .map((y) => ({
          id: y.yearId,
          nameEn: y.yearNameEn,
          semesters: rows
            .filter((r) => r.yearId === y.yearId && r.semesterId && !r.semesterArchived)
            .filter((r, i, all) => all.findIndex((x) => x.semesterId === r.semesterId) === i)
            .map((s) => ({
              id: s.semesterId!,
              labelEn: s.semesterLabelEn ?? `Semester ${s.semesterNumber}`,
              modules: rows
                .filter((r) => r.semesterId === s.semesterId && r.moduleId && !r.moduleArchived)
                .map((m) => ({ id: m.moduleId!, nameEn: m.moduleNameEn ?? "" })),
            })),
        })),
    }));
}

/** Every resource on one module, archived included. */
export async function getModuleResources(moduleId: string) {
  return db
    .select({
      id: resources.id,
      titleEn: resources.titleEn,
      titleAr: resources.titleAr,
      titleFr: resources.titleFr,
      source: resources.source,
      externalUrl: resources.externalUrl,
      mimeType: resources.mimeType,
      sizeBytes: resources.sizeBytes,
      allowDownload: resources.allowDownload,
      isVisible: resources.isVisible,
      archivedAt: resources.archivedAt,
      position: resources.position,
      typeId: resourceTypes.id,
      typeKey: resourceTypes.key,
      typeLabelEn: resourceTypes.labelEn,
    })
    .from(resources)
    .innerJoin(resourceTypes, eq(resourceTypes.id, resources.resourceTypeId))
    .where(eq(resources.moduleId, moduleId))
    .orderBy(resourceTypes.position, resources.position);
}
