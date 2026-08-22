"use client";

import { useState, useTransition } from "react";
import { Loader2, PackageSearch } from "lucide-react";
import { useFormatter, useLocale, useTranslations } from "next-intl";

import { Link } from "../../../i18n/navigation";
import { lookupOrderAction, type LookupResult } from "@/server/actions/checkout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Frame, Reveal, Section } from "./Sheet";
import { formatDzd } from "@/lib/money";
import { cn } from "@/lib/utils";

type Order = Extract<LookupResult, { ok: true }>["order"];

const STATUS_KEYS = [
  "pending",
  "confirmed",
  "packed",
  "shipped",
  "delivered",
  "cancelled",
  "returned",
] as const;

/** The five steps a healthy order walks. Cancelled and returned leave the line. */
const TRACK = ["pending", "confirmed", "packed", "shipped", "delivered"] as const;

export function SuiviClient() {
  const t = useTranslations("lookup");
  const tStatus = useTranslations("orderStatus");
  const tCart = useTranslations("cart");
  const locale = useLocale() as "en" | "ar" | "fr";
  const priceLocale = locale === "en" ? "fr" : locale;
  const format = useFormatter();

  const [order, setOrder] = useState<Order | null>(null);
  const [failed, setFailed] = useState<"not_found" | "rate_limited" | null>(null);
  const [pending, start] = useTransition();

  const statusLabel: Record<(typeof STATUS_KEYS)[number], string> = {
    pending: tStatus("pending"),
    confirmed: tStatus("confirmed"),
    packed: tStatus("packed"),
    shipped: tStatus("shipped"),
    delivered: tStatus("delivered"),
    cancelled: tStatus("cancelled"),
    returned: tStatus("returned"),
  };

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    start(async () => {
      const result = await lookupOrderAction(
        {
          reference: String(form.get("reference") ?? ""),
          phone: String(form.get("phone") ?? ""),
        },
        locale,
      );

      if (result.ok) {
        setOrder(result.order);
        setFailed(null);
      } else {
        setOrder(null);
        setFailed(result.error);
      }
    });
  }

  const reached = order ? TRACK.indexOf(order.status as (typeof TRACK)[number]) : -1;
  const stopped = order?.status === "cancelled" || order?.status === "returned";

  return (
    <Section grid="fine" className="bg-background">
      <Frame width="text" className="py-14 sm:py-20">
        <Reveal>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{t("title")}</h1>
          <p className="mt-3 text-muted-foreground">{t("subtitle")}</p>
        </Reveal>

        <Reveal delay={0.05}>
          <form onSubmit={onSubmit} className="mt-10 grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="reference">{t("reference")}</Label>
              <Input
                id="reference"
                name="reference"
                dir="ltr"
                required
                autoCapitalize="characters"
                placeholder={t("referencePlaceholder")}
                className="h-11 uppercase"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone">{t("phone")}</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                inputMode="tel"
                dir="ltr"
                required
                placeholder="0555 12 34 56"
                className="h-11"
              />
            </div>

            <button
              type="submit"
              disabled={pending}
              className="mt-1 inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-primary px-6 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary-press disabled:opacity-60 sm:col-span-2 sm:w-auto sm:justify-self-start"
            >
              {pending ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <PackageSearch className="h-4 w-4" aria-hidden="true" />
              )}
              {t("submit")}
            </button>
          </form>
        </Reveal>

        {/* One message for every kind of miss. A specific one would turn this
            into a way of testing which phone numbers have ordered. */}
        {failed && (
          <p
            role="alert"
            className="mt-8 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm"
          >
            {failed === "rate_limited" ? t("rateLimited") : t("notFound")}
          </p>
        )}

        {order && (
          <div className="sheet-ticks mt-10 rounded-xl border border-rule bg-card p-6">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <bdi dir="ltr" className="figures text-xl font-extrabold">
                {order.reference}
              </bdi>
              <span className="text-xs text-muted-foreground">
                {format.dateTime(new Date(order.createdAt), {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>

            {stopped ? (
              <p className="mt-5 inline-flex rounded-md border border-border bg-paper px-3 py-1.5 text-sm font-semibold">
                {statusLabel[order.status as keyof typeof statusLabel]}
              </p>
            ) : (
              <ol className="mt-6 space-y-3">
                {TRACK.map((step, i) => {
                  const done = i <= reached;
                  return (
                    <li key={step} className="flex items-center gap-3">
                      <span
                        aria-hidden="true"
                        className={cn(
                          "inline-block h-2 w-2 shrink-0 rounded-full",
                          done ? "bg-primary" : "bg-rule",
                        )}
                      />
                      <span
                        className={cn(
                          "text-sm",
                          i === reached
                            ? "font-bold text-foreground"
                            : done
                              ? "text-foreground"
                              : "text-muted-foreground",
                        )}
                      >
                        {statusLabel[step]}
                      </span>
                    </li>
                  );
                })}
              </ol>
            )}

            <ul className="mt-6 space-y-2 border-t border-border pt-4">
              {order.items.map((item, i) => (
                <li key={i} className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="min-w-0 truncate">
                    {item.title}
                    {item.colorName && (
                      <span className="ms-2 text-xs text-muted-foreground">{item.colorName}</span>
                    )}
                    <span className="figures ms-2 text-xs text-muted-foreground">
                      × {item.quantity}
                    </span>
                  </span>
                  <span className="figures shrink-0 font-medium">
                    {formatDzd(item.priceDzd * item.quantity, priceLocale)}
                  </span>
                </li>
              ))}
            </ul>

            <dl className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">{tCart("subtotal")}</dt>
                <dd className="figures">{formatDzd(order.subtotalDzd, priceLocale)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">{tCart("shipping")}</dt>
                <dd className="figures">{formatDzd(order.shippingDzd, priceLocale)}</dd>
              </div>
              {order.discountDzd > 0 && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">{tCart("discount")}</dt>
                  <dd className="figures">−{formatDzd(order.discountDzd, priceLocale)}</dd>
                </div>
              )}
              <div className="flex justify-between border-t border-border pt-3 text-base">
                <dt className="font-bold">{tCart("total")}</dt>
                <dd className="figures font-bold">{formatDzd(order.totalDzd, priceLocale)}</dd>
              </div>
            </dl>
          </div>
        )}

        <p className="mt-10 text-sm text-muted-foreground">
          <Link href="/catalogue" className="underline-offset-4 hover:underline">
            {tCart("emptyAction")}
          </Link>
        </p>
      </Frame>
    </Section>
  );
}
