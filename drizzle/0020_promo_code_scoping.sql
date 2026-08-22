CREATE TYPE "public"."promo_scope_type" AS ENUM('cart', 'category', 'product', 'products');--> statement-breakpoint
ALTER TABLE "promo_codes" ADD COLUMN "scope_type" "promo_scope_type" DEFAULT 'cart' NOT NULL;--> statement-breakpoint
ALTER TABLE "promo_codes" ADD COLUMN "category_id" uuid;--> statement-breakpoint
ALTER TABLE "promo_codes" ADD COLUMN "archived_at" timestamp with time zone;--> statement-breakpoint
-- Every existing promo already scoped to one product must keep meaning
-- exactly that, not silently become cart-wide under the new column's
-- default. This is the one line in this migration that matters.
UPDATE "promo_codes" SET "scope_type" = 'product' WHERE "product_id" IS NOT NULL;--> statement-breakpoint
CREATE TABLE "promo_code_products" (
	"promo_code_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	CONSTRAINT "promo_code_products_promo_code_id_product_id_pk" PRIMARY KEY("promo_code_id","product_id")
);
--> statement-breakpoint
ALTER TABLE "promo_codes" ADD CONSTRAINT "promo_codes_category_id_product_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."product_categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promo_code_products" ADD CONSTRAINT "promo_code_products_promo_code_id_promo_codes_id_fk" FOREIGN KEY ("promo_code_id") REFERENCES "public"."promo_codes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promo_code_products" ADD CONSTRAINT "promo_code_products_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE restrict ON UPDATE no action;
