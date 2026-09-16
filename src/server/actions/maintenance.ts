"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/db";
import { sectionMaintenance } from "@/db/schema";
import { requirePermission } from "@/server/session";
import { logActivity } from "@/server/activity";
import { maintenanceSection, MAINTENANCE_SECTIONS } from "@/lib/maintenance";
import type { ActionResult } from "./orders";

export type { ActionResult };

const SECTION_KEYS = MAINTENANCE_SECTIONS.map((s) => s.key) as [string, ...string[]];

const toggleInput = z.object({
  section: z.enum(SECTION_KEYS),
  isActive: z.boolean(),
});

/**
 * One switch, gated by the section's own permission — see the doc comment
 * on `MAINTENANCE_SECTIONS`. Whoever can edit Software Hub can take its
 * public page down without asking someone else to hold `settings.manage`.
 */
export async function setSectionMaintenanceAction(
  input: z.infer<typeof toggleInput>,
): Promise<ActionResult> {
  const parsed = toggleInput.parse(input);
  const spec = maintenanceSection(parsed.section as (typeof MAINTENANCE_SECTIONS)[number]["key"]);

  const actor = await requirePermission(spec.permission);

  await db
    .insert(sectionMaintenance)
    .values({ sectionKey: spec.key, isActive: parsed.isActive, updatedBy: actor.id })
    .onConflictDoUpdate({
      target: sectionMaintenance.sectionKey,
      set: { isActive: parsed.isActive, updatedAt: new Date(), updatedBy: actor.id },
    });

  await logActivity({
    actorId: actor.id,
    action: parsed.isActive ? "section.maintenance_on" : "section.maintenance_off",
    entity: "section_maintenance",
    entityId: spec.key,
  });

  revalidatePath(spec.adminPath);
  for (const path of spec.publicPaths) revalidatePath(path);

  return {
    ok: true,
    message: parsed.isActive
      ? `${spec.labelEn} now shows "Under maintenance" to visitors.`
      : `${spec.labelEn} is back online.`,
  };
}
