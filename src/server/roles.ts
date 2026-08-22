import "server-only";

import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { rolePresets } from "@/db/schema";
import { PERMISSIONS, type Permission } from "@/lib/permissions";

export type RolePresetRecord = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  color: string;
  permissions: Permission[];
  isSystem: boolean;
  position: number;
  createdAt: Date;
  updatedAt: Date;
};

export async function listRolePresets(): Promise<RolePresetRecord[]> {
  try {
    const rows = await db
      .select()
      .from(rolePresets)
      .orderBy(asc(rolePresets.position), asc(rolePresets.createdAt));

    return rows.map((r) => ({
      ...r,
      permissions: (r.permissions as Permission[]).filter((p) => PERMISSIONS.includes(p)),
    }));
  } catch (error) {
    console.error("Failed to list role presets:", error);
    return [];
  }
}

export async function getRolePreset(idOrSlug: string): Promise<RolePresetRecord | null> {
  try {
    const [row] = await db
      .select()
      .from(rolePresets)
      .where(eq(rolePresets.id, idOrSlug))
      .limit(1);

    if (row) {
      return {
        ...row,
        permissions: (row.permissions as Permission[]).filter((p) => PERMISSIONS.includes(p)),
      };
    }

    const [bySlug] = await db
      .select()
      .from(rolePresets)
      .where(eq(rolePresets.slug, idOrSlug))
      .limit(1);

    if (bySlug) {
      return {
        ...bySlug,
        permissions: (bySlug.permissions as Permission[]).filter((p) => PERMISSIONS.includes(p)),
      };
    }

    return null;
  } catch (error) {
    console.error("Failed to get role preset:", error);
    return null;
  }
}
