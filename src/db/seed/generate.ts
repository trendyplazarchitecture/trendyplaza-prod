import { randomUUID } from "node:crypto";
import { eq, sql } from "drizzle-orm";

import { schema } from "../client";
import { generateCodeBatch } from "@/lib/codes";
import { communes as COMMUNES } from "@/data/wilayas";
import { PRODUCTS, SHIPPING_DEFAULT, SHIPPING_EXCEPTIONS } from "./catalogue";
import { STUDENTS } from "./accounts";
import {
  CANCEL_REASONS,
  CUSTOMER_NAMES,
  makeRandom,
  ordersOnDay,
  pickWeighted,
  statusForAge,
} from "./history";

/** The connection the seed runner built. Scripts only; never the app singleton. */
type Db = ReturnType<typeof import("../client").createDb>["db"];

const DAY = 24 * 60 * 60 * 1000;

/** Codes, batches, entitlements and access requests for the seeded students. */
export async function seedAccess(
  db: Db,
  users: Record<string, string>,
  packageIds: Record<string, string>,
) {
  const batches = [
    { label: "Gift cards, first print run", prefix: "TPS1", quantity: 120, pkg: "s1-l1", days: 180, exported: true },
    { label: "Gift cards, full year", prefix: "TPY1", quantity: 60, pkg: "annee-l1", days: 365, exported: true },
    { label: "Gift cards, second print run", prefix: "TPS2", quantity: 200, pkg: "s1-l1", days: 180, exported: false },
  ];

  const allCodes: { code: string; packageKey: string; batchId: string; days: number }[] = [];

  for (const spec of batches) {
    const [batch] = await db
      .insert(schema.codeBatches)
      .values({
        label: spec.label,
        packageId: packageIds[spec.pkg],
        prefix: spec.prefix,
        quantity: spec.quantity,
        durationDays: spec.days,
        createdBy: users.superAdmin,
        exportedAt: spec.exported ? new Date(Date.now() - 20 * DAY) : null,
      })
      .returning();

    const codes = generateCodeBatch(spec.prefix, spec.quantity);
    await db.insert(schema.accessCodes).values(
      codes.map((code) => ({
        code,
        batchId: batch.id,
        packageId: packageIds[spec.pkg],
        durationDays: spec.days,
      })),
    );

    for (const code of codes) {
      allCodes.push({ code, packageKey: spec.pkg, batchId: batch.id, days: spec.days });
    }
  }

  const random = makeRandom(0xc0de);
  const usedCodes: string[] = [];

  // Redeem a slice of the printed cards against anonymous history, so the
  // "how students are getting in" split is not two bars of one.
  const backgroundRedemptions = 34;

  for (const student of STUDENTS) {
    const userId = users[student.key];
    const access = student.profile?.access;

    if (access) {
      const expiresAt =
        access.expiresInDays === null
          ? null
          : new Date(Date.now() + access.expiresInDays * DAY);

      let sourceId: string | null = null;

      if (access.source === "code") {
        const candidate = allCodes.find(
          (c) => c.packageKey === access.packageKey && !usedCodes.includes(c.code),
        );
        if (candidate) {
          usedCodes.push(candidate.code);
          const [row] = await db
            .update(schema.accessCodes)
            .set({
              isRedeemed: true,
              redeemedByUserId: userId,
              redeemedAt: new Date(Date.now() - 30 * DAY),
            })
            .where(eq(schema.accessCodes.code, candidate.code))
            .returning({ id: schema.accessCodes.id });
          sourceId = row?.id ?? null;
        }
      }

      await db.insert(schema.entitlements).values({
        userId,
        packageId: packageIds[access.packageKey],
        source: access.source,
        sourceId,
        expiresAt,
        status: access.status,
        grantedAt: new Date(Date.now() - 30 * DAY),
      });
    }

    // A receipt in the queue, or one already decided.
    const pending = student.profile?.pendingRequest;
    const reviewed = student.profile?.reviewedRequest;

    if (pending) {
      await db.insert(schema.accessRequests).values({
        userId,
        packageId: packageIds[pending.packageKey],
        // No file on disk. The review screen falls back to a PDF placeholder
        // rather than a broken image, which is also what a real PDF receipt
        // does.
        receiptPath: `receipts/seed-${randomUUID()}.pdf`,
        receiptMime: "application/pdf",
        amountClaimedDzd: pending.amountDzd,
        status: "pending",
        createdAt: new Date(Date.now() - Math.floor(random() * 3 + 1) * DAY),
      });
    }

    if (reviewed) {
      await db.insert(schema.accessRequests).values({
        userId,
        packageId: packageIds[reviewed.packageKey],
        receiptPath: `receipts/seed-${randomUUID()}.pdf`,
        receiptMime: "application/pdf",
        amountClaimedDzd: null,
        status: reviewed.status,
        reviewedBy: users.clientAdmin,
        reviewedAt: new Date(Date.now() - 6 * DAY),
        rejectionReasonEn:
          reviewed.status === "rejected"
            ? "The receipt is for a different account name. Send one that matches, or tell us who paid."
            : null,
        createdAt: new Date(Date.now() - 8 * DAY),
      });
    }
  }

  // Anonymous redemptions, so the batch progress bars and the access mix have
  // something to show.
  const spare = allCodes.filter((c) => !usedCodes.includes(c.code));
  for (let i = 0; i < backgroundRedemptions && i < spare.length; i += 1) {
    await db
      .update(schema.accessCodes)
      .set({
        isRedeemed: true,
        redeemedAt: new Date(Date.now() - Math.floor(random() * 45) * DAY),
      })
      .where(eq(schema.accessCodes.code, spare[i].code));
  }

  // One voided card, so the lookup tool has a void state to display.
  const toVoid = spare[spare.length - 1];
  if (toVoid) {
    await db
      .update(schema.accessCodes)
      .set({
        voidedAt: new Date(Date.now() - 4 * DAY),
        voidReason: "Card damaged in the box, reissued to the customer",
      })
      .where(eq(schema.accessCodes.code, toVoid.code));
  }

  return {
    batchCount: batches.length,
    codeCount: allCodes.length,
    sample: spare.slice(0, 3).map((c) => c.code),
    voided: toVoid?.code ?? null,
  };
}

/** Sixty days of orders. See history.ts for why the distribution looks like this. */
export async function seedOrderHistory(
  db: Db,
  productIds: Record<string, string>,
  days = 60,
) {
  const random = makeRandom(0x0d3e5);
  const communeByWilaya = new Map<number, number[]>();
  for (const c of COMMUNES) {
    const list = communeByWilaya.get(c.wilayaId) ?? [];
    list.push(c.id);
    communeByWilaya.set(c.wilayaId, list);
  }

  let sequence = 0;
  let created = 0;

  for (let age = days; age >= 0; age -= 1) {
    const placedAt = new Date(Date.now() - age * DAY);
    const count = ordersOnDay(placedAt, random);

    for (let n = 0; n < count; n += 1) {
      sequence += 1;
      const wilayaCode = pickWeighted(random);
      const communes = communeByWilaya.get(wilayaCode) ?? [];
      if (communes.length === 0) continue;

      const communeId = communes[Math.floor(random() * communes.length)];
      const deliveryType = random() < 0.42 ? "desk" : "home";
      const rates = SHIPPING_EXCEPTIONS[wilayaCode] ?? SHIPPING_DEFAULT;
      const shippingDzd = deliveryType === "home" ? rates.homeDzd : rates.deskDzd;

      // One or two lines, weighted to one, which is what a real basket looks
      // like for this catalogue.
      const lineCount = random() < 0.72 ? 1 : 2;
      const chosen: typeof PRODUCTS = [];
      while (chosen.length < lineCount) {
        const candidate = PRODUCTS[Math.floor(random() * PRODUCTS.length)];
        if (!chosen.includes(candidate)) chosen.push(candidate);
      }

      const lines = chosen.map((product) => ({
        product,
        quantity: random() < 0.85 ? 1 : 2,
      }));

      const subtotalDzd = lines.reduce(
        (sum, l) => sum + l.product.priceDzd * l.quantity,
        0,
      );
      const status = statusForAge(age, random);
      const confirmed = status !== "pending" && status !== "cancelled";

      const stamp = `${String(placedAt.getFullYear()).slice(2)}${String(
        placedAt.getMonth() + 1,
      ).padStart(2, "0")}`;

      const [order] = await db
        .insert(schema.orders)
        .values({
          reference: `TP-${stamp}-${String(sequence).padStart(4, "0")}`,
          customerName: CUSTOMER_NAMES[Math.floor(random() * CUSTOMER_NAMES.length)],
          phone: `0${[5, 6, 7][Math.floor(random() * 3)]}${String(
            Math.floor(random() * 100000000),
          ).padStart(8, "0")}`,
          wilayaCode,
          communeId,
          deliveryType,
          address: deliveryType === "home" ? "Cité 200 logements, bâtiment B" : null,
          subtotalDzd,
          shippingDzd,
          totalDzd: subtotalDzd + shippingDzd,
          status,
          confirmedAt: confirmed ? new Date(placedAt.getTime() + 6 * 60 * 60 * 1000) : null,
          cancelReasonEn:
            status === "cancelled"
              ? CANCEL_REASONS[Math.floor(random() * CANCEL_REASONS.length)]
              : null,
          createdAt: placedAt,
        })
        .returning();

      await db.insert(schema.orderItems).values(
        lines.map((l) => ({
          orderId: order.id,
          productId: productIds[l.product.slug],
          quantity: l.quantity,
          priceAtPurchaseDzd: l.product.priceDzd,
          titleAtPurchaseEn: l.product.titleEn,
          titleAtPurchaseFr: l.product.titleFr,
          titleAtPurchaseAr: l.product.titleAr,
          fulfillmentStatus: status,
        })),
      );

      created += 1;
    }
  }

  return created;
}

/** A plausible revision table, so the log and the overview are not empty. */
export async function seedActivity(db: Db, users: Record<string, string>) {
  const random = makeRandom(0xa11);
  const entries: { action: string; entity: string; actor: string }[] = [
    { action: "orders.confirmed", entity: "order", actor: "orderMod" },
    { action: "orders.shipped", entity: "order", actor: "orderMod" },
    { action: "orders.delivered", entity: "order", actor: "orderMod" },
    { action: "codes.batch_created", entity: "code_batch", actor: "superAdmin" },
    { action: "codes.batch_exported", entity: "code_batch", actor: "superAdmin" },
    { action: "access_requests.approved", entity: "access_request", actor: "clientAdmin" },
    { action: "content.published", entity: "resource", actor: "contentMod" },
    { action: "products.updated", entity: "product", actor: "clientAdmin" },
    { action: "entitlements.paused", entity: "entitlement", actor: "clientAdmin" },
    { action: "orders.exported", entity: "order", actor: "clientAdmin" },
  ];

  const rows = [];
  for (let i = 0; i < 40; i += 1) {
    const entry = entries[Math.floor(random() * entries.length)];
    rows.push({
      actorId: users[entry.actor] ?? null,
      action: entry.action,
      entity: entry.entity,
      entityId: randomUUID(),
      ip: `41.${Math.floor(random() * 200)}.${Math.floor(random() * 200)}.${Math.floor(random() * 200)}`,
      createdAt: new Date(Date.now() - Math.floor(random() * 20 * DAY)),
    });
  }

  await db.insert(schema.activityLog).values(rows);
  return rows.length;
}

/**
 * Reading history, so the student dashboard has something on it.
 *
 * Everything a student can reach is opened for a plausible fraction of the
 * resources: some modules finished, some part-read, one left untouched. A
 * dashboard demoed against an empty progress table only ever shows the empty
 * state, which is the one screen that needed no work.
 *
 * `module_progress` is derived here with the same rule the application uses:
 * complete means every visible resource has a view.
 */
export async function seedReadingHistory(db: Db) {
  const random = makeRandom(0xbead);

  // Only students who actually hold live access; entitlement is what the
  // dashboard filters on, so seeding beyond it would seed rows nothing renders.
  const rows = await db.execute<{
    user_id: string;
    resource_id: string;
    module_id: string;
  }>(sql`
    select distinct e.user_id, r.id as resource_id, m.id as module_id
      from entitlements e
      join package_contents pc on pc.package_id = e.package_id
      join modules m on true
      join semesters s on s.id = m.semester_id
      join academic_years ay on ay.id = s.academic_year_id
      join resources r on r.module_id = m.id
     where e.status = 'active'
       -- All four scope levels. Written as one predicate rather than as join
       -- conditions: as joins, a semester- or module-scoped package matched
       -- nothing at all, and most of the seeded students silently got no
       -- reading history.
       and (
            (pc.scope_type = 'university' and ay.university_id = pc.scope_id)
         or (pc.scope_type = 'year'       and ay.id = pc.scope_id)
         or (pc.scope_type = 'semester'   and s.id  = pc.scope_id)
         or (pc.scope_type = 'module'     and m.id  = pc.scope_id)
       )
       and r.is_visible = true and r.archived_at is null
       and m.archived_at is null and s.archived_at is null and ay.archived_at is null
     order by e.user_id, m.id, r.id
  `);
  if (rows.length === 0) return 0;

  /*
   * Decided per module rather than rolled per resource.
   *
   * A flat probability was the first attempt and it produced three modules,
   * all complete, because the seed's modules hold two or three resources each
   * and 70% of three rounds to three. The dashboard then had no "open now"
   * state to show, which is the half of it worth looking at.
   *
   * So each student's modules are dealt in turn: finished, part-read,
   * untouched, and round again. Every state on the dashboard is populated for
   * somebody.
   */
  type ViewRow = { user_id: string; resource_id: string; module_id: string };
  const byStudentModule = new Map<string, ViewRow[]>();
  for (const row of rows) {
    const key = `${row.user_id}::${row.module_id}`;
    const list = byStudentModule.get(key) ?? [];
    list.push(row);
    byStudentModule.set(key, list);
  }

  // Dealt within each student, not across all of them. Dealing globally left
  // most students with nothing, because the seed has few modules and the
  // cycle ran out before it reached them.
  const byStudent = new Map<string, ViewRow[][]>();
  for (const [key, group] of byStudentModule) {
    const userId = key.split("::")[0];
    const list = byStudent.get(userId) ?? [];
    list.push(group);
    byStudent.set(userId, list);
  }

  const views: { userId: string; resourceId: string; viewedAt: Date }[] = [];
  for (const groups of byStudent.values()) {
    groups.forEach((group, index) => {
      // Finished, part-read, untouched, and round again. With three modules a
      // student ends up with one of each, which is every state the dashboard
      // can show.
      const outcome = index % 3;
      if (outcome === 2) return;

      const take = outcome === 0 ? group.length : Math.max(1, group.length - 1);

      for (const row of group.slice(0, take)) {
        const opens = 1 + Math.floor(random() * 3);
        for (let i = 0; i < opens; i += 1) {
          views.push({
            userId: row.user_id,
            resourceId: row.resource_id,
            viewedAt: new Date(Date.now() - Math.floor(random() * 21 * DAY)),
          });
        }
      }
    });
  }
  if (views.length === 0) return 0;

  await db.insert(schema.resourceViews).values(views);

  await db.execute(sql`
    insert into module_progress
      (user_id, module_id, started_at, last_viewed_at, completed_at, viewed_count, last_resource_id)
    select v.user_id,
           r.module_id,
           min(v.viewed_at),
           max(v.viewed_at),
           case when not exists (
             select 1 from resources r2
              where r2.module_id = r.module_id
                and r2.is_visible = true and r2.archived_at is null
                and not exists (
                  select 1 from resource_views v2
                   where v2.resource_id = r2.id and v2.user_id = v.user_id
                )
           ) then max(v.viewed_at) else null end,
           count(*)::int,
           (array_agg(v.resource_id order by v.viewed_at desc))[1]
      from resource_views v
      join resources r on r.id = v.resource_id
     group by v.user_id, r.module_id
  `);

  return views.length;
}

/** Stock has to reflect the history, or every product reads as fully stocked. */
export async function reconcileStock(db: Db) {
  await db.execute(sql`
    update products p
       set stock_count = greatest(0, p.stock_count - coalesce(sold.units, 0))
      from (
        select oi.product_id, sum(oi.quantity)::int as units
          from order_items oi
          join orders o on o.id = oi.order_id
         where o.status in ('confirmed','packed','shipped','delivered')
         group by oi.product_id
      ) as sold
     where sold.product_id = p.id
  `);

  /*
   * Then restock, because a real shop does.
   *
   * Sixty days of generated orders draws most of the catalogue past zero, and
   * the result was a demo shop where four products in seven read "out of
   * stock". That is not a truthful picture of a working store and it is the
   * first thing the client sees.
   *
   * Anything under 8 goes back to a working level. One product is left
   * deliberately low and one deliberately out, so the admin's low-stock panel
   * and the storefront's out-of-stock state both still have something real to
   * show.
   */
  await db.execute(sql`
    update products set stock_count = 24 + (abs(hashtext(slug)) % 30) where stock_count < 8
  `);

  await db.execute(sql`
    update products set stock_count = 3 where slug = 'technical-pencil-set'
  `);

  await db.execute(sql`
    update products set stock_count = 0 where slug = 'sustainable-architecture-guide'
  `);
}
