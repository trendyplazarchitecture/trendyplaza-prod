"use client";

import { useState } from "react";
import {
  ArrowRight,
  Calendar,
  Clock,
  ExternalLink,
  Globe,
  MapPin,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Link } from "../../../i18n/navigation";
import type { PostSummary } from "@/server/posts";
import { mediaSrcSet, postCoverImageUrl } from "@/lib/media";
import { cn } from "@/lib/utils";

export function EventsPageClient({
  upcoming,
  past,
}: {
  upcoming: PostSummary[];
  past: PostSummary[];
}) {
  const t = useTranslations("eventsPage");
  const locale = useLocale();
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");

  const displayed = tab === "upcoming" ? upcoming : past;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="border-b border-border bg-paper/50 py-14 sm:py-20">
        <div className="mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-12">
          <div className="max-w-3xl space-y-3">
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              {t("heroTitle")}
            </h1>
            <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
              {t("heroLede")}
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="mt-8 flex items-center gap-6 border-b border-border/80 text-sm">
            <button
              type="button"
              onClick={() => setTab("upcoming")}
              className={cn(
                "relative pb-3 font-semibold transition-colors",
                tab === "upcoming"
                  ? "text-primary font-bold"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <span>{t("tabUpcoming")}</span>
              <span className="ms-2 font-mono text-xs text-muted-foreground">
                ({upcoming.length})
              </span>
              {tab === "upcoming" && (
                <span className="absolute inset-x-0 -bottom-px h-0.5 bg-primary" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setTab("past")}
              className={cn(
                "relative pb-3 font-semibold transition-colors",
                tab === "past"
                  ? "text-primary font-bold"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <span>{t("tabPast")}</span>
              <span className="ms-2 font-mono text-xs text-muted-foreground">
                ({past.length})
              </span>
              {tab === "past" && (
                <span className="absolute inset-x-0 -bottom-px h-0.5 bg-primary" />
              )}
            </button>
          </div>
        </div>
      </section>

      {/* Events Grid */}
      <section className="mx-auto w-full max-w-[1400px] px-4 py-12 sm:px-6 lg:px-12">
        {displayed.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border py-16 text-center">
            <Calendar className="mx-auto h-10 w-10 text-muted-foreground/40" />
            <h2 className="mt-3 text-base font-semibold text-foreground">
              {tab === "upcoming" ? t("emptyUpcomingTitle") : t("emptyPastTitle")}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {tab === "upcoming" ? t("emptyUpcomingLede") : t("emptyPastLede")}
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {displayed.map((event) => {
              const coverUrl = postCoverImageUrl(event.coverImagePath);
              const eventDate = event.startsAt
                ? new Date(event.startsAt).toLocaleDateString(
                    locale === "ar" ? "ar-DZ" : locale === "fr" ? "fr-DZ" : "en-US",
                    {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    },
                  )
                : null;

              const eventTime = event.startsAt
                ? new Date(event.startsAt).toLocaleTimeString(
                    locale === "ar" ? "ar-DZ" : locale === "fr" ? "fr-DZ" : "en-US",
                    { hour: "2-digit", minute: "2-digit" },
                  )
                : null;

              return (
                <article
                  key={event.id}
                  className="group flex flex-col justify-between overflow-hidden rounded-xl border border-border bg-card shadow-xs transition-colors hover:border-foreground/30"
                >
                  <div>
                    {/* Cover image */}
                    <div className="relative aspect-[16/9] w-full overflow-hidden bg-paper">
                      {coverUrl ? (
                        <img
                          src={coverUrl}
                          srcSet={mediaSrcSet(coverUrl, [320, 480, 640])}
                          sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
                          alt={event.title}
                          loading="lazy"
                          decoding="async"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-paper text-muted-foreground/40">
                          <Calendar className="h-10 w-10" />
                        </div>
                      )}

                      <div className="absolute start-3 top-3">
                        <span className="inline-flex items-center gap-1 rounded bg-foreground/90 px-2 py-1 text-[11px] font-semibold text-background">
                          {event.isOnline ? (
                            <>
                              <Globe className="h-3 w-3" /> {t("online")}
                            </>
                          ) : (
                            <>
                              <MapPin className="h-3 w-3" /> {t("inPerson")}
                            </>
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2.5 p-5">
                      {/* Date & Time metadata */}
                      <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-primary">
                        {eventDate && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {eventDate}
                          </span>
                        )}
                        {eventTime && (
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Clock className="h-3.5 w-3.5" />
                            {eventTime}
                          </span>
                        )}
                      </div>

                      <h2 className="line-clamp-2 text-lg font-bold text-foreground">
                        {event.slug ? (
                          <Link href={`/events/${event.slug}`} className="hover:underline">
                            {event.title}
                          </Link>
                        ) : (
                          event.title
                        )}
                      </h2>

                      {!event.isOnline && event.location && (
                        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                          <span className="truncate">{event.location}</span>
                        </p>
                      )}

                      <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                        {event.body}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between border-t border-border px-5 py-3.5">
                    {event.slug ? (
                      <Link
                        href={`/events/${event.slug}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-foreground hover:underline"
                      >
                        {t("readDetails")}
                        <ArrowRight className="h-3.5 w-3.5 rtl:-scale-x-100" />
                      </Link>
                    ) : (
                      <span />
                    )}

                    {event.registrationUrl && (
                      <a
                        href={event.registrationUrl}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary-press"
                      >
                        <span>{t("register")}</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
