"use client";

import { useEffect, useState, useTransition } from "react";
import { Building2, Loader2, Minus, Plus, ShoppingBag, Trash2, Truck } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Link, useRouter } from "../../../i18n/navigation";
import { communesForWilayaAction, shippingCostAction } from "@/server/actions/geo";
import { setCartQuantityAction } from "@/server/actions/cart";
import { placeOrderAction, type CheckoutError } from "@/server/actions/checkout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Frame, Reveal, Section } from "./Sheet";
import { formatDzd } from "@/lib/money";
import { normalisePhone } from "@/lib/phone";
import { CART_MAX_QUANTITY } from "@/lib/cart";
import { cn } from "@/lib/utils";

type Delivery = "home" | "desk";
type Commune = { id: number; name: string };
type FieldError = "customerName" | "phone" | "wilayaCode" | "communeId";

export type CheckoutWilaya = {
  code: number;
  name: string;
  homeDzd: number | null;
  deskDzd: number | null;
  isAvailable: boolean;
};

export type CartLine = {
  productId: string;
  colorId: string | null;
  colorName: string | null;
  slug: string;
  title: string;
  priceDzd: number;
  quantity: number;
  lineTotalDzd: number;
  maxQuantity: number;
};

/**
 * The checkout. One page, no steps, as specified.
 *
 * Wilayas arrive as props: 69 rows, cheap, and needed before the first
 * interaction. Communes are fetched per wilaya, because all 1,541 of them is
 * 160 KB of data the visitor will use one row of, and this audience is on
 * mobile data.
 *
 * Nothing about money crosses the wire from here. The cart is a cookie the
 * server reads for itself, the shipping figure below is display only, and
 * `placeOrder` recomputes every line, the shipping and the total from the
 * database, because a price the browser posted is a price the browser could
 * have edited.
 */
export function CommanderClient({
  wilayas,
  cart,
}: {
  wilayas: CheckoutWilaya[];
  cart: CartLine[];
}) {
  const t = useTranslations("checkout");
  const tCart = useTranslations("cart");
  const tAction = useTranslations("actions");
  const locale = useLocale() as "en" | "ar" | "fr";
  const priceLocale = locale === "en" ? "fr" : locale;
  const router = useRouter();

  const [wilayaCode, setWilayaCode] = useState<string>("");
  const [communeId, setCommuneId] = useState<string>("");
  const [communes, setCommunes] = useState<Commune[]>([]);
  const [delivery, setDelivery] = useState<Delivery>("home");
  const [shippingDzd, setShippingDzd] = useState<number | null>(null);
  const [loadingCommunes, startCommunes] = useTransition();

  const [errors, setErrors] = useState<Partial<Record<FieldError, string>>>({});
  const [failure, setFailure] = useState<CheckoutError | null>(null);
  const [submitting, startSubmit] = useTransition();
  const [busyLine, setBusyLine] = useState<string | null>(null);
  const [updating, startUpdate] = useTransition();

  // Communes follow the wilaya. The previous choice is cleared first: leaving
  // a commune from the old wilaya selected is how an order goes to the wrong
  // end of the country.
  useEffect(() => {
    if (!wilayaCode) {
      setCommunes([]);
      setCommuneId("");
      return;
    }

    setCommuneId("");
    startCommunes(async () => {
      setCommunes(
        await communesForWilayaAction({ wilayaCode: Number(wilayaCode), locale }),
      );
    });
  }, [wilayaCode, locale]);

  // Shipping recalculates on both wilaya and delivery type.
  useEffect(() => {
    if (!wilayaCode) {
      setShippingDzd(null);
      return;
    }
    let cancelled = false;
    shippingCostAction({ wilayaCode: Number(wilayaCode), deliveryType: delivery }).then(
      ({ costDzd }) => {
        if (!cancelled) setShippingDzd(costDzd);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [wilayaCode, delivery]);

  // Every key spelled out, so the message catalogue can be checked statically
  // rather than assembled from a fragment at runtime.
  const failureMessage: Record<CheckoutError, string> = {
    phone_invalid: t("errors.phoneInvalid"),
    commune_mismatch: t("errors.communeMismatch"),
    wilaya_unavailable: t("errors.wilayaUnavailable"),
    product_unavailable: t("errors.productUnavailable"),
    empty_cart: t("errors.emptyCart"),
    rate_limited: t("errors.rateLimited"),
    generic: t("errors.generic"),
    stale_deploy: t("errors.staleDeploy"),
  };

  const selected = wilayas.find((w) => w.code === Number(wilayaCode));
  const subtotalDzd = cart.reduce((sum, l) => sum + l.lineTotalDzd, 0);
  const totalDzd = subtotalDzd + (shippingDzd ?? 0);
  const empty = cart.length === 0;

  function lineKey(productId: string, colorId: string | null) {
    return `${productId}:${colorId ?? ""}`;
  }

  function changeQuantity(productId: string, colorId: string | null, quantity: number) {
    setBusyLine(lineKey(productId, colorId));
    startUpdate(async () => {
      try {
        await setCartQuantityAction({ productId, colorId, quantity });
        router.refresh();
      } catch {
        // Same stale-action-ID case as the order submit below - a reload
        // fetches the current bundle instead of leaving this row stuck.
        window.location.reload();
        return;
      } finally {
        setBusyLine(null);
      }
    });
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (empty || submitting) return;

    const form = new FormData(event.currentTarget);
    const customerName = String(form.get("customerName") ?? "").trim();
    const phone = String(form.get("phone") ?? "").trim();

    // Checked here so the visitor sees the problem next to the field, and
    // checked again on the server because this proves nothing.
    const found: Partial<Record<FieldError, string>> = {};
    if (customerName.length < 2) found.customerName = t("errors.nameRequired");
    if (!normalisePhone(phone)) found.phone = t("errors.phoneInvalid");
    if (!wilayaCode) found.wilayaCode = t("errors.wilayaRequired");
    if (!communeId) found.communeId = t("errors.communeRequired");

    setErrors(found);
    setFailure(null);
    if (Object.keys(found).length > 0) {
      document.getElementById(Object.keys(found)[0]!)?.focus();
      return;
    }

    startSubmit(async () => {
      let result;
      try {
        result = await placeOrderAction({
          customerName,
          phone,
          email: String(form.get("email") ?? "").trim() || undefined,
          wilayaCode: Number(wilayaCode),
          communeId: Number(communeId),
          deliveryType: delivery,
          address: String(form.get("address") ?? "").trim() || undefined,
          customerNote: String(form.get("customerNote") ?? "").trim() || undefined,
          promoCode: String(form.get("promoCode") ?? "").trim() || undefined,
        });
      } catch {
        // placeOrderAction never throws for a business-logic failure - every
        // expected case (bad phone, empty cart, rate limit, a real DB error)
        // comes back as a normal `{ ok: false }` below. Reaching this catch
        // at all means the call never reached the server in the first
        // place: almost always a deploy rotating server action IDs after
        // this tab's bundle already loaded, and Next.js redacts the actual
        // reason from the client in production, so there is no message text
        // worth matching on - "try again" alone would just repeat the same
        // stale call forever. A reload fetches the current bundle; the
        // customer's next submit then reaches the current build's action.
        setFailure("stale_deploy");
        window.scrollTo({ top: 0, behavior: "smooth" });
        setTimeout(() => window.location.reload(), 2000);
        return;
      }

      if (!result.ok) {
        setFailure(result.error);
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      // The reference travels in a short-lived cookie, not the URL.
      router.push("/order-confirmed");
    });
  }

  return (
    <Section grid="fine" className="bg-background">
      <Frame className="py-14 sm:py-20">
        <Reveal>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{t("title")}</h1>
          <p className="mt-3 max-w-xl text-muted-foreground">{t("subtitle")}</p>
        </Reveal>

        {failure && (
          <p
            role="alert"
            className="mt-8 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-foreground"
          >
            {failureMessage[failure]}
          </p>
        )}

        <div className="mt-12 grid gap-10 lg:grid-cols-[1.4fr_1fr] lg:gap-14">
          <Reveal delay={0.05}>
            <form id="checkout" className="space-y-6" onSubmit={onSubmit} noValidate>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="customerName">{t("fullName")}</Label>
                  <Input
                    id="customerName"
                    name="customerName"
                    autoComplete="name"
                    required
                    aria-invalid={!!errors.customerName}
                    aria-describedby={errors.customerName ? "customerName-error" : undefined}
                    className="h-11"
                  />
                  {errors.customerName && (
                    <p id="customerName-error" className="text-xs text-primary-press">
                      {errors.customerName}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="phone">{t("phone")}</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    dir="ltr"
                    required
                    placeholder="0555 12 34 56"
                    aria-invalid={!!errors.phone}
                    aria-describedby={errors.phone ? "phone-error" : "phone-hint"}
                    className="h-11"
                  />
                  {errors.phone ? (
                    <p id="phone-error" className="text-xs text-primary-press">
                      {errors.phone}
                    </p>
                  ) : (
                    <p id="phone-hint" className="text-xs text-muted-foreground">
                      {t("phoneHint")}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="email">{t("email")}</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    dir="ltr"
                    className="h-11"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="wilayaCode">{t("wilaya")}</Label>
                  <Select value={wilayaCode} onValueChange={setWilayaCode}>
                    <SelectTrigger
                      id="wilayaCode"
                      aria-invalid={!!errors.wilayaCode}
                      className="h-11"
                    >
                      <SelectValue placeholder={t("wilayaPlaceholder")} />
                    </SelectTrigger>
                    <SelectContent className="max-h-72">
                      {wilayas.map((w) => (
                        <SelectItem key={w.code} value={String(w.code)} disabled={!w.isAvailable}>
                          <span className="figures me-2 text-muted-foreground">
                            {String(w.code).padStart(2, "0")}
                          </span>
                          {w.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.wilayaCode && (
                    <p className="text-xs text-primary-press">{errors.wilayaCode}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="communeId">{t("commune")}</Label>
                  <Select
                    value={communeId}
                    onValueChange={setCommuneId}
                    disabled={!wilayaCode || loadingCommunes}
                  >
                    <SelectTrigger
                      id="communeId"
                      aria-invalid={!!errors.communeId}
                      className="h-11"
                    >
                      <SelectValue
                        placeholder={
                          !wilayaCode
                            ? t("communeWaiting")
                            : loadingCommunes
                              ? "…"
                              : t("communePlaceholder")
                        }
                      />
                    </SelectTrigger>
                    <SelectContent className="max-h-72">
                      {communes.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.communeId ? (
                    <p className="text-xs text-primary-press">{errors.communeId}</p>
                  ) : (
                    wilayaCode &&
                    !loadingCommunes && (
                      <p className="figures text-xs text-muted-foreground">
                        {t("communeCount", { count: communes.length })}
                      </p>
                    )
                  )}
                </div>
              </div>

              <fieldset className="space-y-2">
                <legend className="mb-2 text-sm font-medium">{t("deliveryType")}</legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  {(
                    [
                      {
                        key: "home",
                        Icon: Truck,
                        label: t("deliveryHome"),
                        price: selected?.homeDzd ?? null,
                        hint: null,
                      },
                      {
                        key: "desk",
                        Icon: Building2,
                        label: t("deliveryDesk"),
                        price: selected?.deskDzd ?? null,
                        hint: t("deliveryDeskHint"),
                      },
                    ] satisfies {
                      key: Delivery;
                      Icon: typeof Truck;
                      label: string;
                      price: number | null;
                      hint: string | null;
                    }[]
                  ).map(({ key, Icon, label, price, hint }) => (
                    <label
                      key={key}
                      className={cn(
                        "flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors",
                        delivery === key
                          ? "border-primary bg-primary/[0.03]"
                          : "border-border hover:border-foreground/25",
                      )}
                    >
                      <input
                        type="radio"
                        name="deliveryType"
                        value={key}
                        checked={delivery === key}
                        onChange={() => setDelivery(key)}
                        className="mt-0.5 h-4 w-4 accent-[oklch(0.588_0.226_27.5)]"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2 text-sm font-semibold">
                          <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
                          {label}
                        </span>
                        {hint && (
                          <span className="mt-1 block text-xs text-muted-foreground">{hint}</span>
                        )}
                        {price !== null && price !== undefined && (
                          <span className="figures mt-1 block text-sm font-semibold">
                            {formatDzd(price, priceLocale)}
                          </span>
                        )}
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <div className="space-y-1.5">
                <Label htmlFor="address">{t("address")}</Label>
                <Input
                  id="address"
                  name="address"
                  autoComplete="street-address"
                  placeholder={t("addressPlaceholder")}
                  className="h-11"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="customerNote">{t("checkoutNote")}</Label>
                <Textarea
                  id="customerNote"
                  name="customerNote"
                  maxLength={500}
                  placeholder={t("checkoutNoteHint")}
                  className="min-h-20"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="promoCode">{t("promoCode")}</Label>
                <Input
                  id="promoCode"
                  name="promoCode"
                  dir="ltr"
                  autoCapitalize="characters"
                  className="h-11 max-w-56 uppercase"
                />
              </div>
            </form>
          </Reveal>

          <Reveal delay={0.1}>
            <aside className="sheet-ticks rounded-xl border border-rule bg-card p-6 lg:sticky lg:top-24">
              <h2 className="text-sm font-bold tracking-[0.14em] uppercase">{tCart("title")}</h2>

              {empty ? (
                <div className="mt-6">
                  <p className="text-sm text-muted-foreground">{tCart("empty")}</p>
                  <Link
                    href="/catalogue"
                    className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-lg bg-primary px-6 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary-press"
                  >
                    {tCart("emptyAction")}
                  </Link>
                </div>
              ) : (
                <>
                  <ul className="mt-5 space-y-4">
                    {cart.map((line) => {
                      const key = lineKey(line.productId, line.colorId);
                      return (
                        <li key={key} className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <Link
                              href={`/products/${line.slug}`}
                              className="block truncate text-sm font-medium underline-offset-4 hover:underline"
                            >
                              {line.title}
                            </Link>
                            {line.colorName && (
                              <span className="mt-0.5 block text-xs text-muted-foreground">
                                {line.colorName}
                              </span>
                            )}
                            <span className="figures mt-0.5 block text-xs text-muted-foreground">
                              {formatDzd(line.priceDzd, priceLocale)}
                            </span>

                            <div className="mt-2 inline-flex items-center rounded-md border border-border">
                              <button
                                type="button"
                                onClick={() => changeQuantity(line.productId, line.colorId, line.quantity - 1)}
                                disabled={updating}
                                aria-label={tCart("decrease")}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-s-md text-muted-foreground transition-colors hover:bg-paper hover:text-foreground disabled:opacity-40"
                              >
                                {line.quantity === 1 ? (
                                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                                ) : (
                                  <Minus className="h-3.5 w-3.5" aria-hidden="true" />
                                )}
                              </button>
                              <span className="figures w-8 text-center text-xs font-bold tabular-nums">
                                {busyLine === key && updating ? (
                                  <Loader2
                                    className="mx-auto h-3 w-3 animate-spin"
                                    aria-hidden="true"
                                  />
                                ) : (
                                  line.quantity
                                )}
                              </span>
                              <button
                                type="button"
                                onClick={() => changeQuantity(line.productId, line.colorId, line.quantity + 1)}
                                disabled={
                                  updating ||
                                  line.quantity >= Math.min(line.maxQuantity, CART_MAX_QUANTITY)
                                }
                                aria-label={tCart("increase")}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-e-md text-muted-foreground transition-colors hover:bg-paper hover:text-foreground disabled:opacity-40"
                              >
                                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                              </button>
                            </div>
                          </div>

                          <span className="figures shrink-0 text-sm font-semibold">
                            {formatDzd(line.lineTotalDzd, priceLocale)}
                          </span>
                        </li>
                      );
                    })}
                  </ul>

                  <dl className="mt-6 space-y-2 border-t border-border pt-4 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">{tCart("subtotal")}</dt>
                      <dd className="figures font-medium">{formatDzd(subtotalDzd, priceLocale)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">{tCart("shipping")}</dt>
                      <dd className="figures font-medium">
                        {shippingDzd === null ? (
                          <span className="text-muted-foreground">{tCart("shippingPending")}</span>
                        ) : (
                          formatDzd(shippingDzd, priceLocale)
                        )}
                      </dd>
                    </div>
                    <div className="flex justify-between border-t border-border pt-3 text-base">
                      <dt className="font-bold">{tCart("total")}</dt>
                      <dd className="figures font-bold">{formatDzd(totalDzd, priceLocale)}</dd>
                    </div>
                  </dl>

                  {/* Cash on delivery is stated on the button, not in fine print. */}
                  <button
                    type="submit"
                    form="checkout"
                    disabled={submitting}
                    className="mt-6 flex h-13 w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary-press disabled:opacity-60"
                  >
                    {submitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <ShoppingBag className="h-4 w-4" aria-hidden="true" />
                    )}
                    {submitting ? t("submitting") : t("submit")}
                  </button>

                  <p className="mt-4 text-center text-xs text-muted-foreground">
                    <Link href="/catalogue" className="underline-offset-4 hover:underline">
                      {tAction("continueShopping")}
                    </Link>
                  </p>
                </>
              )}
            </aside>
          </Reveal>
        </div>
      </Frame>
    </Section>
  );
}
