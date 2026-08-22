import type { Metadata } from "next";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { BookOpen, PauseCircle, TimerOff } from "lucide-react";

import { redirect } from "../../../../../i18n/navigation";
import { ProfileCard } from "@/components/portal/ProfileCard";
import { getCurrentUser } from "@/server/session";
import { listMyEntitlements } from "@/server/entitlements";
import type { Locale } from "@/lib/i18n-content";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ locale: Locale }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "portal.profile" });
  return { title: t("title"), robots: { index: false, follow: false } };
}

/**
 * The account itself: who this is, and what it holds.
 *
 * Redemption and the receipt upload are deliberately not repeated here. They
 * are on the dashboard, where a student without access lands, and a second
 * copy of a form that writes an entitlement is a second place to keep correct.
 */
export default async function ProfilePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await getCurrentUser();
  if (!user) {
    redirect({ href: "/login", locale });
    return null;
  }

  const t = await getTranslations({ locale, namespace: "portal.profile" });
  const tAccount = await getTranslations({ locale, namespace: "account" });
  const format = await getFormatter({ locale });

  const held = await listMyEntitlements(user.id, locale);

  const stateIcon = {
    paused: PauseCircle,
    expired: TimerOff,
    revoked: TimerOff,
    active: BookOpen,
  } as const;

  // Spelled out rather than assembled, so the parity script can see the keys.
  const stateLabel = {
    paused: tAccount("state.paused"),
    expired: tAccount("state.expired"),
    revoked: tAccount("state.revoked"),
    active: tAccount("state.active"),
  } as const;

  return (
    <div className="w-full max-w-3xl">
      <header>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
          {t("title")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("lede")}</p>
      </header>

      <div className="mt-6">
        <ProfileCard name={user.name} email={user.email} image={user.image} />
      </div>

      {held.length > 0 && (
        <section
          className="mt-8 rounded-xl border border-rule bg-card"
          aria-labelledby="access-heading"
        >
          <div className="border-b border-rule px-4 py-3">
            <h2 id="access-heading" className="text-sm font-semibold tracking-tight">
              {tAccount("yourAccess")}
            </h2>
          </div>

          <ul className="divide-y divide-rule">
            {held.map((entitlement) => {
              const Icon = stateIcon[entitlement.status];
              const isLive = entitlement.status === "active";

              return (
                <li key={entitlement.id} className="flex items-start gap-3 px-4 py-3.5">
                  <Icon
                    className={`mt-0.5 h-4 w-4 shrink-0 ${isLive ? "text-primary" : "text-muted-foreground"}`}
                    aria-hidden="true"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{entitlement.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {isLive
                        ? entitlement.expiresAt
                          ? tAccount("activeUntil", {
                              date: format.dateTime(entitlement.expiresAt, {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              }),
                            })
                          : tAccount("activeForever")
                        : stateLabel[entitlement.status]}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
