import "server-only";

import { cache } from "react";
import { db } from "@/db";
import { sectionMaintenance } from "@/db/schema";
import { MAINTENANCE_SECTIONS, type MaintenanceSectionKey } from "@/lib/maintenance";

/**
 * Every registered section's current on/off state, in one query. A section
 * with no row yet reads as `false` — the table only ever holds a row for a
 * key that has been toggled at least once, see the schema's own doc comment.
 */
export const getMaintenanceStatus = cache(
  async (): Promise<Record<MaintenanceSectionKey, boolean>> => {
    const out = {} as Record<MaintenanceSectionKey, boolean>;
    for (const s of MAINTENANCE_SECTIONS) out[s.key] = false;

    try {
      const rows = await db.select().from(sectionMaintenance);
      for (const row of rows) {
        if (row.sectionKey in out) out[row.sectionKey as MaintenanceSectionKey] = row.isActive;
      }
    } catch (err) {
      // A section defaulting to "live" on a query failure is the safer
      // failure mode than the whole public site going dark because
      // `section_maintenance` hiccuped.
      console.error("Failed to query section_maintenance, defaulting every section to live:", err);
    }

    return out;
  },
);

export async function isSectionUnderMaintenance(key: MaintenanceSectionKey): Promise<boolean> {
  const status = await getMaintenanceStatus();
  return status[key];
}
