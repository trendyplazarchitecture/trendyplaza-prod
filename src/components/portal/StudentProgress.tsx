import { BookOpen, CheckCircle2, PlayCircle } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Link } from "../../../i18n/navigation";
import type { CarryOn, ProgressModule } from "@/server/progress";
import type { Locale } from "@/lib/i18n-content";

/**
 * The reading half of the account screen.
 *
 * Three things, in the order a student cares about them: carry on, what is
 * open, what is done. No charts and no percentages to two decimal places; a
 * student wants the file they had open on the bus, and everything else on this
 * panel is context for that one control.
 *
 * "Most viewed" deliberately does not appear. It is a figure the admin wants,
 * to decide which module to invest in next. To a student it says what they
 * already know.
 */
export async function StudentProgress({
  locale,
  carryOn,
  modules,
}: {
  locale: Locale;
  carryOn: CarryOn | null;
  modules: ProgressModule[];
}) {
  const t = await getTranslations({ locale, namespace: "account.progress" });

  const inProgress = modules.filter((m) => !m.completedAt);
  const finished = modules.filter((m) => m.completedAt);

  // Nothing read yet. The library link is the action, and saying "nothing yet"
  // on its own would be describing emptiness rather than inviting a start.
  if (!carryOn && modules.length === 0) {
    return (
      <section id="progress" className="scroll-mt-24">
        <div className="sheet-ticks rounded-xl border border-rule bg-card p-6">
          <h2 className="font-bold">{t("emptyTitle")}</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">{t("emptyBody")}</p>
          <Link
            href="/library"
            className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-6 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary-press"
          >
            <BookOpen className="h-4 w-4" aria-hidden="true" />
            {t("startReading")}
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section id="progress" className="scroll-mt-24">
      {/* ------------------------------------------------------------------ */}
      {/* Carry on. The highest-value control on the page, so it is first and */}
      {/* it is the only one styled as a primary action.                     */}
      {/* ------------------------------------------------------------------ */}
      {carryOn && (
        <Link
          href={`/library/${carryOn.universitySlug}/${carryOn.moduleId}`}
          className="group sheet-ticks block rounded-xl border border-primary/40 bg-primary/5 p-5 transition-colors hover:border-primary hover:bg-primary/10"
        >
          <span className="ui-dense text-[11px] font-semibold tracking-[0.14em] text-primary uppercase">
            {t("carryOn")}
          </span>
          <p className="mt-2 flex items-start gap-2.5">
            <PlayCircle
              className="mt-0.5 h-5 w-5 shrink-0 text-primary transition-transform group-hover:scale-110"
              aria-hidden="true"
            />
            <span className="min-w-0">
              <span className="block font-semibold">{carryOn.resourceTitle}</span>
              <span className="block truncate text-sm text-muted-foreground">
                {carryOn.moduleName}
              </span>
            </span>
          </p>
        </Link>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Open modules, with a bar rather than a number, because "3 of 7" is  */}
      {/* read faster as a length than as arithmetic.                        */}
      {/* ------------------------------------------------------------------ */}
      {inProgress.length > 0 && (
        <div className="mt-8">
          <h2 className="text-sm font-semibold tracking-tight">
            {t("inProgress")}
          </h2>
          <ul className="mt-4 space-y-2.5">
            {inProgress.map((m) => (
              <li key={m.moduleId}>
                <Link
                  href={`/library/${m.universitySlug}/${m.moduleId}`}
                  className="block rounded-xl border border-rule bg-card p-4 transition-colors hover:border-primary/50"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <span className="font-medium">{m.moduleName}</span>
                    <span className="figures text-xs text-muted-foreground">
                      {t("seenOfTotal", { seen: m.seen, total: m.total })}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {m.universityName} &middot; {m.level}
                  </p>
                  {/*
                    A plain element, not a component: it is one rule of the
                    sheet filled in, and `inline-size` keeps it mirroring under
                    dir="rtl" without a second style.
                  */}
                  <div
                    className="mt-3 h-1 overflow-hidden rounded-full bg-paper"
                    role="progressbar"
                    aria-valuenow={m.seen}
                    aria-valuemin={0}
                    aria-valuemax={m.total}
                    aria-label={m.moduleName}
                  >
                    <div
                      className="h-full rounded-full bg-primary transition-[inline-size] duration-500"
                      style={{
                        inlineSize: `${m.total > 0 ? Math.round((m.seen / m.total) * 100) : 0}%`,
                      }}
                    />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Finished. Quieter than the rest: it is a record, not a task.        */}
      {/* ------------------------------------------------------------------ */}
      {finished.length > 0 && (
        <div className="mt-8">
          <h2 className="text-sm font-semibold tracking-tight">
            {t("finished")}
          </h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {finished.map((m) => (
              <li key={m.moduleId}>
                <Link
                  href={`/library/${m.universitySlug}/${m.moduleId}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-rule bg-card px-3 py-1.5 text-sm transition-colors hover:border-primary/50"
                >
                  <CheckCircle2
                    className="h-3.5 w-3.5 shrink-0 text-primary"
                    aria-hidden="true"
                  />
                  {m.moduleName}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
