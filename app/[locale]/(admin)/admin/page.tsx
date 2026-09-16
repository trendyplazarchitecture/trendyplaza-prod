import { Link } from "../../../../i18n/navigation";
import { getTranslations } from "next-intl/server";
import {
  ArrowRight,
  BookOpen,
  Boxes,
  FileStack,
  GraduationCap,
  Mail,
  Megaphone,
  Package,
  PackageX,
  Phone,
  Receipt,
  Settings,
  Truck,
  Users,
} from "lucide-react";

import { AdminReveal, Empty, Panel, TitleBlock } from "@/components/admin/AdminChrome";
import { AccessMixBar, OrderTrendChart, WilayaChart } from "@/components/admin/Charts";
import { ORDER_TONE, StatusPill } from "@/components/admin/StatusPill";
import { requireStaffOrNotFound } from "@/server/session";
import {
  getEntitlementSources,
  getLowStock,
  getOverviewTotals,
  getOrderTrend,
  getRecentActivity,
  getSheetFigures,
  getTopWilayas,
  getWorkload,
} from "@/server/admin";
import { getMostViewedModules } from "@/server/progress";
import { listOrders } from "@/server/orders";
import { listWilayas } from "@/server/geo";
import { formatDzd } from "@/lib/money";
import { formatPhone } from "@/lib/phone";
import type { Locale } from "@/lib/i18n-content";

export const dynamic = "force-dynamic";

/** `orders.confirmed` becomes "Order confirmed". Cheaper than a lookup table. */
function readAction(action: string) {
  const [, verb = action] = action.split(".");
  const words = verb.replace(/_/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

function relative(date: Date, t: Awaited<ReturnType<typeof getTranslations>>) {
  const mins = Math.round((Date.now() - date.getTime()) / 60000);
  if (mins < 1) return t("justNow");
  if (mins < 60) return t("minutesAgo", { count: mins });
  const hours = Math.round(mins / 60);
  if (hours < 24) return t("hoursAgo", { count: hours });
  return t("daysAgo", { count: Math.round(hours / 24) });
}

export default async function AdminOverviewPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("admin.dashboard");
  const tOrders = await getTranslations("admin.orders");
  const user = await requireStaffOrNotFound();

  // Lazy purge: no scheduler in this project by design (07_INTEGRATIONS.md).
  // The admin overview is the page everyone hits first and hits often, so
  // "30 days" becomes "30 days, or the next time anyone opens the admin
  // after that." Awaited: an un-awaited write here can be abandoned once
  // this server component finishes streaming, the same reason
  // `resourceViews`' fire-and-forget write only works from a route handler.
  const { purgeExpiredTrash } = await import("@/server/trash");
  await purgeExpiredTrash(user.id);

  const canViewOrders = user.permissions.has("orders.view");
  const canManageContent =
    user.permissions.has("content.manage") ||
    user.permissions.has("posts.manage") ||
    user.permissions.has("courses.manage");
  const canViewStudents = user.permissions.has("students.view");
  const canViewMessages = user.permissions.has("messages.view");

  const PER_PANEL = 5;

  const [
    workload,
    figures,
    trend,
    wilayaRows,
    wilayas,
    sources,
    activity,
    lowStock,
    queue,
    totals,
    mostRead,
  ] = await Promise.all([
    getWorkload().catch(() => ({
      pendingOrders: 0,
      readyToShip: 0,
      pendingRequests: 0,
      lowStock: 0,
      pendingMessages: 0,
    })),
    getSheetFigures().catch(() => ({
      revenueDzd: 0,
      deliveredCount: 0,
      unredeemedCodes: 0,
    })),
    getOrderTrend(14).catch(() => []),
    getTopWilayas(6).catch(() => []),
    listWilayas(locale).catch(() => []),
    getEntitlementSources().catch(() => ({ code: 0, request: 0, admin: 0 })),
    getRecentActivity(PER_PANEL).catch(() => []),
    getLowStock(5, PER_PANEL).catch(() => []),
    canViewOrders
      ? listOrders({ status: ["pending"], limit: PER_PANEL }).catch(() => [])
      : Promise.resolve([]),
    getOverviewTotals().catch(() => ({
      orders: 0,
      products: 0,
      students: 0,
      activity: 0,
    })),
    getMostViewedModules(PER_PANEL).catch(() => []),
  ]);

  const wilayaName = new Map(wilayas.map((w) => [w.code, w.name]));
  const wilayaData = wilayaRows.map((r) => ({
    name: wilayaName.get(r.wilayaCode) ?? String(r.wilayaCode),
    n: r.n,
  }));

  const today = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-rule pb-5">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-[1.75rem]">
            {canViewOrders ? t("todaysSheet") : t("welcomeBack", { name: user.name })}
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {today} · {canViewOrders ? t("ordersSubtitle") : t("staffSubtitle")}
          </p>
        </div>
      </header>

      {/* The title block */}
      <TitleBlock
        items={[
          ...(canViewOrders
            ? [
                {
                  label: t("toPhone"),
                  value: String(workload.pendingOrders),
                  hint: t("ordersPending"),
                  tone: (workload.pendingOrders > 0 ? "alert" : "default") as "alert" | "default",
                },
                {
                  label: t("toShip"),
                  value: String(workload.readyToShip),
                  hint: t("confirmedHint"),
                },
              ]
            : []),
          {
            label: t("receipts"),
            value: String(workload.pendingRequests),
            hint: t("awaitingReview"),
            tone: (workload.pendingRequests > 0 ? "alert" : "default") as "alert" | "default",
          },
          {
            label: t("inquiries"),
            value: String(workload.pendingMessages),
            hint: t("newMessages"),
            tone: (workload.pendingMessages > 0 ? "alert" : "default") as "alert" | "default",
          },
          ...(canViewOrders
            ? [
                {
                  label: t("revenue30d"),
                  value: formatDzd(figures.revenueDzd),
                  hint: t("deliveredCount", { count: figures.deliveredCount }),
                },
              ]
            : [
                {
                  label: t("cardsLeft"),
                  value: String(figures.unredeemedCodes),
                  hint: t("unredeemed"),
                  tone: (figures.unredeemedCodes < 20 ? "alert" : "default") as "alert" | "default",
                },
              ]),
        ]}
      />

      {/* Non-orders Quick Access Hub */}
      {!canViewOrders && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {canManageContent && (
            <Link
              href="/admin/content"
              className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-paper"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
                <FileStack className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">{t("contentHub")}</p>
                <p className="text-xs text-muted-foreground">{t("contentHubHint")}</p>
              </div>
            </Link>
          )}

          {user.permissions.has("posts.manage") && (
            <Link
              href="/admin/posts"
              className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-paper"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600">
                <Megaphone className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">{t("postsEvents")}</p>
                <p className="text-xs text-muted-foreground">{t("postsEventsHint")}</p>
              </div>
            </Link>
          )}

          {canViewStudents && (
            <Link
              href="/admin/students"
              className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-paper"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600">
                <GraduationCap className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">{t("studentsCard")}</p>
                <p className="text-xs text-muted-foreground">{t("studentsCardHint")}</p>
              </div>
            </Link>
          )}

          {canViewMessages && (
            <Link
              href="/admin/messages"
              className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-paper"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600">
                <Mail className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">{t("messagesCard")}</p>
                <p className="text-xs text-muted-foreground">
                  {t("newContactRequests", { count: workload.pendingMessages })}
                </p>
              </div>
            </Link>
          )}
        </div>
      )}

      {/* Main Grid */}
      <div className="grid gap-6 xl:grid-cols-[1.55fr_1fr]">
        <AdminReveal delay={0.04} className="space-y-6">
          {canViewOrders ? (
            <>
              <Panel
                title={t("waitingForCall")}
                padded={false}
                action={
                  <Link
                    href="/admin/orders?status=pending"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-primary-press transition-colors hover:text-primary"
                  >
                    {workload.pendingOrders > PER_PANEL
                      ? t("seeAll", { count: workload.pendingOrders })
                      : t("openQueue")}
                    <ArrowRight className="h-3.5 w-3.5 rtl:-scale-x-100" aria-hidden="true" />
                  </Link>
                }
              >
                {queue.length === 0 ? (
                  <Empty title={t("queueClearTitle")} hint={t("queueClearHint")} />
                ) : (
                  <ul className="divide-y divide-border">
                    {queue.map((order) => (
                      <li key={order.id}>
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-paper"
                        >
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded border border-border bg-paper text-muted-foreground transition-colors group-hover:border-primary/40 group-hover:text-primary">
                            <Phone className="h-3.5 w-3.5" aria-hidden="true" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex items-baseline gap-2">
                              <span className="truncate text-sm font-semibold">
                                {order.customerName}
                              </span>
                              <span className="figures shrink-0 text-xs text-muted-foreground">
                                {order.reference}
                              </span>
                            </span>
                            <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                              <bdi dir="ltr">{formatPhone(order.phone)}</bdi>
                              {" · "}
                              {order.wilayaNameFr}
                              {" · "}
                              {t("itemCount", { count: order.itemCount })}
                            </span>
                          </span>
                          <span className="figures shrink-0 text-sm font-semibold">
                            {formatDzd(order.totalDzd)}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </Panel>

              <Panel title={t("ordersTrend")}>
                <OrderTrendChart data={trend} />
              </Panel>

              <Panel title={t("whereOrdersGoing")} padded={false}>
                <div className="p-4">
                  <WilayaChart data={wilayaData} />
                </div>
              </Panel>
            </>
          ) : (
            <>
              {/* Learning / Content Modules Overview */}
              <Panel title={t("mostReadModules")} padded={false}>
                {mostRead.length === 0 ? (
                  <Empty title={t("nothingOpenedTitle")} hint={t("nothingOpenedHint")} />
                ) : (
                  <ul className="divide-y divide-border">
                    {mostRead.map((m) => (
                      <li key={m.moduleId} className="flex items-center gap-3 px-4 py-2.5">
                        <BookOpen
                          className="h-4 w-4 shrink-0 text-muted-foreground"
                          aria-hidden="true"
                        />
                        <span className="min-w-0 flex-1 truncate text-sm">{m.titleEn}</span>
                        <span className="figures shrink-0 text-xs text-muted-foreground">
                          {t("readerCount", { count: m.readers })}
                        </span>
                        <span className="figures shrink-0 text-sm font-semibold">{m.views}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </Panel>

              <Panel title={t("howStudentsGettingIn")}>
                <AccessMixBar {...sources} />
              </Panel>
            </>
          )}
        </AdminReveal>

        <AdminReveal delay={0.08} className="space-y-6">
          {workload.pendingRequests > 0 && (
            <Panel
              title={t("receiptsToReview")}
              action={
                <Link
                  href="/admin/requests"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-primary-press hover:text-primary"
                >
                  {t("review")}
                  <ArrowRight className="h-3.5 w-3.5 rtl:-scale-x-100" aria-hidden="true" />
                </Link>
              }
            >
              <p className="flex items-start gap-2.5 text-sm text-muted-foreground">
                <Receipt className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                <span>
                  {t.rich("studentsWaitingDecision", {
                    count: workload.pendingRequests,
                    strong: (chunks) => (
                      <span className="figures font-semibold text-foreground">{chunks}</span>
                    ),
                  })}
                </span>
              </p>
            </Panel>
          )}

          {canViewOrders && (
            <Panel title={t("howStudentsGettingIn")}>
              <AccessMixBar {...sources} />
            </Panel>
          )}

          {canViewOrders && (
            <Panel title={t("mostReadModules")} padded={false}>
              {mostRead.length === 0 ? (
                <Empty title={t("nothingOpenedTitle")} hint={t("nothingOpenedHint")} />
              ) : (
                <ul className="divide-y divide-border">
                  {mostRead.map((m) => (
                    <li key={m.moduleId} className="flex items-center gap-3 px-4 py-2.5">
                      <BookOpen
                        className="h-4 w-4 shrink-0 text-muted-foreground"
                        aria-hidden="true"
                      />
                      <span className="min-w-0 flex-1 truncate text-sm">{m.titleEn}</span>
                      <span className="figures shrink-0 text-xs text-muted-foreground">
                        {t("readerCount", { count: m.readers })}
                      </span>
                      <span className="figures shrink-0 text-sm font-semibold">{m.views}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          )}

          {user.permissions.has("products.manage") && (
            <Panel
              title={t("runningLow")}
              padded={false}
              action={
                <Link
                  href="/admin/products"
                  className="text-xs font-semibold text-primary-press hover:text-primary"
                >
                  {workload.lowStock > PER_PANEL
                    ? t("seeAll", { count: workload.lowStock })
                    : t("productsLink")}
                </Link>
              }
            >
              {lowStock.length === 0 ? (
                <Empty title={t("stockHealthyTitle")} hint={t("stockHealthyHint")} />
              ) : (
                <ul className="divide-y divide-border">
                  {lowStock.map((p) => (
                    <li key={p.id} className="flex items-center gap-3 px-4 py-2.5">
                      <PackageX
                        className={
                          p.stockCount === 0
                            ? "h-4 w-4 shrink-0 text-primary"
                            : "h-4 w-4 shrink-0 text-muted-foreground"
                        }
                        aria-hidden="true"
                      />
                      <span className="min-w-0 flex-1 truncate text-sm">{p.titleEn}</span>
                      <span
                        className={
                          p.stockCount === 0
                            ? "figures text-sm font-bold text-primary-press"
                            : "figures text-sm font-semibold"
                        }
                      >
                        {p.stockCount}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          )}

          {/* Activity stream */}
          <Panel
            title={t("revisions")}
            padded={false}
            action={
              <Link
                href="/admin/activity"
                className="text-xs font-semibold text-primary-press hover:text-primary"
              >
                {totals.activity > PER_PANEL ? t("seeAll", { count: totals.activity }) : t("fullLog")}
              </Link>
            }
          >
            {activity.length === 0 ? (
              <Empty title={t("nothingLoggedTitle")} hint={t("nothingLoggedHint")} />
            ) : (
              <ol className="divide-y divide-border">
                {activity.map((row) => (
                  <li key={row.id} className="px-4 py-2.5">
                    <p className="flex items-baseline gap-2 text-sm">
                      <span className="font-medium">{readAction(row.action)}</span>
                      <span className="text-muted-foreground">{row.entity.replace(/_/g, " ")}</span>
                      <span className="ms-auto shrink-0 text-xs text-muted-foreground">
                        {relative(row.createdAt, t)}
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {row.actorName ?? t("system")}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </Panel>

          {canViewOrders && (
            <Panel title={t("readyToShip")}>
              <p className="flex items-start gap-2.5 text-sm text-muted-foreground">
                <Truck className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                <span>
                  {t.rich("confirmedOrdersWaiting", {
                    count: workload.readyToShip,
                    strong: (chunks) => (
                      <span className="figures font-semibold text-foreground">{chunks}</span>
                    ),
                  })}
                </span>
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {(["confirmed", "packed", "shipped"] as const).map((s) => (
                  <StatusPill key={s} tone={ORDER_TONE[s]}>
                    {tOrders(`status.${s}`)}
                  </StatusPill>
                ))}
              </div>
            </Panel>
          )}
        </AdminReveal>
      </div>
    </div>
  );
}
