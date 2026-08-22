import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { redirect } from "../../../../../i18n/navigation";
import { Figures } from "@/components/portal/Figures";
import { StudentProgress } from "@/components/portal/StudentProgress";
import { getCurrentUser } from "@/server/session";
import { getCarryOn, listMyProgress } from "@/server/progress";
import { getDashboardFigures } from "@/server/portal";
import type { Locale } from "@/lib/i18n-content";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ locale: Locale }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "portal.sections.progress" });
  return { title: t("title"), robots: { index: false, follow: false } };
}

/**
 * Reading progress, on its own page.
 *
 * The dashboard shows the top of this — carry on, and the modules that are
 * open. This is the whole of it, and it is where the sidebar's "My progress"
 * lands rather than scrolling the dashboard to a heading.
 */
export default async function ProgressPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  // The layout draws chrome. The check that matters is here.
  const user = await getCurrentUser();
  if (!user) {
    redirect({ href: "/login", locale });
    return null;
  }

  const t = await getTranslations({ locale, namespace: "portal.sections.progress" });

  const [carryOn, modules, figures] = await Promise.all([
    getCarryOn(user.id, locale),
    listMyProgress(user.id, locale),
    getDashboardFigures(user.id),
  ]);

  return (
    <div className="w-full max-w-4xl">
      <header>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
          {t("title")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("lede")}</p>
      </header>

      <div className="mt-6">
        <Figures locale={locale} figures={figures} />
      </div>

      <div className="mt-8">
        <StudentProgress locale={locale} carryOn={carryOn} modules={modules} />
      </div>
    </div>
  );
}
