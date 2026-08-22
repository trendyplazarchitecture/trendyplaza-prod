import type { Metadata } from "next";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowRight, Clock, KeyRound, Receipt } from "lucide-react";

import { Link, redirect } from "../../../../i18n/navigation";
import { RedeemForm } from "@/components/account/RedeemForm";
import { ReceiptForm } from "@/components/account/ReceiptForm";
import { Figures } from "@/components/portal/Figures";
import { QuickAccess } from "@/components/portal/QuickAccess";
import { RecentResources } from "@/components/portal/RecentResources";
import { Schools } from "@/components/portal/Schools";
import { StudentProgress } from "@/components/portal/StudentProgress";
import { getCurrentUser } from "@/server/session";
import { listMyEntitlements } from "@/server/entitlements";
import { getCarryOn, listMyProgress } from "@/server/progress";
import { getDashboardFigures, listRecentResources } from "@/server/portal";
import { listPortalUniversities } from "@/server/library";
import { getMyLatestRequest } from "@/server/access-requests";
import { listPackages } from "@/server/catalogue";
import { getSiteSettings } from "@/server/settings";
import type { Locale } from "@/lib/i18n-content";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ locale: Locale }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "account" });
  return { title: t("title"), robots: { index: false, follow: false } };
}

/**
 * The student dashboard.
 *
 * What it renders is decided by what the account holds — live access, a
 * receipt waiting on a person, a rejection with its reason, or the two ways in
 * — and the shape of the page changes with it rather than a "no access" error
 * appearing where a dashboard should be. A student who paid by transfer sits
 * in that state for a day, and a page that reads like a failure for a day is a
 * support message.
 *
 * Reading comes first for someone who holds access, because they came back to
 * carry on and not to check what they bought. Someone who holds nothing gets
 * the two ways in first, for the same reason. The full progress list and the
 * profile are their own pages; this one is the top of each.
 */
export default async function DashboardPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Checked here, in the page. The layout above draws chrome and is not a gate,
  // and `proxy.ts` is locale routing and is never one.
  const user = await getCurrentUser();
  if (!user) {
    redirect({ href: "/login", locale });
    return null;
  }

  const t = await getTranslations({ locale, namespace: "account" });
  const tPortal = await getTranslations({ locale, namespace: "portal" });
  const format = await getFormatter({ locale });

  const [held, latestRequest, packages, carryOn, progress, universities, figures, recent, settings] =
    await Promise.all([
      listMyEntitlements(user.id, locale),
      getMyLatestRequest(user.id),
      listPackages(locale),
      getCarryOn(user.id, locale),
      listMyProgress(user.id, locale),
      listPortalUniversities(user.id, locale),
      getDashboardFigures(user.id),
      listRecentResources(user.id, locale),
      getSiteSettings(),
    ]);

  const live = held.filter((e) => e.status === "active");
  const hasAccess = live.length > 0;
  const rip = settings.ripNumber || "—";

  // The dashboard shows the start of the progress list and links to the rest.
  // Ten modules under a heading is a page, not a summary.
  const topProgress = progress.slice(0, 4);

  return (
    <div className="w-full">
      <header>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
          {t("greeting", { name: user.name })}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {hasAccess ? t("dashboardLede") : t("dashboardLedeLocked")}
        </p>
      </header>

      {hasAccess && (
        <div className="mt-6">
          <Figures locale={locale} figures={figures} />
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Two columns on a wide screen, one on a phone. The rail holds what is */}
      {/* worth glancing at; the main column holds what is worth acting on.   */}
      {/* ------------------------------------------------------------------ */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {hasAccess && (
            <>
              <StudentProgress locale={locale} carryOn={carryOn} modules={topProgress} />

              {progress.length > topProgress.length && (
                <Link
                  href="/account/progress"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-colors hover:text-primary-press"
                >
                  {tPortal("seeAllProgress", { count: progress.length })}
                  <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
                </Link>
              )}
            </>
          )}

          {/* A receipt already sent, waiting on a person. */}
          {latestRequest?.status === "pending" && (
            <section className="rounded-xl border border-rule bg-card p-5">
              <div className="flex items-start gap-3">
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Clock className="h-4.5 w-4.5 text-primary" aria-hidden="true" />
                </span>
                <div>
                  <h2 className="font-semibold">{t("pending.title")}</h2>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {t("pending.body", {
                      date: format.dateTime(latestRequest.createdAt, {
                        day: "numeric",
                        month: "long",
                        hour: "numeric",
                        minute: "numeric",
                      }),
                    })}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {t("pending.meanwhile")}
                  </p>
                </div>
              </div>
            </section>
          )}

          {latestRequest?.status === "rejected" && !hasAccess && (
            <section className="rounded-xl border border-primary/30 bg-primary/5 p-5">
              <h2 className="font-semibold">{t("rejected.title")}</h2>
              <p className="mt-1 text-sm leading-relaxed">
                {locale === "ar"
                  ? latestRequest.rejectionReasonAr || latestRequest.rejectionReasonFr
                  : latestRequest.rejectionReasonFr}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">{t("rejected.retry")}</p>
            </section>
          )}

          {/* The two ways in. */}
          <section className="rounded-xl border border-rule bg-card p-5">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <KeyRound className="h-4.5 w-4.5 text-primary" aria-hidden="true" />
              </span>
              <h2 className="font-semibold">{t("redeem.title")}</h2>
            </div>
            <p className="mt-2 mb-4 text-sm text-muted-foreground">{t("redeem.lede")}</p>
            <RedeemForm />
          </section>

          {/* The receipt path is offered only to someone who has no live access
              and nothing already waiting. Two open requests from one student is
              work for an admin and confusion for the student. */}
          {!hasAccess && latestRequest?.status !== "pending" && packages.length > 0 && (
            <section className="rounded-xl border border-rule bg-card p-5">
              <div className="flex items-center gap-2.5">
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Receipt className="h-4.5 w-4.5 text-primary" aria-hidden="true" />
                </span>
                <h2 className="font-semibold">{t("receipt.title")}</h2>
              </div>
              <p className="mt-2 mb-4 text-sm text-muted-foreground">{t("receipt.lede")}</p>

              <ReceiptForm
                packages={packages.map((p) => ({
                  id: p.id,
                  title: p.title,
                  priceDzd: p.priceDzd,
                  defaultDurationDays: p.defaultDurationDays,
                }))}
                rip={rip}
                locale={locale}
              />
            </section>
          )}

          <Schools locale={locale} universities={universities} />
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* The rail                                                          */}
        {/* ---------------------------------------------------------------- */}
        <aside className="space-y-6">
          <QuickAccess locale={locale} hasAccess={hasAccess} />
          <RecentResources locale={locale} resources={recent} />
        </aside>
      </div>
    </div>
  );
}
