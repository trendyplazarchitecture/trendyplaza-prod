import { FileText } from "lucide-react";
import { getFormatter, getTranslations } from "next-intl/server";

import { Link } from "../../../i18n/navigation";
import type { RecentResource } from "@/server/portal";
import type { Locale } from "@/lib/i18n-content";

/** Kilobytes, or megabytes. Nobody wants seven significant figures of bytes. */
function readableSize(bytes: number | null): string | null {
  if (!bytes || bytes <= 0) return null;
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

/**
 * The last few files this student opened.
 *
 * Every row links to the module rather than to the file itself. Opening a
 * resource is what `/api/resource/[id]` does, and it does it inside the viewer
 * with the rest of the module beside it — a bare link to the stream would drop
 * a student into a PDF with no way back and no next.
 */
export async function RecentResources({
  locale,
  resources,
}: {
  locale: Locale;
  resources: RecentResource[];
}) {
  const t = await getTranslations({ locale, namespace: "portal.recent" });
  const format = await getFormatter({ locale });

  if (resources.length === 0) return null;

  return (
    <section
      className="rounded-xl border border-rule bg-card"
      aria-labelledby="recent-heading"
    >
      <div className="flex items-center justify-between gap-3 border-b border-rule px-4 py-3">
        <h2 id="recent-heading" className="text-sm font-semibold tracking-tight">
          {t("title")}
        </h2>
      </div>

      <ul className="divide-y divide-rule">
        {resources.map((resource) => {
          const size = readableSize(resource.sizeBytes);

          return (
            <li key={resource.id}>
              <Link
                href={`/library/${resource.universitySlug}/${resource.moduleId}`}
                className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-paper"
              >
                <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10">
                  <FileText className="h-4 w-4 text-primary" aria-hidden="true" />
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">
                    {resource.title}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {resource.typeLabel}
                    {size && <span className="figures"> · {size}</span>}
                    {" · "}
                    {format.relativeTime(resource.viewedAt)}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
