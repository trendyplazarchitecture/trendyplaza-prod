-- English joins Arabic and French. English becomes the authoring language,
-- so _en is NOT NULL and the other two are optional and fall back at read
-- time through pick() in src/lib/i18n-content.ts.
--
-- Each _en column is added nullable, backfilled from its French sibling,
-- then constrained. Adding it NOT NULL in one statement fails the moment
-- the table already holds a row, which is every run after the first.
--
-- wilayas and communes are deliberately untouched: a place has one Latin
-- spelling and one Arabic spelling, and an English reader falls through to
-- the Latin form.
ALTER TABLE "lms_packages" ALTER COLUMN "title_fr" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "lms_packages" ALTER COLUMN "title_ar" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "modules" ALTER COLUMN "name_fr" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "modules" ALTER COLUMN "name_ar" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "resource_types" ALTER COLUMN "label_fr" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "resource_types" ALTER COLUMN "label_ar" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "resources" ALTER COLUMN "title_fr" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "semesters" ALTER COLUMN "label_fr" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "semesters" ALTER COLUMN "label_ar" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "tags" ALTER COLUMN "label_fr" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "tags" ALTER COLUMN "label_ar" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "universities" ALTER COLUMN "name_fr" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "universities" ALTER COLUMN "name_ar" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "order_items" ALTER COLUMN "title_at_purchase_fr" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "order_items" ALTER COLUMN "title_at_purchase_ar" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "title_fr" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "title_ar" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "announcements" ALTER COLUMN "title_fr" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "announcements" ALTER COLUMN "title_ar" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "announcements" ALTER COLUMN "body_fr" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "announcements" ALTER COLUMN "body_ar" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "testimonials" ALTER COLUMN "body_fr" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "testimonials" ALTER COLUMN "body_ar" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "shipping_rates" ADD COLUMN "note_en" text;--> statement-breakpoint
ALTER TABLE "lms_packages" ADD COLUMN "title_en" text;
--> statement-breakpoint
UPDATE "lms_packages" SET "title_en" = coalesce("title_fr", '[untranslated]');
--> statement-breakpoint
ALTER TABLE "lms_packages" ALTER COLUMN "title_en" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "lms_packages" ADD COLUMN "description_en" text;--> statement-breakpoint
ALTER TABLE "modules" ADD COLUMN "name_en" text;
--> statement-breakpoint
UPDATE "modules" SET "name_en" = coalesce("name_fr", '[untranslated]');
--> statement-breakpoint
ALTER TABLE "modules" ALTER COLUMN "name_en" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "modules" ADD COLUMN "description_en" text;--> statement-breakpoint
ALTER TABLE "resource_types" ADD COLUMN "label_en" text;
--> statement-breakpoint
UPDATE "resource_types" SET "label_en" = coalesce("label_fr", '[untranslated]');
--> statement-breakpoint
ALTER TABLE "resource_types" ALTER COLUMN "label_en" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "resources" ADD COLUMN "title_en" text;
--> statement-breakpoint
UPDATE "resources" SET "title_en" = coalesce("title_fr", '[untranslated]');
--> statement-breakpoint
ALTER TABLE "resources" ALTER COLUMN "title_en" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "resources" ADD COLUMN "description_en" text;--> statement-breakpoint
ALTER TABLE "semesters" ADD COLUMN "label_en" text;
--> statement-breakpoint
UPDATE "semesters" SET "label_en" = coalesce("label_fr", '[untranslated]');
--> statement-breakpoint
ALTER TABLE "semesters" ALTER COLUMN "label_en" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "tags" ADD COLUMN "label_en" text;
--> statement-breakpoint
UPDATE "tags" SET "label_en" = coalesce("label_fr", '[untranslated]');
--> statement-breakpoint
ALTER TABLE "tags" ALTER COLUMN "label_en" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "universities" ADD COLUMN "name_en" text;
--> statement-breakpoint
UPDATE "universities" SET "name_en" = coalesce("name_fr", '[untranslated]');
--> statement-breakpoint
ALTER TABLE "universities" ALTER COLUMN "name_en" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "title_at_purchase_en" text;
--> statement-breakpoint
UPDATE "order_items" SET "title_at_purchase_en" = coalesce("title_at_purchase_fr", '[untranslated]');
--> statement-breakpoint
ALTER TABLE "order_items" ALTER COLUMN "title_at_purchase_en" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "cancel_reason_en" text;--> statement-breakpoint
ALTER TABLE "product_images" ADD COLUMN "alt_en" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "title_en" text;
--> statement-breakpoint
UPDATE "products" SET "title_en" = coalesce("title_fr", '[untranslated]');
--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "title_en" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "description_en" text;--> statement-breakpoint
ALTER TABLE "access_requests" ADD COLUMN "rejection_reason_en" text;--> statement-breakpoint
ALTER TABLE "announcements" ADD COLUMN "title_en" text;
--> statement-breakpoint
UPDATE "announcements" SET "title_en" = coalesce("title_fr", '[untranslated]');
--> statement-breakpoint
ALTER TABLE "announcements" ALTER COLUMN "title_en" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "announcements" ADD COLUMN "body_en" text;
--> statement-breakpoint
UPDATE "announcements" SET "body_en" = coalesce("body_fr", '[untranslated]');
--> statement-breakpoint
ALTER TABLE "announcements" ALTER COLUMN "body_en" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "testimonials" ADD COLUMN "author_role_en" text;--> statement-breakpoint
ALTER TABLE "testimonials" ADD COLUMN "body_en" text;
--> statement-breakpoint
UPDATE "testimonials" SET "body_en" = coalesce("body_fr", '[untranslated]');
--> statement-breakpoint
ALTER TABLE "testimonials" ALTER COLUMN "body_en" SET NOT NULL;