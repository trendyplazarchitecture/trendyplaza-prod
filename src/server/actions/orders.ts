"use server";

import { revalidatePath } from "next/cache";
import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { orders } from "@/db/schema";
import { requirePermission } from "@/server/session";
import { logActivity } from "@/server/activity";
import {
  cancelOrder,
  confirmOrder,
  setOrderStatus,
  type ConfirmResult,
} from "@/server/orders";

/**
 * Server actions for the order queue.
 *
 * Each one names the permission it needs on its first line. A server action is
 * a public HTTP endpoint: it is reachable by anyone who can guess its id,
 * without the admin layout ever rendering, so the layout's check protects
 * nothing here. `orders.view` does not imply `orders.confirm`, and that
 * distinction is the whole reason permissions are granular.
 */

const idInput = z.object({ orderId: z.string().uuid() });

export type ActionResult =
  | { ok: true; message: string }
  | { ok: false; message: string };

export async function confirmOrderAction(input: {
  orderId: string;
}): Promise<ActionResult> {
  const actor = await requirePermission("orders.confirm");
  const { orderId } = idInput.parse(input);

  const result: ConfirmResult = await confirmOrder(orderId, actor.id);

  if (!result.ok) {
    if (result.error === "not_pending") {
      return {
        ok: false,
        message: "This order has already moved on. Refresh to see where it is.",
      };
    }
    return {
      ok: false,
      message:
        "Not enough stock to confirm this order. Adjust the quantity or restock, then try again.",
    };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/orders");
  return { ok: true, message: "Confirmed. Stock has been taken." };
}

const statusInput = idInput.extend({
  status: z.enum(["packed", "shipped", "delivered", "returned"]),
});

export async function setOrderStatusAction(
  input: z.infer<typeof statusInput>,
): Promise<ActionResult> {
  const actor = await requirePermission("orders.edit");
  const { orderId, status } = statusInput.parse(input);

  await setOrderStatus(orderId, status, actor.id);

  revalidatePath("/admin");
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);

  const said: Record<typeof status, string> = {
    packed: "Marked packed.",
    shipped: "Handed to the courier.",
    delivered: "Marked delivered.",
    returned: "Marked returned.",
  };
  return { ok: true, message: said[status] };
}

const cancelInput = idInput.extend({
  reasonEn: z.string().trim().min(3).max(300),
  reasonFr: z.string().trim().max(300).optional(),
  reasonAr: z.string().trim().max(300).optional(),
});

export async function cancelOrderAction(
  input: z.infer<typeof cancelInput>,
): Promise<ActionResult> {
  const actor = await requirePermission("orders.edit");
  const data = cancelInput.parse(input);

  const row = await cancelOrder(
    data.orderId,
    {
      fr: data.reasonFr?.trim() || data.reasonEn,
      ar: data.reasonAr?.trim() || data.reasonEn,
    },
    actor.id,
  );

  if (!row) {
    return { ok: false, message: "That order is already cancelled." };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${data.orderId}`);
  return {
    ok: true,
    message: row.confirmedAt
      ? "Cancelled, and the stock has gone back."
      : "Cancelled.",
  };
}

/**
 * Sends an order to the trash — `src/server/trash.ts` handles restore, the
 * 30-day purge and the guarded permanent delete from there. Any status can
 * be trashed; this only changes whether the order currently shows up
 * anywhere (queue, sheet figures, exports), never what happened.
 */
export async function archiveOrderAction(input: {
  orderId: string;
}): Promise<ActionResult> {
  const actor = await requirePermission("orders.delete");
  const { orderId } = idInput.parse(input);

  const [row] = await db
    .update(orders)
    .set({ archivedAt: new Date() })
    .where(and(eq(orders.id, orderId), isNull(orders.archivedAt)))
    .returning({ id: orders.id });
  if (!row) return { ok: false, message: "That order is already in the trash." };

  await logActivity({
    actorId: actor.id,
    action: "order.archived",
    entity: "order",
    entityId: orderId,
  });

  revalidatePath("/admin");
  revalidatePath("/admin/orders");
  revalidatePath("/admin/trash");
  return { ok: true, message: "Moved to trash." };
}

/**
 * Where a person belongs after signing in.
 *
 * Staff go straight to the admin rather than to a student account page they
 * have no use for. There is deliberately no separate admin login: a second
 * login form is a second place for the session logic to drift, and it tells
 * an attacker where the admin lives. One door, and the destination is decided
 * by what the account can actually do.
 */
export async function landingRouteAction(): Promise<{ href: string }> {
  const { getCurrentUser } = await import("@/server/session");
  const user = await getCurrentUser();

  if (!user) return { href: "/login" };
  if (user.permissions.size > 0) return { href: "/admin" };
  return { href: "/account" };
}
