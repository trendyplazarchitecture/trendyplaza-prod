import type { Metadata } from "next";
import { Wrench } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import type { Locale } from "@/lib/i18n-content";

type Props = { params: Promise<{ locale: Locale }> };

/**
 * NextPhase/05-services — scoped, not built. The portal already carries this
 * as a non-clickable "soon" card (`nav-items.ts`), but nothing stopped a
 * visitor from typing `/services` directly and hitting Next's default 404,
 * which reads as broken rather than "not shipped yet". This is the same
 * "coming soon" idea as `ComingSoon.tsx` in the admin, for the public side.
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "servicesComingSoon" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    robots: { index: false, follow: false },
  };
}

export default async function ServicesComingSoonPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("servicesComingSoon");

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-4 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-paper text-muted-foreground">
        <Wrench className="h-8 w-8" aria-hidden="true" />
      </div>
      <span className="mt-5 rounded-full bg-paper px-2.5 py-1 text-[11px] font-bold tracking-wide text-muted-foreground uppercase">
        {t("badge")}
      </span>
      <h1 className="mt-3 text-xl font-bold tracking-tight text-foreground sm:text-2xl">
        {t("title")}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">{t("body")}</p>
    </div>
  );
}
