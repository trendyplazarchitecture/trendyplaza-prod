import "./load-env";
import { sql } from "drizzle-orm";
import { createDb, schema } from "../src/db/client";
import { wilayas as WILAYAS, communes as COMMUNES } from "../src/data/wilayas";
import { SHIPPING_DEFAULT, SHIPPING_EXCEPTIONS } from "../src/db/seed/catalogue";

/**
 * The 69 wilayas, 1,541 communes and their default shipping rates —
 * permanent reference data every environment needs, not the demo dataset
 * `src/db/seed/index.ts` builds. That script also creates fake accounts,
 * fake orders and fake products, which is exactly why it must never run
 * against production; this one only ever touches these three tables and
 * is safe to run anywhere, any number of times.
 *
 * Written after a fresh production deploy shipped with these three tables
 * empty — checkout had no wilaya to pick, because the geo generation script
 * (`scripts/build-geo.mjs`) only produces `src/data/wilayas.ts`, and nothing
 * had ever loaded that file into a database outside of the full dev seed.
 *
 *   npx tsx scripts/seed-reference-data.ts
 */

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set.");

const { db, close } = createDb(url, { max: 1 });

async function main() {
  const wilayaResult = await db
    .insert(schema.wilayas)
    .values(WILAYAS.map((w) => ({ code: w.id, nameFr: w.name, nameAr: w.nameAr })))
    .onConflictDoNothing()
    .returning({ code: schema.wilayas.code });

  const communeResult = await db
    .insert(schema.communes)
    .values(
      COMMUNES.map((c) => ({
        id: c.id,
        wilayaCode: c.wilayaId,
        nameFr: c.name,
        nameAr: c.nameAr,
      })),
    )
    .onConflictDoNothing()
    .returning({ id: schema.communes.id });

  // Explicit ids, same reason the dev seed moves it: the first admin-created
  // commune must not collide with a row inserted here by id.
  await db.execute(
    sql`SELECT setval(pg_get_serial_sequence('communes', 'id'), (SELECT max(id) FROM communes))`,
  );

  const shippingResult = await db
    .insert(schema.shippingRates)
    .values(
      WILAYAS.map((w) => ({
        wilayaCode: w.id,
        ...(SHIPPING_EXCEPTIONS[w.id] ?? SHIPPING_DEFAULT),
      })),
    )
    .onConflictDoUpdate({
      target: schema.shippingRates.wilayaCode,
      set: {
        homeDzd: sql`EXCLUDED.home_dzd`,
        deskDzd: sql`EXCLUDED.desk_dzd`,
      },
    })
    .returning({ wilayaCode: schema.shippingRates.wilayaCode });

  console.log(
    `Inserted/updated ${wilayaResult.length} wilayas, ${communeResult.length} communes, ` +
      `${shippingResult.length} shipping rates.`,
  );
}

main()
  .then(() => close())
  .catch(async (err) => {
    console.error(err);
    await close();
    process.exit(1);
  });
