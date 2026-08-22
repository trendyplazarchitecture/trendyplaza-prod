import "server-only";

import { cookies } from "next/headers";

import {
  CART_COOKIE,
  CART_MAX_AGE,
  parseCart,
  serialiseCart,
  cartCount,
  type CartItem,
} from "@/lib/cart";

/**
 * The cart lives in a cookie, not in the database.
 *
 * The store has no login, so there is no row to hang a cart off. A cookie also
 * means a visitor who closes the tab on the bus still has their cart at home,
 * which a session store on a stateless server would not give them.
 *
 * It is `httpOnly` even though nothing secret is in it. The only code that
 * needs to read it is server code, and a cookie no script can touch is one
 * fewer thing an injected script can rewrite.
 */

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax",
  path: "/",
  maxAge: CART_MAX_AGE,
  secure: process.env.NODE_ENV === "production",
} as const;

export async function readCart(): Promise<CartItem[]> {
  const store = await cookies();
  return parseCart(store.get(CART_COOKIE)?.value);
}

/** Only callable from a server action or a route handler. Next refuses it during render. */
export async function writeCart(items: CartItem[]): Promise<void> {
  const store = await cookies();

  if (items.length === 0) {
    // A cookie, not a row. The soft-delete rule governs content, catalogue,
    // orders, codes and entitlements; an empty cart is none of those.
    // eslint-disable-next-line no-restricted-syntax
    store.delete(CART_COOKIE);
    return;
  }

  store.set(CART_COOKIE, serialiseCart(items), COOKIE_OPTIONS);
}

export async function getCartCount(): Promise<number> {
  return cartCount(await readCart());
}

/**
 * The reference of the order just placed, handed to the confirmation screen.
 *
 * It goes in a cookie rather than the URL. A reference in a query string is a
 * reference in browser history, in a shared link and in any analytics that
 * later gets added, and the sequence is guessable by design because a customer
 * has to read it down a phone line. One hour is long enough to read the page
 * and screenshot it.
 */
const LAST_ORDER_COOKIE = "tp_last_order";

export type LastOrder = { reference: string; totalDzd: number };

export async function rememberLastOrder(order: LastOrder): Promise<void> {
  const store = await cookies();
  store.set(LAST_ORDER_COOKIE, `${order.reference}:${order.totalDzd}`, {
    ...COOKIE_OPTIONS,
    maxAge: 60 * 60,
  });
}

export async function readLastOrder(): Promise<LastOrder | null> {
  const store = await cookies();
  const raw = store.get(LAST_ORDER_COOKIE)?.value;
  if (!raw) return null;

  const [reference, total] = raw.split(":");
  const totalDzd = Number(total);
  if (!reference || !Number.isFinite(totalDzd)) return null;

  return { reference, totalDzd };
}
