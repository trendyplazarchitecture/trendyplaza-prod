"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { readCart, writeCart } from "@/server/cart";
import {
  addToCart,
  cartCount,
  setCartQuantity,
  CART_MAX_QUANTITY,
} from "@/lib/cart";

/**
 * Cart mutations.
 *
 * Nothing here trusts the caller beyond the shape of the input, and there is
 * nothing to trust: the cookie holds ids and quantities, and every price is
 * resolved from the database by `resolveCart` and recomputed again by
 * `placeOrder`. A visitor who edits their own cart cookie changes what they
 * are asking to buy, which they are allowed to do, and not what it costs.
 *
 * Each action returns the new count so the button can settle without waiting
 * for the router refresh that updates the header.
 */

const lineInput = z.object({
  productId: z.string().uuid(),
  colorId: z.string().uuid().nullable().optional(),
  quantity: z.coerce.number().int().min(1).max(CART_MAX_QUANTITY).default(1),
});

export type CartActionResult = { count: number };

export async function addToCartAction(
  input: z.infer<typeof lineInput>,
): Promise<CartActionResult> {
  const { productId, colorId, quantity } = lineInput.parse(input);

  const items = addToCart(await readCart(), productId, quantity, colorId ?? null);
  await writeCart(items);

  // The header badge and the checkout summary both read the cookie server-side.
  revalidatePath("/", "layout");
  return { count: cartCount(items) };
}

const quantityInput = z.object({
  productId: z.string().uuid(),
  colorId: z.string().uuid().nullable().optional(),
  quantity: z.coerce.number().int().min(0).max(CART_MAX_QUANTITY),
});

/** Quantity zero is the remove button. One operation, one code path. */
export async function setCartQuantityAction(
  input: z.infer<typeof quantityInput>,
): Promise<CartActionResult> {
  const { productId, colorId, quantity } = quantityInput.parse(input);

  const items = setCartQuantity(await readCart(), productId, quantity, colorId ?? null);
  await writeCart(items);

  revalidatePath("/", "layout");
  return { count: cartCount(items) };
}

export async function clearCartAction(): Promise<CartActionResult> {
  await writeCart([]);
  revalidatePath("/", "layout");
  return { count: 0 };
}
