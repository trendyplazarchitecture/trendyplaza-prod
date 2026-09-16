import "./load-env";
import { createDb, schema } from "../src/db/client";
import { CAROUSEL_LOGO_FILES } from "../src/lib/carousel-logos";

/**
 * Seeds the "trusted by" logo carousel (`homepage_software_logos`) with the
 * client's 16 vetted vendor logos, in `CAROUSEL_LOGO_FILES` order. Separate
 * from `seed-reference-data.ts` because this table has no unique column to
 * hang an `onConflictDoNothing` off of (`id` is a random uuid) — idempotency
 * here is "skip any name already present," checked before inserting, not a
 * database constraint. Safe to run against any environment any number of
 * times: a name already in the table is left untouched, including any admin
 * edits (visibility, position) made after the first run.
 *
 *   npx tsx scripts/seed-software-logos.ts
 */

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set.");

const { db, close } = createDb(url, { max: 1 });

async function main() {
  const existing = await db
    .select({ nameEn: schema.homepageSoftwareLogos.nameEn })
    .from(schema.homepageSoftwareLogos);
  const existingNames = new Set(existing.map((row) => row.nameEn));

  const missing = CAROUSEL_LOGO_FILES.filter((logo) => !existingNames.has(logo.label));
  if (missing.length === 0) {
    console.log("All carousel logos already present. Nothing to do.");
    await close();
    return;
  }

  const startPosition = existing.length;
  const inserted = await db
    .insert(schema.homepageSoftwareLogos)
    .values(
      missing.map((logo, i) => ({
        nameEn: logo.label,
        logoPath: logo.file,
        isVisible: true,
        position: startPosition + i,
      })),
    )
    .returning({ nameEn: schema.homepageSoftwareLogos.nameEn });

  console.log(`Inserted ${inserted.length} carousel logo(s): ${inserted.map((r) => r.nameEn).join(", ")}`);
}

main()
  .then(() => close())
  .catch(async (err) => {
    console.error(err);
    await close();
    process.exit(1);
  });
