import { BookOpen, CheckCircle2, FileText, GraduationCap } from "lucide-react";
import { getTranslations } from "next-intl/server";

import type { DashboardFigures } from "@/server/portal";
import type { Locale } from "@/lib/i18n-content";

/**
 * Four figures.
 *
 * One card per figure, all four the same size, the same padding and the same
 * three lines: a tinted icon, the number, what the number is. An earlier
 * version packed a chip, a tracked-out uppercase label, a value and a hint
 * into each cell and hairlined them together with negative margins — four
 * different type treatments in a strip 90 pixels tall, which is what "busy"
 * looks like at this size.
 *
 * Every figure is counted from a row that exists. There is no study timer in
 * this product and no graded work, so there is no "hours studied" and no
 * "average score": a dashboard that reports a number nobody measured is worse
 * than one that reports four honest ones.
 */
export async function Figures({
  locale,
  figures,
}: {
  locale: Locale;
  figures: DashboardFigures;
}) {
  const t = await getTranslations({ locale, namespace: "portal.figures" });

  const items = [
    { key: "open", Icon: BookOpen, value: String(figures.open) },
    { key: "finished", Icon: CheckCircle2, value: String(figures.finished) },
    {
      key: "read",
      Icon: FileText,
      // The denominator is the point: "18" alone says nothing about how much is
      // left, and how much is left is what a student is deciding about.
      value: `${figures.resourcesRead}/${figures.resourcesAvailable}`,
    },
    { key: "schools", Icon: GraduationCap, value: String(figures.schools) },
  ];

  return (
    <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {items.map(({ key, Icon, value }) => (
        <div key={key} className="rounded-xl border border-rule bg-card p-4">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <Icon className="h-4.5 w-4.5 text-primary" aria-hidden="true" />
          </span>
          <dd className="figures mt-3 text-2xl leading-none font-bold">{value}</dd>
          <dt className="mt-1.5 text-sm text-muted-foreground">{t(key)}</dt>
        </div>
      ))}
    </dl>
  );
}
