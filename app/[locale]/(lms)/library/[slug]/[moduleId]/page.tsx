import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Lock } from "lucide-react";

import { Link, redirect } from "../../../../../../i18n/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Frame, Reveal, Section } from "@/components/site/Sheet";
import { ResourceList } from "@/components/lms/ResourceViewer";
import { getCurrentUser } from "@/server/session";
import { canReadModule } from "@/server/entitlements";
import { getModuleWithResources } from "@/server/content";
import type { Locale } from "@/lib/i18n-content";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ locale: Locale; slug: string; moduleId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, moduleId } = await params;
  const module = await getModuleWithResources(moduleId, locale);
  return {
    title: module?.name ?? "",
    robots: { index: false, follow: false },
  };
}

/**
 * One module: its resources, grouped by type, because that is how a student
 * looks for a thing. The TD, not the fourteenth item in a flat list.
 *
 * The entitlement is re-checked here even though the tree already filtered the
 * links. A URL typed by hand, a bookmark kept after a pack expired, and a link
 * forwarded to a friend all arrive at this line.
 */
export default async function ModulePage({ params }: Props) {
  const { locale, slug, moduleId } = await params;
  setRequestLocale(locale);

  const user = await getCurrentUser();
  if (!user) {
    redirect({ href: "/login", locale });
    return null;
  }

  if (!/^[0-9a-f-]{36}$/i.test(moduleId)) notFound();

  const [module, t] = await Promise.all([
    getModuleWithResources(moduleId, locale),
    getTranslations({ locale, namespace: "library" }),
  ]);

  // A module reached through the wrong university's path is not this page.
  if (!module || module.universitySlug !== slug) notFound();

  const entitled = await canReadModule(user.id, moduleId);

  const crumbs = (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/library">{t("title")}</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href={`/library/${slug}`}>{module.universityName}</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>{module.name}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );

  if (!entitled) {
    return (
      <Section grid="fine" className="bg-background">
        <Frame width="text" className="py-14 sm:py-20">
          {crumbs}

          <div className="sheet-ticks mt-8 rounded-xl border border-rule bg-card p-8 text-center">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-paper">
              <Lock className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
            </span>
            <h1 className="mt-5 text-xl font-bold">{module.name}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{t("lockedBody")}</p>

            <Link
              href="/account"
              className="mt-6 inline-flex h-12 items-center justify-center rounded-lg bg-primary px-6 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary-press"
            >
              {t("lockedAction")}
            </Link>
          </div>
        </Frame>
      </Section>
    );
  }

  return (
    <Section grid="fine" className="bg-background">
      <Frame className="py-10 sm:py-16">
        {crumbs}

        <Reveal>
          <p className="figures mt-6 text-xs font-bold tracking-[0.16em] text-muted-foreground uppercase">
            {module.level} · {module.semester}
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
            {module.name}
          </h1>
          {module.description && (
            <p className="mt-3 max-w-2xl text-muted-foreground">{module.description}</p>
          )}
        </Reveal>

        <div className="mt-12 max-w-3xl">
          {module.groups.length === 0 ? (
            <p className="rounded-lg border border-dashed border-rule p-8 text-center text-sm text-muted-foreground">
              {t("noResources")}
            </p>
          ) : (
            <ResourceList groups={module.groups} />
          )}
        </div>
      </Frame>
    </Section>
  );
}
