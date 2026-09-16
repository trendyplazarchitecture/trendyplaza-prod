CREATE TYPE "public"."product_category" AS ENUM('supplies', 'books', 'packs', 'equipment');--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "category" "product_category" DEFAULT 'supplies' NOT NULL;--> statement-breakpoint
CREATE INDEX "products_category_idx" ON "products" USING btree ("category","position");