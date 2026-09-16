"use client";

import { useState, useTransition } from "react";
import { Check, Loader2, Minus, Plus, ShoppingBag } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

import { addToCartAction } from "@/server/actions/cart";
import { CART_MAX_QUANTITY } from "@/lib/cart";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Add to cart, in two shapes.
 *
 * The confirmation is the button itself changing to "Added" for a moment,
 * rather than a toast in a corner. The eye is already on the thumb, and a
 * message that appears somewhere else is a message half of a phone audience
 * never sees.
 *
 * `router.refresh()` is what updates the count in the header: the cart is a
 * server-read cookie, so the server components have to run again. The local
 * state is what makes the button feel immediate while that happens.
 */

function useAdd(productId: string, colorId: string | null) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [added, setAdded] = useState(false);

  const add = (quantity: number) => {
    start(async () => {
      await addToCartAction({ productId, colorId, quantity });
      setAdded(true);
      router.refresh();
      setTimeout(() => setAdded(false), 2000);
    });
  };

  return { add, pending, added };
}

export function AddToCartButton({
  productId,
  colorId = null,
  disabled,
  maxQuantity,
  className,
}: {
  productId: string;
  colorId?: string | null;
  disabled?: boolean;
  maxQuantity: number;
  className?: string;
}) {
  const t = useTranslations();
  const { add, pending, added } = useAdd(productId, colorId);
  const [quantity, setQuantity] = useState(1);

  const ceiling = Math.max(1, Math.min(maxQuantity, CART_MAX_QUANTITY));

  return (
    <div className={cn("flex flex-row items-center gap-3 w-full max-w-full", className)}>
      <div
        className="inline-flex h-12 shrink-0 items-center rounded-xl border border-border bg-background"
        role="group"
        aria-label={t("product.quantity")}
      >
        <button
          type="button"
          onClick={() => setQuantity((q) => Math.max(1, q - 1))}
          disabled={disabled || quantity <= 1}
          aria-label={t("cart.decrease")}
          className="inline-flex h-full w-10 items-center justify-center rounded-s-xl text-muted-foreground transition-colors hover:bg-paper hover:text-foreground disabled:opacity-40 cursor-pointer"
        >
          <Minus className="h-4 w-4" aria-hidden="true" />
        </button>

        <span
          className="figures w-8 text-center text-sm font-bold tabular-nums"
          aria-live="polite"
        >
          {quantity}
        </span>

        <button
          type="button"
          onClick={() => setQuantity((q) => Math.min(ceiling, q + 1))}
          disabled={disabled || quantity >= ceiling}
          aria-label={t("cart.increase")}
          className="inline-flex h-full w-10 items-center justify-center rounded-e-xl text-muted-foreground transition-colors hover:bg-paper hover:text-foreground disabled:opacity-40 cursor-pointer"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <Button
        type="button"
        size="lg"
        onClick={() => add(quantity)}
        disabled={disabled || pending}
        className="h-12 flex-1 rounded-xl px-4 sm:px-8 text-base font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30"
      >
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : added ? (
          <Check className="h-4 w-4" aria-hidden="true" />
        ) : (
          <ShoppingBag className="h-4 w-4" aria-hidden="true" />
        )}
        {added ? t("cart.added") : t("actions.addToCart")}
      </Button>
    </div>
  );
}

/** The card affordance. One tap, quantity one, no navigation. */
export function AddToCartIcon({
  productId,
  disabled,
}: {
  productId: string;
  disabled?: boolean;
}) {
  const t = useTranslations();
  const { add, pending, added } = useAdd(productId, null);

  return (
    <button
      type="button"
      onClick={() => add(1)}
      disabled={disabled || pending}
      aria-label={added ? t("cart.added") : t("actions.addToCart")}
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-lg border shadow-sm transition-colors",
        added
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-background/90 text-foreground backdrop-blur hover:border-primary hover:bg-primary hover:text-primary-foreground",
        "disabled:pointer-events-none disabled:opacity-40",
      )}
    >
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : added ? (
        <Check className="h-4 w-4" aria-hidden="true" />
      ) : (
        <Plus className="h-4 w-4" aria-hidden="true" />
      )}
    </button>
  );
}
