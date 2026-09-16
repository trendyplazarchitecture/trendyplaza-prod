/**
 * The cart, as it travels in a cookie.
 *
 * Two or three fields per line and nothing else. No title, no price, no
 * image: a cart that carries a price is a price the browser can edit, and
 * every screen that shows the cart resolves it against the database anyway
 * through `resolveCart`. The cookie is a list of intentions, not a
 * quotation.
 *
 * Wire format is `id:qty` (colorless) or `id:colorId:qty` (colored) pairs
 * joined by commas, which is about a third the size of the equivalent JSON.
 * Cookies travel on every request to the origin, and this audience is on
 * mobile data. The two-field form is read forever, not just during a
 * migration window: a cart cookie set before this change was shipped, still
 * sitting in a visitor's browser, must keep parsing.
 */

export const CART_COOKIE = "tp_cart";

/** Matches the `.max(20)` on the checkout schema, so a valid cart never gets refused there. */
export const CART_MAX_LINES = 20;
export const CART_MAX_QUANTITY = 20;

/** Thirty days. Long enough to survive a student deciding at the end of the month. */
export const CART_MAX_AGE = 60 * 60 * 24 * 30;

export type CartItem = { productId: string; colorId: string | null; quantity: number };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Two colors of the same product are two different lines. */
function sameLine(a: { productId: string; colorId: string | null }, b: typeof a): boolean {
  return a.productId === b.productId && a.colorId === b.colorId;
}

/**
 * A cookie is user input. Anything malformed is dropped rather than thrown on,
 * because a corrupted cart should cost the visitor a line, not the page.
 */
export function parseCart(raw: string | undefined | null): CartItem[] {
  if (!raw) return [];

  const seen = new Set<string>();
  const items: CartItem[] = [];

  for (const part of raw.split(",")) {
    const fields = part.split(":");
    if (fields.length !== 2 && fields.length !== 3) continue;

    const id = fields[0];
    const colorId = fields.length === 3 ? fields[1] : null;
    const qty = fields[fields.length - 1];

    if (!id || !UUID.test(id)) continue;
    if (colorId && !UUID.test(colorId)) continue;

    const quantity = Number(qty);
    if (!Number.isInteger(quantity) || quantity < 1) continue;

    const productId = id.toLowerCase();
    const normalisedColorId = colorId ? colorId.toLowerCase() : null;
    const key = `${productId}:${normalisedColorId ?? ""}`;
    if (seen.has(key)) continue;

    seen.add(key);
    items.push({
      productId,
      colorId: normalisedColorId,
      quantity: Math.min(quantity, CART_MAX_QUANTITY),
    });
    if (items.length >= CART_MAX_LINES) break;
  }

  return items;
}

export function serialiseCart(items: CartItem[]): string {
  return items
    .map((i) => (i.colorId ? `${i.productId}:${i.colorId}:${i.quantity}` : `${i.productId}:${i.quantity}`))
    .join(",");
}

export function cartCount(items: CartItem[]): number {
  return items.reduce((sum, i) => sum + i.quantity, 0);
}

/**
 * Adding a product already in the cart raises its quantity rather than
 * appending a second line, which is what a shopper expects and what keeps the
 * cookie inside its line budget.
 */
export function addToCart(
  items: CartItem[],
  productId: string,
  quantity = 1,
  colorId: string | null = null,
): CartItem[] {
  const line = { productId, colorId };
  const existing = items.find((i) => sameLine(i, line));

  if (existing) {
    return items.map((i) =>
      sameLine(i, line)
        ? { ...i, quantity: Math.min(i.quantity + quantity, CART_MAX_QUANTITY) }
        : i,
    );
  }

  if (items.length >= CART_MAX_LINES) return items;
  return [...items, { productId, colorId, quantity: Math.min(quantity, CART_MAX_QUANTITY) }];
}

/** Quantity zero removes the line, so the stepper and the remove button are one operation. */
export function setCartQuantity(
  items: CartItem[],
  productId: string,
  quantity: number,
  colorId: string | null = null,
): CartItem[] {
  const line = { productId, colorId };
  if (quantity < 1) return items.filter((i) => !sameLine(i, line));

  return items.map((i) =>
    sameLine(i, line) ? { ...i, quantity: Math.min(quantity, CART_MAX_QUANTITY) } : i,
  );
}
