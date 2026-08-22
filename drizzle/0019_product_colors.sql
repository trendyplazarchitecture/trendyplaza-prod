CREATE TABLE "product_colors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"name_en" text NOT NULL,
	"name_fr" text,
	"name_ar" text,
	"hex" text,
	"stock_count" integer DEFAULT 0 NOT NULL,
	"is_visible" boolean DEFAULT true NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "product_colors_product_name_key" UNIQUE("product_id","name_en")
);
--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "product_color_id" uuid;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "color_name_at_purchase_en" text;--> statement-breakpoint
ALTER TABLE "product_colors" ADD CONSTRAINT "product_colors_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_color_id_product_colors_id_fk" FOREIGN KEY ("product_color_id") REFERENCES "public"."product_colors"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "product_colors_product_idx" ON "product_colors" USING btree ("product_id","position");
