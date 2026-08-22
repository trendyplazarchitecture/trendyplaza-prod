"use server";

import { z } from "zod";

import { placeOrder, lookupOrder, type CheckoutResult } from "@/server/orders";
import { readCart, writeCart, rememberLastOrder } from "@/server/cart";
import { limitByIp } from "@/server/rate-limit";

/**
 * The public end of the store.
 *
 * Two endpoints, both reachable by anyone: placing an order and looking one
 * up. Neither takes a session, because the store deliberately has no login,
 * so the controls are input validation, a rate limit, and the fact that every
 * figure is recomputed server-side.
 *
 * The cart is read from the cookie here rather than posted by the form. A
 * posted cart is a cart the browser chose the contents of after the page
 * rendered, and there is no reason to accept one when the server already holds
 * the authoritative copy.
 */

const submitInput = z.object({
  customerName: z.string().max(200),
  phone: z.string().max(40),
  email: z.string().max(200).optional(),
  wilayaCode: z.coerce.number().int(),
  communeId: z.coerce.number().int(),
  deliveryType: z.enum(["home", "desk"]),
  address: z.string().max(300).optional(),
  customerNote: z.string().max(500).optional(),
  promoCode: z.string().max(40).optional(),
});

export type PlaceOrderResult =
  | { ok: true; reference: string; totalDzd: number }
  | { ok: false; error: CheckoutError };

export type CheckoutError =
  | "phone_invalid"
  | "commune_mismatch"
  | "wilaya_unavailable"
  | "product_unavailable"
  | "empty_cart"
  | "rate_limited"
  | "generic"
  /**
   * Never returned by this function — the server never runs it. A fresh
   * deployment rotates the action IDs the client's already-loaded bundle
   * calls by, so an open tab's submit can fail before this code executes
   * at all. `CommanderClient.tsx` sets this itself when it catches that
   * specific dispatch failure, so it has its own translated message.
   */
  | "stale_deploy";

export async function placeOrderAction(
  input: z.infer<typeof submitInput>,
): Promise<PlaceOrderResult> {
  // Six orders a minute from one address is far above any real customer and
  // far below what a script would want.
  const allowed = await limitByIp("checkout", { limit: 6, windowSeconds: 60 });
  if (!allowed.ok) return { ok: false, error: "rate_limited" };

  const parsed = submitInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: "generic" };

  const items = await readCart();
  if (items.length === 0) return { ok: false, error: "empty_cart" };

  let result: CheckoutResult;
  try {
    result = await placeOrder({ ...parsed.data, items });
  } catch {
    // A failure here is ours, not the customer's. Say so on screen and keep
    // the cart, so retrying costs them one tap instead of a rebuild.
    return { ok: false, error: "generic" };
  }

  if (!result.ok) return { ok: false, error: result.error };

  // Only now. A cart emptied before the insert commits is a cart lost to a
  // deadlock the customer never saw.
  await writeCart([]);
  await rememberLastOrder({ reference: result.reference, totalDzd: result.totalDzd });

  return { ok: true, reference: result.reference, totalDzd: result.totalDzd };
}

const lookupInput = z.object({
  reference: z.string().trim().min(4).max(40),
  phone: z.string().trim().min(6).max(40),
});

export type LookupResult =
  | {
      ok: true;
      order: {
        reference: string;
        status: string;
        totalDzd: number;
        subtotalDzd: number;
        shippingDzd: number;
        discountDzd: number;
        deliveryType: "home" | "desk";
        createdAt: string;
        items: { title: string; colorName: string | null; quantity: number; priceDzd: number }[];
      };
    }
  | { ok: false; error: "not_found" | "rate_limited" };

/**
 * Reference plus phone, and one failure message for every kind of miss.
 *
 * References are sequential within a month because a customer reads one down
 * a phone line, so the reference alone is a walkable sequence. Requiring the
 * phone that placed the order is what stops a stranger reading someone's name
 * and address, and a generic failure is what stops the endpoint being used to
 * test which phone numbers have ordered.
 */
export async function lookupOrderAction(
  input: z.infer<typeof lookupInput>,
  locale: "en" | "ar" | "fr" = "en",
): Promise<LookupResult> {
  const allowed = await limitByIp("order-lookup", { limit: 10, windowSeconds: 300 });
  if (!allowed.ok) return { ok: false, error: "rate_limited" };

  const parsed = lookupInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: "not_found" };

  const order = await lookupOrder(parsed.data.reference, parsed.data.phone);
  if (!order) return { ok: false, error: "not_found" };

  return {
    ok: true,
    order: {
      reference: order.reference,
      status: order.status,
      totalDzd: order.totalDzd,
      subtotalDzd: order.subtotalDzd,
      shippingDzd: order.shippingDzd,
      discountDzd: order.discountDzd,
      deliveryType: order.deliveryType,
      createdAt: order.createdAt.toISOString(),
      items: order.items.map((item) => ({
        // The title frozen on the line, not the product's current one. A
        // product renamed last month must not rewrite an order placed before it.
        title:
          (locale === "ar" ? item.titleAtPurchaseAr : locale === "fr" ? item.titleAtPurchaseFr : null) ||
          item.titleAtPurchaseEn,
        colorName: item.colorNameAtPurchaseEn,
        quantity: item.quantity,
        priceDzd: item.priceAtPurchaseDzd,
      })),
    },
  };
}
