import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { AuthForm } from "@/components/account/AuthForm";
import type { Locale } from "@/lib/i18n-content";

type Props = { params: Promise<{ locale: Locale }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth" });
  return { title: t("signIn"), robots: { index: false, follow: false } };
}

export default async function SignInPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "auth" });

  return (
    <div className="sheet-ticks w-full max-w-sm rounded-xl border border-rule bg-card p-6 shadow-sm sm:p-8">
      <h1 className="text-2xl font-extrabold tracking-tight">{t("signInTitle")}</h1>
      <p className="mt-2 mb-6 text-sm text-muted-foreground">{t("signInLede")}</p>

      {/* useSearchParams needs a boundary for the static shell. */}
      <Suspense fallback={<div className="h-72" />}>
        <AuthForm mode="signin" />
      </Suspense>
    </div>
  );
}
