CREATE TABLE "library_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"label_en" text NOT NULL,
	"label_fr" text,
	"label_ar" text,
	"position" integer DEFAULT 0 NOT NULL,
	"archived_at" timestamp with time zone,
	CONSTRAINT "library_categories_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "library_item_tags" (
	"library_item_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	CONSTRAINT "library_item_tags_library_item_id_tag_id_pk" PRIMARY KEY("library_item_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "library_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category_id" uuid NOT NULL,
	"title_en" text NOT NULL,
	"title_fr" text,
	"title_ar" text,
	"description_en" text NOT NULL,
	"description_fr" text,
	"description_ar" text,
	"author_en" text,
	"cover_image_path" text,
	"source" "resource_source" DEFAULT 'file' NOT NULL,
	"file_path" text,
	"external_url" text,
	"mime_type" text,
	"size_bytes" integer,
	"allow_download" boolean DEFAULT false NOT NULL,
	"is_gated" boolean DEFAULT true NOT NULL,
	"is_visible" boolean DEFAULT true NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "library_item_tags" ADD CONSTRAINT "library_item_tags_library_item_id_library_items_id_fk" FOREIGN KEY ("library_item_id") REFERENCES "public"."library_items"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "library_item_tags" ADD CONSTRAINT "library_item_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "library_items" ADD CONSTRAINT "library_items_category_id_library_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."library_categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "library_item_tags_tag_idx" ON "library_item_tags" USING btree ("tag_id");--> statement-breakpoint
CREATE INDEX "library_items_category_idx" ON "library_items" USING btree ("category_id","position");--> statement-breakpoint
INSERT INTO "library_categories" ("key", "label_en", "label_fr", "label_ar", "position") VALUES
	('book', 'Books & eBooks', 'Livres et eBooks', 'الكتب والكتب الإلكترونية', 1),
	('document', 'PDF Documents', 'Documents PDF', 'وثائق PDF', 2),
	('graduation_project', 'Graduation Projects', 'Projets de fin d''études', 'مشاريع التخرج', 3),
	('research_paper', 'Research Papers', 'Articles de recherche', 'أوراق بحثية', 4),
	('template', 'Templates & CAD Blocks', 'Modèles et blocs CAO', 'نماذج وقوالب CAD', 5);