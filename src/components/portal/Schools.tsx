import { GraduationCap, Lock } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Link } from "../../../i18n/navigation";
import type { Locale } from "@/lib/i18n-content";

export type PortalUniversity = {
  id: string;
  slug: string;
  name: string;
  moduleCount: number;
  open: boolean;
};

/**
 * The schools, open ones first, the closed ones visibly present.
 *
 * Hiding a university the student cannot open would make the platform look
 * like it holds one school's notes. Showing it, marked, is the same argument
 * as listing locked modules inside a tree: what a pack does not cover is worth
 * knowing, and it is the thing they would buy next.
 */
export async function Schools({
  locale,
  universities,
}: {
  locale: Locale;
  universities: PortalUniversity[];
}) {
  const t = await getTranslations({ locale, namespace: "portal" });

  if (universities.length === 0) return null;

  return (
    <section id="schools" className="scroll-mt-24" aria-labelledby="schools-heading">
      <h2
        id="schools-heading"
        className="text-sm font-semibold tracking-tight"
      >
        {t("universities")}
      </h2>

      <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
        {universities.map((uni) => (
          <li key={uni.id}>
            {uni.open ? (
              <Link
                href={`/library/${uni.slug}`}
                className="flex items-center gap-3 rounded-xl border border-rule bg-card p-4 transition-colors hover:border-primary/50"
              >
                <GraduationCap
                  className="h-4 w-4 shrink-0 text-primary"
                  aria-hidden="true"
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{uni.name}</span>
                  <span className="figures block text-xs text-muted-foreground">
                    {t("moduleCount", { count: uni.moduleCount })}
                  </span>
                </span>
              </Link>
            ) : (
              <div className="flex items-center gap-3 rounded-xl border border-dashed border-border bg-card/50 p-4">
                <Lock
                  className="h-4 w-4 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-muted-foreground">
                    {uni.name}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {t("notInYourPack")}
                  </span>
                </span>
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
