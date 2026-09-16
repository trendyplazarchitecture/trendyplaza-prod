-- Testimonials become an admin-uploaded image (a screenshot), not authored
-- text. Both environments this has ever run against have zero rows in this
-- table (production shipped with none, and a stale local dev row is dropped
-- rather than migrated) so there is nothing worth preserving through a
-- rename -- see _BUILD/DEPLOY_SECRETS.md.
ALTER TABLE "testimonials" DROP COLUMN "author_name";--> statement-breakpoint
ALTER TABLE "testimonials" DROP COLUMN "author_role_en";--> statement-breakpoint
ALTER TABLE "testimonials" DROP COLUMN "author_role_fr";--> statement-breakpoint
ALTER TABLE "testimonials" DROP COLUMN "author_role_ar";--> statement-breakpoint
ALTER TABLE "testimonials" DROP COLUMN "body_en";--> statement-breakpoint
ALTER TABLE "testimonials" DROP COLUMN "body_fr";--> statement-breakpoint
ALTER TABLE "testimonials" DROP COLUMN "body_ar";--> statement-breakpoint
ALTER TABLE "testimonials" DROP COLUMN "avatar_path";--> statement-breakpoint
ALTER TABLE "testimonials" ADD COLUMN "image_path" text;--> statement-breakpoint
DELETE FROM "testimonials" WHERE "image_path" IS NULL;--> statement-breakpoint
ALTER TABLE "testimonials" ALTER COLUMN "image_path" SET NOT NULL;
