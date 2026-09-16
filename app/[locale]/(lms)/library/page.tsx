import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowRight, GraduationCap } from "lucide-react";

import { Link, redirect } from "../../../../i18n/navigation";
import { Frame, Reveal, Section, SectionHead } from "@/components/site/Sheet";
import { getCurrentUser } from "@/server/session";
import { listMyUniversities } from "@/server/library";
import type { Locale } from "@/lib/i18n-content";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ locale: Locale }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "library" });
  return { title: t("title"), robots: { index: false, follow: false } };
}

/**
 * The library root. Every page in this group re-checks for itself, so a
 * revoked entitlement closes the door on the next page load rather than
 * whenever a session happens to expire.
 */
export default async function LibraryPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await getCurrentUser();
  if (!user) {
    redirect({ href: "/login", locale });
    return null;
  }

  const universities = await listMyUniversities(user.id, locale);

  // Nothing open means the account page, which is where the two ways in live.
  // A library with nothing in it is not a page worth rendering.
  if (universities.length === 0) {
    redirect({ href: "/account", locale });
    return null;
  }

  const t = await getTranslations({ locale, namespace: "library" });

  return (
    <Section grid="fine" className="bg-background">
      <Frame className="py-14 sm:py-20">
        <Reveal>
          <SectionHead as="h1" title={t("title")} lede={t("lede")} />
        </Reveal>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {universities.map((university, i) => (
            <Reveal key={university.id} delay={0.05 * i}>
              <Link
                href={`/library/${university.slug}`}
                className="sheet-ticks group flex h-full flex-col rounded-xl border border-rule bg-card p-6 transition-colors hover:border-primary/40"
              >
                <GraduationCap className="h-6 w-6 text-primary" aria-hidden="true" />

                <h2 className="mt-4 text-lg font-bold tracking-tight">{university.name}</h2>

                <p className="figures mt-2 text-sm text-muted-foreground">
                  {t("moduleCount", { count: university.moduleCount })}
                  {" · "}
                  {t("resourceCount", { count: university.resourceCount })}
                </p>

                <span className="mt-auto pt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-primary-press">
                  {t("open")}
                  <ArrowRight
                    className="h-4 w-4 transition-transform group-hover:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5"
                    aria-hidden="true"
                  />
                </span>
              </Link>
            </Reveal>
          ))}
        </div>
      </Frame>
    </Section>
  );
}
