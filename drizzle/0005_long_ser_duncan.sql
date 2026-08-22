--> Years are named, not enumerated.
--
-- `level` was a NOT NULL `L1..M2` enum with a unique key per university, which
-- encoded the LMD system into the schema and made a five-year diplome, or any
-- school with its own names, impossible to enter rather than merely awkward.
--
-- Added nullable, backfilled from the old enum, then constrained. Generated
-- with three bare NOT NULL adds, which fail on a populated table; hand-edited
-- the same way migration 0001 was when `_en` arrived.

ALTER TABLE "academic_years" DROP CONSTRAINT "academic_years_uni_level_key";--> statement-breakpoint
ALTER TABLE "academic_years" ALTER COLUMN "level" DROP NOT NULL;--> statement-breakpoint

ALTER TABLE "academic_years" ADD COLUMN "name_en" text;--> statement-breakpoint
ALTER TABLE "academic_years" ADD COLUMN "name_fr" text;--> statement-breakpoint
ALTER TABLE "academic_years" ADD COLUMN "name_ar" text;--> statement-breakpoint

-- Every existing row is LMD, so its tag is also its name until someone renames it.
UPDATE "academic_years" SET "name_en" = "level"::text WHERE "name_en" IS NULL;--> statement-breakpoint

ALTER TABLE "academic_years" ALTER COLUMN "name_en" SET NOT NULL;--> statement-breakpoint

CREATE INDEX "academic_years_university_idx" ON "academic_years" USING btree ("university_id","position");
