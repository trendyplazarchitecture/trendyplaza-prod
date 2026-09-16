-- Credits the teacher or teachers who made a cours, TD or TP.
--
-- Trilingual and nullable, like every other content string: a name is written
-- differently in Latin and Arabic script, and most existing resources have no
-- attribution to backfill.
ALTER TABLE "resources" ADD COLUMN "made_by_en" text;--> statement-breakpoint
ALTER TABLE "resources" ADD COLUMN "made_by_fr" text;--> statement-breakpoint
ALTER TABLE "resources" ADD COLUMN "made_by_ar" text;
