import "server-only";

import { cache } from "react";
import { and, asc, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { testimonials } from "@/db/schema";

/**
 * Client-managed marketing content: a screenshot the admin uploaded, shown
 * on the home page. There is nothing bilingual to pick a locale for, unlike
 * the rest of this file, because the image is the whole content.
 */
export const listTestimonials = cache(async () => {
  try {
    const rows = await db
      .select({ id: testimonials.id, imagePath: testimonials.imagePath })
      .from(testimonials)
      .where(and(eq(testimonials.isVisible, true), isNull(testimonials.archivedAt)))
      .orderBy(asc(testimonials.position));

    return rows;
  } catch (err) {
    console.error("Failed to query testimonials, returning empty array:", err);
    return [];
  }
});

export type Testimonial = Awaited<ReturnType<typeof listTestimonials>>[number];
