import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { FileText, Lock } from "lucide-react";

import { Link, redirect } from "../../../../../i18n/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Frame, Reveal, Section } from "@/components/site/Sheet";
import { getCurrentUser } from "@/server/session";
import { getMyTree } from "@/server/library";
import type { Locale } from "@/lib/i18n-content";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ locale: Locale; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "library" });
  return { title: t("title"), robots: { index: false, follow: false } };
}

/**
 * University → year → semester → module, the way a school files it, because
 * that is the shape already in the student's head.
 *
 * Modules outside the student's package are shown and marked, not hidden. What
 * a pack does not cover is a thing worth knowing, and hiding it makes the
 * library look emptier than it is.
 */
export default async function UniversityTreePage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const user = await getCurrentUser();
  if (!user) {
    redirect({ href: "/login", locale });
    return null;
  }

  const tree = await getMyTree(user.id, slug, locale);
  if (!tree) notFound();

  const t = await getTranslations({ locale, namespace: "library" });

  return (
    <Section grid="fine" className="bg-background">
      <Frame className="py-10 sm:py-16">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/library">{t("title")}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{tree.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <Reveal>
          <h1 className="mt-6 text-3xl font-extrabold tracking-tight sm:text-4xl">
            {tree.name}
          </h1>
        </Reveal>

        <div className="mt-12 space-y-14">
          {tree.years.map((year, i) => (
            <Reveal key={year.id} delay={0.03 * i}>
              <section>
                <h2 className="figures text-sm font-bold tracking-[0.16em] uppercase">
                  {year.level}
                </h2>
                <hr className="mt-3 border-0 border-t border-rule" />

                <div className="mt-6 grid gap-8 md:grid-cols-2">
                  {year.semesters.map((semester) => (
                    <div key={semester.id}>
                      <h3 className="text-sm font-semibold text-muted-foreground">
                        {semester.label}
                      </h3>

                      {semester.modules.length === 0 ? (
                        <p className="mt-3 text-sm text-muted-foreground">
                          {t("noModules")}
                        </p>
                      ) : (
                        <ul className="mt-3 space-y-2">
                          {semester.modules.map((module) => {
                            const body = (
                              <>
                                <span className="min-w-0 flex-1">
                                  <span className="block text-sm font-medium">
                                    {module.name}
                                  </span>
                                  <span className="figures mt-0.5 block text-xs text-muted-foreground">
                                    {module.entitled
                                      ? t("resourceCount", { count: module.resourceCount })
                                      : t("locked")}
                                  </span>
                                </span>
                                {module.entitled ? (
                                  <FileText
                                    className="h-4 w-4 shrink-0 text-primary"
                                    aria-hidden="true"
                                  />
                                ) : (
                                  <Lock
                                    className="h-4 w-4 shrink-0 text-muted-foreground"
                                    aria-hidden="true"
                                  />
                                )}
                              </>
                            );

                            return (
                              <li key={module.id}>
                                {module.entitled ? (
                                  <Link
                                    href={`/library/${tree.slug}/${module.id}`}
                                    className="flex items-start gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-paper"
                                  >
                                    {body}
                                  </Link>
                                ) : (
                                  <div
                                    className={cn(
                                      "flex items-start gap-3 rounded-lg border border-dashed border-rule p-4",
                                      "text-muted-foreground",
                                    )}
                                  >
                                    {body}
                                  </div>
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            </Reveal>
          ))}
        </div>
      </Frame>
    </Section>
  );
}
