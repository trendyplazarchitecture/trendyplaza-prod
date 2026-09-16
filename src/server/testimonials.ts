import "server-only";

import { asc } from "drizzle-orm";
import { db } from "@/db";
import { testimonials } from "@/db/schema";

/**
 * Every testimonial an admin can act on, archived rows included, so the
 * manager can offer "restore" rather than making an archive look like a
 * delete with no way back.
 */
export async function listAdminTestimonials() {
  return db.select().from(testimonials).orderBy(asc(testimonials.position));
}
