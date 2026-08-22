DROP INDEX "products_category_idx";--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "category_id" SET NOT NULL;--> statement-breakpoint
CREATE INDEX "products_category_idx" ON "products" USING btree ("category_id","position");--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "category";--> statement-breakpoint
DROP TYPE "public"."product_category";