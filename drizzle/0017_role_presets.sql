-- Create role_presets table
CREATE TABLE IF NOT EXISTS "role_presets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"color" text DEFAULT 'blue' NOT NULL,
	"permissions" text[] NOT NULL,
	"is_system" boolean DEFAULT false NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "role_presets_slug_unique" UNIQUE("slug")
);

-- Seed initial system role presets if not exist
INSERT INTO "role_presets" ("slug", "name", "description", "color", "permissions", "is_system", "position")
VALUES 
  (
    'super_admin',
    'Super Admin',
    'Full access to everything including team management & settings',
    'purple',
    ARRAY['orders.view','orders.edit','orders.confirm','orders.delete','products.manage','content.manage','content.publish','packages.manage','codes.generate','codes.revoke','students.view','students.manage','students.delete','finance.view','settings.manage','users.manage','messages.view','messages.reply','testimonials.manage','roster.manage','posts.manage','software.manage','library.manage','courses.manage','services.manage','services.review'],
    true,
    1
  ),
  (
    'admin',
    'Admin',
    'Operational management without user access control',
    'blue',
    ARRAY['orders.view','orders.edit','orders.confirm','orders.delete','products.manage','content.manage','content.publish','packages.manage','codes.generate','codes.revoke','students.view','students.manage','students.delete','finance.view','settings.manage','messages.view','messages.reply','testimonials.manage','roster.manage','posts.manage','software.manage','library.manage','courses.manage','services.manage','services.review'],
    true,
    2
  ),
  (
    'moderator',
    'Content Moderator',
    'Manage content hub, courses, library, students & view orders',
    'emerald',
    ARRAY['content.manage','content.publish','students.view','orders.view','posts.manage','software.manage','library.manage','courses.manage'],
    true,
    3
  ),
  (
    'order_handler',
    'Order Handler',
    'View, edit, and call/confirm incoming store orders',
    'amber',
    ARRAY['orders.view','orders.edit','orders.confirm'],
    true,
    4
  )
ON CONFLICT ("slug") DO NOTHING;
