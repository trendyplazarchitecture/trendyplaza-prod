import { sql } from "drizzle-orm";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { createDb, schema } from "@/db/client";

const url = process.env.TEST_DATABASE_URL!;

export const { db, close } = createDb(url, { max: 20 });
export { schema };

let migrated = false;

export async function prepareDatabase() {
  if (!migrated) {
    await migrate(db, { migrationsFolder: "./drizzle" });
    migrated = true;
  }
  await truncateAll();
}

export async function truncateAll() {
  const rows = await db.execute<{ tablename: string }>(sql`
    select tablename from pg_tables
    where schemaname = 'public' and tablename <> '__drizzle_migrations'
  `);
  const names = rows.map((r) => `"${r.tablename}"`).join(", ");
  if (!names) return;

  /*
   * Retried, because `/api/resource/[id]` records a view without awaiting it.
   * That is deliberate: a student must not wait on a write they did not ask
   * for. It means the write can still be in flight when the next test starts,
   * holding a row lock on `resource_views` while this TRUNCATE wants an
   * exclusive lock on every table, and Postgres calls the deadlock.
   *
   * The write is a short transaction, so a brief retry always wins. Failing
   * the whole suite over it would be failing over the feature working as
   * designed.
   */
  for (let attempt = 0; ; attempt += 1) {
    try {
      await db.execute(sql.raw(`TRUNCATE TABLE ${names} RESTART IDENTITY CASCADE`));
      return;
    } catch (error) {
      // Drizzle wraps the driver error, so the SQLSTATE is on the cause and
      // the message on the wrapper is only "Failed query".
      if (!isDeadlock(error) || attempt >= 8) throw error;
      await new Promise((r) => setTimeout(r, 50 * (attempt + 1)));
    }
  }
}

/** Walks the cause chain for SQLSTATE 40P01. */
function isDeadlock(error: unknown): boolean {
  for (let e = error, depth = 0; e && depth < 5; depth += 1) {
    const err = e as { code?: string; message?: string; cause?: unknown };
    if (err.code === "40P01") return true;
    if (typeof err.message === "string" && /deadlock detected/i.test(err.message)) {
      return true;
    }
    e = err.cause;
  }
  return false;
}

/** The smallest fixture that can hold an entitlement: a user, a package, a scope. */
export async function seedMinimal() {
  const [user] = await db
    .insert(schema.users)
    .values({
      id: crypto.randomUUID(),
      name: "Test Student",
      email: `student-${crypto.randomUUID()}@example.dz`,
    })
    .returning();

  const [pkg] = await db
    .insert(schema.lmsPackages)
    .values({
      titleEn: "Test package",
      titleFr: "Pack de test",
      titleAr: "حزمة اختبار",
      priceDzd: 500000,
      defaultDurationDays: 180,
    })
    .returning();

  return { user, pkg };
}

/**
 * A university with L1, L2 and L3, one semester and one module in each, and one
 * file resource per module.
 *
 * Three years rather than two on purpose: scope resolution is only interesting
 * when there is a level above the grant and a level beside it, so the negative
 * case has somewhere to fail.
 */
export async function seedContentTree() {
  const [university] = await db
    .insert(schema.universities)
    .values({
      slug: `uni-${crypto.randomUUID().slice(0, 8)}`,
      nameEn: "Test University",
      nameFr: "Université de test",
      nameAr: "جامعة الاختبار",
    })
    .returning();

  const [resourceType] = await db
    .insert(schema.resourceTypes)
    .values({ key: `cours-${crypto.randomUUID().slice(0, 8)}`, labelEn: "Cours" })
    .returning();

  const levels = ["L1", "L2", "L3"] as const;
  const years: Record<
    (typeof levels)[number],
    { yearId: string; semesterId: string; moduleId: string; resourceId: string }
  > = {} as never;

  for (const [index, level] of levels.entries()) {
    const [year] = await db
      .insert(schema.academicYears)
      .values({ universityId: university.id, nameEn: level, level, position: index })
      .returning();

    const [semester] = await db
      .insert(schema.semesters)
      .values({ academicYearId: year.id, number: 1, labelEn: `${level} S1` })
      .returning();

    const [module] = await db
      .insert(schema.modules)
      .values({
        semesterId: semester.id,
        nameEn: `${level} Atelier`,
        nameFr: `Atelier ${level}`,
      })
      .returning();

    const [resource] = await db
      .insert(schema.resources)
      .values({
        moduleId: module.id,
        resourceTypeId: resourceType.id,
        titleEn: `${level} lecture`,
        source: "file",
        filePath: `resources/${crypto.randomUUID()}.pdf`,
        mimeType: "application/pdf",
      })
      .returning();

    years[level] = {
      yearId: year.id,
      semesterId: semester.id,
      moduleId: module.id,
      resourceId: resource.id,
    };
  }

  return { university, resourceType, years };
}

/** Points a package at one node of the tree. The package grants what this reaches. */
export async function addScope(
  packageId: string,
  scopeType: "university" | "year" | "semester" | "module",
  scopeId: string,
) {
  await db
    .insert(schema.packageContents)
    .values({ packageId, scopeType, scopeId });
}

/**
 * The smallest fixture a store order can be placed against: one wilaya, one
 * commune inside it, a shipping rate, and a product with stock.
 *
 * Wilaya 16 because Algiers is the one every manual test uses.
 */
export async function seedStore(
  overrides: { priceDzd?: number; stockCount?: number } = {},
) {
  await db
    .insert(schema.wilayas)
    .values({ code: 16, nameFr: "Alger", nameAr: "الجزائر" })
    .onConflictDoNothing();

  const [commune] = await db
    .insert(schema.communes)
    .values({ wilayaCode: 16, nameFr: "Bab Ezzouar", nameAr: "باب الزوار" })
    .returning();

  await db
    .insert(schema.shippingRates)
    .values({ wilayaCode: 16, homeDzd: 60000, deskDzd: 40000 })
    .onConflictDoNothing();

  const [category] = await db
    .insert(schema.productCategories)
    .values({ key: `test-${crypto.randomUUID().slice(0, 8)}`, labelEn: "Test category" })
    .returning();

  const [product] = await db
    .insert(schema.products)
    .values({
      slug: `product-${crypto.randomUUID().slice(0, 8)}`,
      titleEn: "Drawing tube",
      titleFr: "Tube à dessin",
      titleAr: "أنبوب رسم",
      priceDzd: overrides.priceDzd ?? 250000,
      stockCount: overrides.stockCount ?? 10,
      categoryId: category.id,
    })
    .returning();

  return { commune, product, wilayaCode: 16, homeDzd: 60000, deskDzd: 40000 };
}
