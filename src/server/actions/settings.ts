"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { saveSiteSettings } from "@/server/settings";
import type { ActionResult } from "./orders";

const input = z.object({
  instagram: z.string().trim().max(120).optional(),
  phone: z.string().trim().max(40).optional(),
  email: z.string().trim().max(255).optional(),
  ripNumber: z.string().trim().max(60).optional(),
});

/**
 * Saves whichever of the three fields the form sent. `requirePermission` runs
 * inside `saveSiteSettings`, not here, so there is exactly one place that
 * checks it.
 */
export async function saveSiteSettingsAction(
  raw: z.infer<typeof input>,
): Promise<ActionResult> {
  const parsed = input.safeParse(raw);
  if (!parsed.success) return { ok: false, message: "Check the values and try again." };

  await saveSiteSettings(parsed.data);

  // Every page that shows one of these — footer, mobile menu, the about and
  // contact pages — is revalidated together, since they all read the same
  // cached function and none of them know the values just moved.
  revalidatePath("/", "layout");

  return { ok: true, message: "Saved. It is live on the site now." };
}
