import { notFound } from "next/navigation";
import { Link } from "../../../../../../i18n/navigation";
import { getTranslations } from "next-intl/server";
import { ArrowLeft, Building2, IdCard, Phone, Truck } from "lucide-react";

import { PageHead, Panel } from "@/components/admin/AdminChrome";
import { OrderActions } from "@/components/admin/OrderActions";
import { ORDER_TONE, StatusPill } from "@/components/admin/StatusPill";
import { hasPermission, requireStaffOrNotFound } from "@/server/session";
import { PermissionGate } from "@/components/admin/PermissionGate";
import { getOrderDetail } from "@/server/orders";
import { getEntityActivity } from "@/server/admin";
import { listNotes } from "@/server/notes";
import { NotesPanel } from "@/components/admin/NotesPanel";
import { CopyButton } from "@/components/admin/CopyButton";
import { formatDzd } from "@/lib/money";
import { formatPhone } from "@/lib/phone";

export const dynamic = "force-dynamic";

/**
 * One order, on one screen.
 *
 * This page is opened while the phone is ringing, so the things said out loud
 * come first: who to ask for, what number to call, where it goes and what it
 * costs. The revision trail sits at the bottom, because it answers "what
 * happened" rather than "what now".
 */
export default async function AdminOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireStaffOrNotFound();
  if (!user.permissions.has("orders.view")) {
    return (
      <div className="space-y-6">
        <PageHead title="Order Details" />
        <PermissionGate permission="orders.view" />
      </div>
    );
  }

  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const [order, canConfirm, canEdit, t] = await Promise.all([
    getOrderDetail(id),
    hasPermission("orders.confirm"),
    hasPermission("orders.edit"),
    getTranslations("admin.orders"),
  ]);
  if (!order) notFound();

  // Same "every key spelled out" shape as OrdersTable.tsx's client-side copy.
  const statusLabel: Record<string, string> = {
    pending: t("status.pending"),
    confirmed: t("status.confirmed"),
    packed: t("status.packed"),
    shipped: t("status.shipped"),
    delivered: t("status.delivered"),
    cancelled: t("status.cancelled"),
    returned: t("status.returned"),
  };

  const [trail, notes] = await Promise.all([
    getEntityActivity("order", order.id),
    listNotes("order", order.id),
  ]);
  const itemsTotal = order.items.reduce(
    (sum, item) => sum + item.priceAtPurchaseDzd * item.quantity,
    0,
  );

  const facts = [
    {
      label: "Phone",
      value: formatPhone(order.phone),
      href: `tel:${order.phone}`,
      Icon: Phone,
      copyValue: order.phone,
    },
    {
      label: "Delivery",
      value:
        order.deliveryType === "home"
          ? `To the address, ${order.communeNameFr}`
          : `Stop desk, ${order.communeNameFr}`,
      Icon: order.deliveryType === "home" ? Truck : Building2,
      copyValue: undefined as string | undefined,
    },
    {
      label: "Wilaya",
      value: `${String(order.wilayaCode).padStart(2, "0")} ${order.wilayaNameFr}`,
      copyValue: undefined as string | undefined,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHead
        title={order.reference}
        meta={
          <span className="flex flex-wrap items-center gap-2">
            <StatusPill tone={ORDER_TONE[order.status] ?? "halted"}>
              {statusLabel[order.status] ?? order.status}
            </StatusPill>
            <span>
              Placed{" "}
              {order.createdAt.toLocaleDateString("en-GB", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
              {order.createdByAdminId && " · taken by an admin"}
            </span>
          </span>
        }
        action={
          <>
            <CopyButton value={order.reference} label="Copy the order reference" />
            <Link
              href="/admin/orders"
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border px-3 text-xs font-medium transition-colors hover:border-foreground/30 hover:bg-paper"
            >
              <ArrowLeft className="h-3.5 w-3.5 rtl:-scale-x-100" aria-hidden="true" />
              Back to the queue
            </Link>
          </>
        }
      />

      <OrderActions
        orderId={order.id}
        reference={order.reference}
        status={order.status}
        canConfirm={canConfirm}
        canEdit={canEdit}
      />

      {order.status === "cancelled" && order.cancelReasonFr && (
        <p className="rounded-lg border border-primary/25 bg-primary/5 px-4 py-3 text-sm">
          <span className="font-semibold">Cancelled:</span> {order.cancelReasonFr}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-6">
          <Panel title="Items" padded={false}>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-start text-xs text-muted-foreground">
                  <th className="px-4 py-2.5 text-start font-medium">Product</th>
                  <th className="px-4 py-2.5 text-end font-medium">Unit</th>
                  <th className="px-4 py-2.5 text-end font-medium">Qty</th>
                  <th className="px-4 py-2.5 text-end font-medium">Line</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.id} className="border-b border-border last:border-0">
                    {/* The title frozen on the line, not the product's current
                        one. A rename must not rewrite an old order. */}
                    <td className="px-4 py-3">
                      {item.titleAtPurchaseEn}
                      {item.colorNameAtPurchaseEn && (
                        <span className="block text-xs text-muted-foreground">
                          {item.colorNameAtPurchaseEn}
                        </span>
                      )}
                    </td>
                    <td className="figures px-4 py-3 text-end text-muted-foreground">
                      {formatDzd(item.priceAtPurchaseDzd)}
                    </td>
                    <td className="figures px-4 py-3 text-end">{item.quantity}</td>
                    <td className="figures px-4 py-3 text-end font-medium">
                      {formatDzd(item.priceAtPurchaseDzd * item.quantity)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>

          {order.codes.length > 0 && (
            <Panel title="Access cards issued against this order">
              <ul className="space-y-2">
                {order.codes.map((code) => (
                  <li
                    key={code.id}
                    className="flex flex-wrap items-center gap-3 rounded-md border border-border px-3 py-2"
                  >
                    <IdCard className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                    <code className="figures text-sm font-semibold">{code.code}</code>
                    <StatusPill
                      tone={code.voidedAt ? "alert" : code.isRedeemed ? "done" : "pending"}
                      className="ms-auto"
                    >
                      {code.voidedAt ? "Void" : code.isRedeemed ? "Redeemed" : "Not used"}
                    </StatusPill>
                  </li>
                ))}
              </ul>
            </Panel>
          )}

          {/*
            Notes sit above the revision log deliberately. Revisions are what
            the system did; notes are what a person found out on the phone, and
            that is the thing whoever rings next actually needs.
          */}
          {canEdit && (
            <NotesPanel subjectType="order" subjectId={order.id} notes={notes} />
          )}

          <Panel title="Revisions" padded={false}>
            {trail.length === 0 ? (
              <p className="px-4 py-6 text-sm text-muted-foreground">
                Nothing recorded against this order yet.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {trail.map((entry) => (
                  <li key={entry.id} className="flex items-baseline gap-3 px-4 py-2.5 text-sm">
                    <span className="font-medium">{entry.action}</span>
                    <span className="text-muted-foreground">{entry.actorName ?? "the customer"}</span>
                    <span className="figures ms-auto shrink-0 text-xs text-muted-foreground">
                      {entry.createdAt.toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel
            title={order.customerName}
            action={<CopyButton value={order.customerName} label="Copy the customer's name" />}
          >
            <dl className="space-y-3 text-sm">
              {facts.map((fact) => (
                <div key={fact.label}>
                  <dt className="text-xs text-muted-foreground">{fact.label}</dt>
                  <dd className="mt-0.5 flex items-center gap-2">
                    {fact.Icon && (
                      <fact.Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                    )}
                    {fact.href ? (
                      <a href={fact.href} className="font-medium underline-offset-4 hover:underline">
                        <bdi dir="ltr">{fact.value}</bdi>
                      </a>
                    ) : (
                      <span className="font-medium">{fact.value}</span>
                    )}
                    {fact.copyValue && (
                      <CopyButton value={fact.copyValue} label={`Copy the ${fact.label.toLowerCase()}`} />
                    )}
                  </dd>
                </div>
              ))}

              {order.address && (
                <div>
                  <dt className="text-xs text-muted-foreground">Address</dt>
                  <dd className="mt-0.5 flex items-center gap-2 font-medium">
                    {order.address}
                    <CopyButton value={order.address} label="Copy the address" />
                  </dd>
                </div>
              )}

              {order.email && (
                <div>
                  <dt className="text-xs text-muted-foreground">Email</dt>
                  <dd className="mt-0.5 flex items-center gap-2">
                    <a href={`mailto:${order.email}`} className="underline-offset-4 hover:underline">
                      <bdi dir="ltr">{order.email}</bdi>
                    </a>
                    <CopyButton value={order.email} label="Copy the email address" />
                  </dd>
                </div>
              )}
            </dl>
          </Panel>

          {order.customerNote && (
            <Panel title="From the customer">
              <p className="text-sm whitespace-pre-wrap">{order.customerNote}</p>
            </Panel>
          )}

          <Panel title="Money">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Items</dt>
                <dd className="figures">{formatDzd(itemsTotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Shipping</dt>
                <dd className="figures">{formatDzd(order.shippingDzd)}</dd>
              </div>
              {order.discountDzd > 0 && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">
                    Discount{order.promoCode ? ` · ${order.promoCode}` : ""}
                  </dt>
                  <dd className="figures">−{formatDzd(order.discountDzd)}</dd>
                </div>
              )}
              <div className="flex justify-between border-t border-border pt-2 text-base font-bold">
                <dt>Cash on delivery</dt>
                <dd className="figures">{formatDzd(order.totalDzd)}</dd>
              </div>
            </dl>
          </Panel>
        </div>
      </div>
    </div>
  );
}
