import "../../../scripts/load-env";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { sql } from "drizzle-orm";
import { hashPassword } from "better-auth/crypto";

import { createDb, schema } from "../client";
import { PERMISSIONS } from "@/lib/permissions";
import { wilayas as WILAYAS, communes as COMMUNES } from "@/data/wilayas";
import { ALL_ACCOUNTS, STAFF, STUDENTS } from "./accounts";
import {
  reconcileStock,
  seedReadingHistory,
  seedAccess,
  seedActivity,
  seedOrderHistory,
} from "./generate";
import {
  CURRICULUM,
  SEMESTER_LABELS,
  RESOURCE_TYPES,
  SAMPLE_RESOURCES,
  TAGS,
  TEMPLATE_UNIVERSITY,
} from "./content";
import {
  LMS_PACKAGES,
  PRODUCTS,
  SHIPPING_DEFAULT,
  SHIPPING_EXCEPTIONS,
} from "./catalogue";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set.");

const STORAGE_ROOT = path.resolve(process.env.STORAGE_ROOT ?? "./.storage");


const { db, close } = createDb(url, { max: 1 });

/** Order matters: children before parents, because nothing here cascades. */
const TABLES_IN_TEARDOWN_ORDER = [
  "announcement_views",
  "announcements",
  "study_plan_items",
  "study_plans",
  "bookmarks",
  "module_progress",
  "resource_views",
  "testimonials",
  "roster_members",
  "contact_messages",
  "activity_log",
  "entitlements",
  "access_requests",
  "access_codes",
  "code_batches",
  "order_items",
  "orders",
  "promo_codes",
  "product_images",
  "products",
  "package_contents",
  "lms_packages",
  "resource_tags",
  "tags",
  "resources",
  "resource_types",
  "modules",
  "semesters",
  "academic_years",
  "universities",
  "shipping_rates",
  "communes",
  "wilayas",
  "session_counters",
  "user_permissions",
  "user_profiles",
  "sessions",
  "accounts",
  "verifications",
  "users",
];

async function teardown() {
  // TRUNCATE, not DELETE. The no-delete rule governs application code; a dev
  // seed script resetting a scratch database is not application code.
  await db.execute(
    sql.raw(
      `TRUNCATE TABLE ${TABLES_IN_TEARDOWN_ORDER.map((t) => `"${t}"`).join(", ")} RESTART IDENTITY CASCADE`,
    ),
  );
}

async function seedGeography() {
  await db.insert(schema.wilayas).values(
    WILAYAS.map((w) => ({ code: w.id, nameFr: w.name, nameAr: w.nameAr })),
  );

  await db.insert(schema.communes).values(
    COMMUNES.map((c) => ({
      id: c.id,
      wilayaCode: c.wilayaId,
      nameFr: c.name,
      nameAr: c.nameAr,
    })),
  );
  // The ids above are explicit, so the sequence has to be moved past them or
  // the first admin-created commune collides.
  await db.execute(
    sql`SELECT setval(pg_get_serial_sequence('communes', 'id'), (SELECT max(id) FROM communes))`,
  );

  await db.insert(schema.shippingRates).values(
    WILAYAS.map((w) => ({
      wilayaCode: w.id,
      ...(SHIPPING_EXCEPTIONS[w.id] ?? SHIPPING_DEFAULT),
    })),
  );

  return WILAYAS.length;
}

async function seedUsers() {
  const created: Record<string, string> = {};

  for (const spec of ALL_ACCOUNTS) {
    const id = randomUUID();
    await db.insert(schema.users).values({
      id,
      name: spec.name,
      email: spec.email,
      emailVerified: true,
    });
    await db.insert(schema.accounts).values({
      id: randomUUID(),
      accountId: id,
      providerId: "credential",
      userId: id,
      password: await hashPassword(spec.password),
    });
    created[spec.key] = id;

    await db.insert(schema.userProfiles).values({
      userId: id,
      fullName: spec.name,
      phone: spec.profile?.phone ?? null,
      level: spec.profile?.level ?? null,
      locale: spec.profile?.locale ?? "en",
      state: spec.profile?.state ?? "active",
    });

    if (spec.permissions?.length) {
      await db
        .insert(schema.userPermissions)
        .values(spec.permissions.map((permission) => ({ userId: id, permission })));
    }
  }

  return created;
}

async function seedContentTree() {
  const [university] = await db
    .insert(schema.universities)
    .values({ ...TEMPLATE_UNIVERSITY, position: 1 })
    .returning();

  const moduleIdsByName = new Map<string, string>();
  const semesterIds: Record<string, string> = {};
  const yearIds: Record<string, string> = {};

  let yearPosition = 0;
  for (const [level, semesters] of Object.entries(CURRICULUM)) {
    yearPosition += 1;
    const [year] = await db
      .insert(schema.academicYears)
      .values({
        universityId: university.id,
        // EPAU runs LMD, so the tag and the name agree here. They need not.
        nameEn: level,
        level: level as "L1",
        position: yearPosition,
      })
      .returning();
    yearIds[level] = year.id;

    for (const [semKey, mods] of Object.entries(semesters)) {
      const number = semKey === "s1" ? 1 : 2;
      const labels = SEMESTER_LABELS.find((l) => l.number === number)!;
      const [semester] = await db
        .insert(schema.semesters)
        .values({
          academicYearId: year.id,
          number,
          labelEn: labels.labelEn,
          labelFr: labels.labelFr,
          labelAr: labels.labelAr,
        })
        .returning();
      semesterIds[`${level}-${number}`] = semester.id;

      let position = 0;
      for (const mod of mods) {
        position += 1;
        const [row] = await db
          .insert(schema.modules)
          .values({ semesterId: semester.id, position, ...mod })
          .returning();
        moduleIdsByName.set(`${level}-${number}-${mod.nameEn}`, row.id);
      }
    }
  }

  const typeRows = await db
    .insert(schema.resourceTypes)
    .values(RESOURCE_TYPES.map((t) => ({ ...t, isSystem: true })))
    .returning();
  const typeByKey = new Map(typeRows.map((t) => [t.key, t.id]));

  const tagRows = await db.insert(schema.tags).values(TAGS).returning();
  const tagBySlug = new Map(tagRows.map((t) => [t.slug, t.id]));

  await mkdir(path.join(STORAGE_ROOT, "resources"), { recursive: true });

  let resourceCount = 0;
  for (const [moduleName, items] of Object.entries(SAMPLE_RESOURCES)) {
    const moduleId = moduleIdsByName.get(`L1-1-${moduleName}`);
    if (!moduleId) continue;

    let position = 0;
    for (const item of items) {
      position += 1;
      let filePath: string | null = null;
      let sizeBytes: number | null = null;

      if (item.source === "file" && item.fileName) {
        filePath = path.posix.join("resources", item.fileName);
        const bytes = placeholderPdf(item.titleEn);
        await writeFile(path.join(STORAGE_ROOT, filePath), bytes);
        sizeBytes = bytes.length;
      }

      const [resource] = await db
        .insert(schema.resources)
        .values({
          moduleId,
          resourceTypeId: typeByKey.get(item.typeKey)!,
          titleEn: item.titleEn,
          titleFr: item.titleFr ?? null,
          titleAr: item.titleAr ?? null,
          source: item.source,
          filePath,
          externalUrl: item.externalUrl ?? null,
          mimeType: item.source === "file" ? "application/pdf" : null,
          sizeBytes,
          allowDownload: item.allowDownload ?? false,
          position,
        })
        .returning();
      resourceCount += 1;

      if (item.tags?.length) {
        await db.insert(schema.resourceTags).values(
          item.tags.map((slug) => ({
            resourceId: resource.id,
            tagId: tagBySlug.get(slug)!,
          })),
        );
      }
    }
  }

  return { university, yearIds, semesterIds, resourceCount };
}

async function seedPackagesAndProducts(tree: Awaited<ReturnType<typeof seedContentTree>>) {
  const packageIds: Record<string, string> = {};

  for (const pkg of LMS_PACKAGES) {
    const { key, scope, ...values } = pkg;
    const [row] = await db.insert(schema.lmsPackages).values(values).returning();
    packageIds[key] = row.id;

    const scopeId =
      scope.type === "semester"
        ? tree.semesterIds[`${scope.level}-${scope.semester}`]
        : tree.yearIds[scope.level];

    await db
      .insert(schema.packageContents)
      .values({ packageId: row.id, scopeType: scope.type, scopeId });
  }

  // Migration 0008 seeds these four rows unconditionally, so they exist
  // before this script ever runs — read them back rather than inserting.
  const categoryRows = await db.select().from(schema.productCategories);
  const categoryIds = Object.fromEntries(categoryRows.map((c) => [c.key, c.id]));

  let position = 0;
  const productIds: Record<string, string> = {};
  for (const product of PRODUCTS) {
    position += 1;
    const {
      image,
      images,
      altEn,
      altFr,
      altAr,
      accessPackage,
      category,
      specs,
      offers,
      ...values
    } = product as (typeof PRODUCTS)[number] & {
      image?: string;
      images?: { file: string; altEn: string; altFr: string; altAr: string }[];
      altEn?: string;
      altFr?: string;
      altAr?: string;
      accessPackage?: string;
      specs?: {
        labelEn: string; labelFr: string; labelAr: string;
        valueEn: string; valueFr: string; valueAr: string;
      }[];
      offers?: {
        minQuantity: number; kind: "percent" | "unit_price"; value: number;
        labelEn: string; labelFr: string; labelAr: string;
      }[];
    };

    const [row] = await db
      .insert(schema.products)
      .values({
        ...values,
        position,
        categoryId: categoryIds[category],
        accessPackageId: accessPackage ? packageIds[accessPackage] : null,
      })
      .returning();
    productIds[product.slug] = row.id;

    // A product carries either one image or a gallery. Both land in the same
    // table; `position` 1 is the one the card shows.
    const gallery = images ?? (image ? [{ file: image, altEn: altEn!, altFr: altFr!, altAr: altAr! }] : []);
    for (const [index, item] of gallery.entries()) {
      await db.insert(schema.productImages).values({
        productId: row.id,
        path: `seed/${item.file}`,
        position: index + 1,
        altEn: item.altEn,
        altFr: item.altFr,
        altAr: item.altAr,
      });
    }

    if (specs?.length) {
      await db.insert(schema.productSpecs).values(
        specs.map((spec, index) => ({ ...spec, productId: row.id, position: index })),
      );
    }

    if (offers?.length) {
      await db.insert(schema.productOffers).values(
        offers.map((offer, index) => ({ ...offer, productId: row.id, position: index })),
      );
    }
  }

  return { packageIds, productIds };
}



/**
 * Six placeholder screenshots (`public/testimonials/t1..t6.webp`), standing
 * in for the review screenshots the client will actually upload from the
 * admin. Demo data only, same `seed/` convention as the product fixtures.
 */
async function seedTestimonials() {
  await db.insert(schema.testimonials).values(
    Array.from({ length: 6 }, (_, i) => ({
      imagePath: `seed/t${i + 1}.webp`,
      position: i + 1,
    })),
  );
}

/**
 * Six placeholder avatars (`public/roster/r1..r6.webp`), standing in for the
 * team photos the client will actually upload from the admin.
 */
async function seedRoster() {
  const members = [
    { name: "Omar L.", roleEn: "Founder", roleFr: "Fondateur", roleAr: "المؤسس" },
    { name: "Amel K.", roleEn: "Operations", roleFr: "Opérations", roleAr: "العمليات" },
    { name: "Riyad B.", roleEn: "Logistics", roleFr: "Logistique", roleAr: "اللوجستيك" },
    { name: "Nassim H.", roleEn: "Course content", roleFr: "Contenu des cours", roleAr: "محتوى الدروس" },
    { name: "Sarah M.", roleEn: "Design", roleFr: "Design", roleAr: "التصميم" },
    { name: "Bilal Z.", roleEn: "Customer support", roleFr: "Support client", roleAr: "دعم الزبائن" },
  ];

  await db.insert(schema.rosterMembers).values(
    members.map((m, i) => ({ ...m, imagePath: `seed/r${i + 1}.webp`, position: i + 1 })),
  );
}

/** Minimal valid one-page PDF, so the streaming route has real bytes to serve. */
function placeholderPdf(title: string): Buffer {
  const text = title.replace(/[()\\]/g, "");
  const content = `BT /F1 16 Tf 60 720 Td (${text}) Tj ET`;
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>",
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [];
  objects.forEach((body, i) => {
    offsets.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${body}\nendobj\n`;
  });

  const xrefStart = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets) {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;

  return Buffer.from(pdf, "latin1");
}

async function seedRolePresets() {
  await db
    .insert(schema.rolePresets)
    .values([
      {
        slug: "super_admin",
        name: "Super Admin",
        description: "Full access to everything including team management & settings",
        color: "purple",
        permissions: [...PERMISSIONS],
        isSystem: true,
        position: 1,
      },
      {
        slug: "admin",
        name: "Admin",
        description: "Operational management without user access control",
        color: "blue",
        permissions: PERMISSIONS.filter((p) => p !== "users.manage"),
        isSystem: true,
        position: 2,
      },
      {
        slug: "moderator",
        name: "Content Moderator",
        description: "Manage content hub, courses, library, students & view orders",
        color: "emerald",
        permissions: [
          "content.manage",
          "content.publish",
          "students.view",
          "orders.view",
          "posts.manage",
          "software.manage",
          "library.manage",
          "courses.manage",
        ],
        isSystem: true,
        position: 3,
      },
      {
        slug: "order_handler",
        name: "Order Handler",
        description: "View, edit, and call/confirm incoming store orders",
        color: "amber",
        permissions: ["orders.view", "orders.edit", "orders.confirm"],
        isSystem: true,
        position: 4,
      },
    ])
    .onConflictDoNothing();
}

async function main() {
  console.log("Resetting…");
  await teardown();

  await seedRolePresets();
  console.log("  4 role presets seeded");

  const wilayaCount = await seedGeography();
  console.log(`  ${wilayaCount} wilayas, ${COMMUNES.length} communes, shipping rates`);

  const users = await seedUsers();
  console.log(`  ${Object.keys(users).length} accounts with permissions`);

  const tree = await seedContentTree();
  console.log(
    `  1 university, 5 years, 10 semesters, ${tree.resourceCount} sample resources`,
  );

  const ids = await seedPackagesAndProducts(tree);
  console.log(`  ${LMS_PACKAGES.length} LMS packages, ${PRODUCTS.length} products`);

  const access = await seedAccess(db, users, ids.packageIds);
  console.log(
    `  ${access.batchCount} code batches, ${access.codeCount} codes, entitlements and receipts`,
  );

  const orderCount = await seedOrderHistory(db, ids.productIds, 60);
  console.log(`  ${orderCount} orders across 60 days`);

  const logged = await seedActivity(db, users);
  console.log(`  ${logged} activity entries`);

  const opens = await seedReadingHistory(db);
  console.log(`  ${opens} resource views, and the progress derived from them`);

  await reconcileStock(db);
  await seedTestimonials();
  await seedRoster();

  const pad = (s: string, n: number) => s.padEnd(n);

  console.log("\n── Staff ─────────────────────────────────────────────");
  for (const a of STAFF) {
    console.log(`  ${pad(a.email, 32)} ${pad(a.password, 16)} ${a.permissions?.length ?? 0} permissions`);
  }

  console.log("\n── Students ──────────────────────────────────────────");
  for (const a of STUDENTS) {
    const note = a.profile?.access
      ? `${a.profile.access.status} via ${a.profile.access.source}`
      : a.profile?.pendingRequest
        ? "receipt waiting"
        : a.profile?.reviewedRequest
          ? `receipt ${a.profile.reviewedRequest.status}`
          : "signed up, nothing else";
    console.log(`  ${pad(a.email, 32)} ${pad(a.password, 16)} ${note}`);
  }

  console.log("\n── Codes to try ──────────────────────────────────────");
  console.log(`  unused: ${access.sample.join(", ")}`);
  if (access.voided) console.log(`  voided: ${access.voided}`);
  console.log("\nFull list in _BUILD/CREDENTIALS.md\n");
}

main()
  .then(() => close())
  .catch(async (error) => {
    console.error(error);
    await close();
    process.exit(1);
  });
