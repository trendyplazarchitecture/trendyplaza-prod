ALTER TABLE "orders" ADD COLUMN "archived_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "contact_messages" ADD COLUMN "archived_at" timestamp with time zone;--> statement-breakpoint
CREATE INDEX "orders_archived_idx" ON "orders" USING btree ("archived_at");--> statement-breakpoint
CREATE INDEX "contact_messages_archived_idx" ON "contact_messages" USING btree ("archived_at");
