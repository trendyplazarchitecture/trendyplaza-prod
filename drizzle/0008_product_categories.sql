CREATE TABLE "product_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"label_en" text NOT NULL,
	"label_fr" text,
	"label_ar" text,
	"position" integer DEFAULT 0 NOT NULL,
	"archived_at" timestamp with time zone,
	CONSTRAINT "product_categories_key_unique" UNIQUE("key")
);
--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "category_id" uuid;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_product_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."product_categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
INSERT INTO "product_categories" ("key", "label_en", "label_fr", "label_ar", "position") VALUES
	('supplies', 'Supplies', 'Fournitures', 'لوازم', 1),
	('books', 'Books', 'Livres', 'كتب', 2),
	('packs', 'Printed packs', 'Packs imprimés', 'حزم مطبوعة', 3),
	('equipment', 'Studio kit', 'Kit d''atelier', 'عدة الاستوديو', 4);--> statement-breakpoint
UPDATE "products" AS p SET "category_id" = c."id"
	FROM "product_categories" AS c
	WHERE c."key" = p."category"::text;