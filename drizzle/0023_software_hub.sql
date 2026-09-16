-- NextPhase/02-software-hub. A curated directory of vendor links (Shape C —
-- see 00-shared/DATA_MODEL_DECISIONS.md), plus a small logo image (Shape B).
--
-- `drizzle-kit generate` also re-emitted every table and column added by the
-- hand-written migrations 0015-0022, because the snapshot chain under
-- drizzle/meta/ stops at 0014 (those migrations were hand-written without
-- running `generate`, so no snapshot exists for them). Everything except the
-- three statements below was already applied to every real database and has
-- been trimmed out by hand -- applying the untrimmed file would fail with
-- "already exists" on the first CREATE TABLE. The generated 0023_snapshot.json
-- itself is correct (a full diff from 0014 to the current schema.ts, this
-- table included) and is kept as-is: it resets the chain, so this class of
-- bug should not recur for migration 0024 onward.
CREATE TYPE "public"."software_tool_kind" AS ENUM('application', 'plugin');--> statement-breakpoint
CREATE TABLE "software_tools" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" "software_tool_kind" DEFAULT 'application' NOT NULL,
	"slug" text NOT NULL,
	"name_en" text NOT NULL,
	"description_en" text NOT NULL,
	"description_fr" text,
	"description_ar" text,
	"logo_path" text,
	"official_url" text NOT NULL,
	"student_license_url" text,
	"parent_tool_id" uuid,
	"related_course_id" uuid,
	"is_visible" boolean DEFAULT true NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "software_tools_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "software_tools" ADD CONSTRAINT "software_tools_parent_tool_id_software_tools_id_fk" FOREIGN KEY ("parent_tool_id") REFERENCES "public"."software_tools"("id") ON DELETE restrict ON UPDATE no action;
