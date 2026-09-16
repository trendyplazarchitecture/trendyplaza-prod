"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Calendar,
  Clock,
  Globe,
  MapPin,
  Megaphone,
  Newspaper,
  UserCheck,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Link } from "../../../i18n/navigation";
import type { PostSummary, RegisteredEventItem } from "@/server/posts";
import {
  cancelEventRegistrationAction,
  dismissAnnouncementAction,
} from "@/server/actions/posts";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { postCoverImageUrl } from "@/lib/media";

/** A cover thumbnail, flush against the card's own edge and stretched to its
 *  full height — a strip down the side, not a small icon-sized square. The
 *  card that uses this gives up its own start-side padding so the image can
 *  reach the corner; see the callers. Absent entirely — no placeholder box —
 *  when a post has no cover, so a plain announcement never shows a grey
 *  rectangle standing in for nothing. */
function CardThumb({
  path,
  alt,
  width = "w-24 sm:w-28",
  roundedClass = "rounded-s-lg",
}: {
  path: string | null;
  alt: string;
  width?: string;
  roundedClass?: string;
}) {
  const src = postCoverImageUrl(path);
  if (!src) return null;
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className={cn(width, roundedClass, "shrink-0 self-stretch object-cover")}
    />
  );
}

export function StudentNotices({
  announcement,
  latestNews,
  latestEvent,
  myRegisteredEvents = [],
}: {
  announcement: PostSummary | null;
  latestNews: PostSummary | null;
  latestEvent: PostSummary | null;
  myRegisteredEvents?: RegisteredEventItem[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function dismiss(postId: string) {
    startTransition(async () => {
      try {
        const res = await dismissAnnouncementAction({ postId });
        if (res.ok) {
          router.refresh();
        }
      } catch {
        toast.error("Failed to dismiss.");
      }
    });
  }

  function handleCancelRsvp(registrationId: string) {
    startTransition(async () => {
      try {
        const res = await cancelEventRegistrationAction({ registrationId });
        if (res.ok) {
          toast.success(res.message);
          router.refresh();
        } else {
          toast.error(res.message);
        }
      } catch {
        toast.error("Failed to cancel registration.");
      }
    });
  }

  return (
    <div className="space-y-5">
      {/* 1. Primary In-App Announcement Banner */}
      {announcement && (
        <div className="relative flex items-start justify-between gap-4 rounded-xl border border-primary/30 bg-primary/5 p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Megaphone className="h-4.5 w-4.5" aria-hidden="true" />
            </span>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold tracking-wider text-primary uppercase">
                  Announcement
                </span>
              </div>
              <h3 className="text-base font-bold text-foreground">
                {announcement.title}
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {announcement.body}
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={isPending}
            className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
            aria-label="Dismiss announcement"
            onClick={() => dismiss(announcement.id)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* 2. My Registered Events with Live Countdown */}
      {myRegisteredEvents.length > 0 && (
        <div className="space-y-3 rounded-xl border border-border bg-card p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-bold text-foreground">
                My Registered Events & Workshops ({myRegisteredEvents.length})
              </h3>
            </div>
            <Link
              href="/events"
              className="text-xs font-semibold text-primary hover:underline"
            >
              Browse all events
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {myRegisteredEvents.map((ev) => {
              const eventDate = ev.startsAt
                ? new Date(ev.startsAt).toLocaleDateString(undefined, {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                  })
                : "—";

              return (
                <div
                  key={ev.registrationId}
                  className="group flex overflow-hidden rounded-lg border border-border/80 bg-muted/20 transition-colors hover:border-foreground/20 hover:bg-muted/30"
                >
                  <CardThumb path={ev.coverImagePath} alt="" roundedClass="" />

                  <div className="ms-3 flex min-w-0 flex-1 flex-col justify-between gap-2 py-3 pe-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        {/* Countdown badge */}
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-bold",
                            ev.timeStatus === "ongoing"
                              ? "animate-pulse bg-primary text-primary-foreground"
                              : ev.timeStatus === "upcoming"
                                ? "bg-foreground/10 text-foreground"
                                : "bg-muted text-muted-foreground",
                          )}
                        >
                          <Clock className="h-3 w-3" />
                          <span>
                            {ev.timeStatus === "ongoing"
                              ? "Happening today!"
                              : ev.timeStatus === "passed"
                                ? "Completed"
                                : ev.daysLeft === 0
                                  ? "Starts tomorrow!"
                                  : ev.daysLeft === 1
                                    ? "In 1 day"
                                    : `In ${ev.daysLeft} days`}
                          </span>
                        </span>

                        <span className="shrink-0 text-[11px] font-semibold text-muted-foreground">
                          {eventDate}
                        </span>
                      </div>

                      <h4 className="line-clamp-1 text-sm font-bold text-foreground">
                        {ev.slug ? (
                          <Link
                            href={`/events/${ev.slug}`}
                            className="transition-colors group-hover:text-primary"
                          >
                            {ev.title}
                          </Link>
                        ) : (
                          ev.title
                        )}
                      </h4>

                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        {ev.isOnline ? (
                          <span className="flex items-center gap-1">
                            <Globe className="h-3 w-3" /> Online
                          </span>
                        ) : (
                          <span className="flex min-w-0 items-center gap-1 truncate">
                            <MapPin className="h-3 w-3 shrink-0" /> {ev.location || "Venue TBA"}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 border-t border-border/60 pt-2 text-xs">
                      {ev.slug ? (
                        <Link
                          href={`/events/${ev.slug}`}
                          className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
                        >
                          Event details
                          <ArrowRight className="h-3 w-3 rtl:-scale-x-100" />
                        </Link>
                      ) : (
                        <span />
                      )}

                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => handleCancelRsvp(ev.registrationId)}
                        className="text-[11px] text-muted-foreground transition-colors hover:text-destructive"
                      >
                        Cancel RSVP
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Latest News & Upcoming Event Notice Strip */}
      {(latestNews || latestEvent) && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {latestNews && (
            <div className="group flex overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-md">
              <CardThumb path={latestNews.coverImagePath} alt="" roundedClass="" />

              <div className="ms-3 flex min-w-0 flex-1 flex-col justify-between py-4 pe-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                    <Newspaper className="h-3.5 w-3.5" />
                    <span>Latest Platform News</span>
                  </div>
                  <h4 className="line-clamp-1 text-sm font-bold text-foreground">
                    {latestNews.title}
                  </h4>
                  <p className="line-clamp-2 text-xs text-muted-foreground">
                    {latestNews.body}
                  </p>
                </div>

                {latestNews.slug && (
                  <div className="pt-2">
                    <Link
                      href={`/news/${latestNews.slug}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                    >
                      Read article
                      <ArrowRight className="h-3 w-3 rtl:-scale-x-100" />
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}

          {latestEvent && (
            <div className="group flex overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-md">
              <CardThumb path={latestEvent.coverImagePath} alt="" roundedClass="" />

              <div className="ms-3 flex min-w-0 flex-1 flex-col justify-between py-4 pe-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>Upcoming Architecture Event</span>
                    {latestEvent.startsAt && (
                      <span className="text-muted-foreground">
                        • {new Date(latestEvent.startsAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <h4 className="line-clamp-1 text-sm font-bold text-foreground">
                    {latestEvent.title}
                  </h4>
                  <p className="line-clamp-2 text-xs text-muted-foreground">
                    {latestEvent.body}
                  </p>
                </div>

                <div className="pt-2">
                  {latestEvent.slug ? (
                    <Link
                      href={`/events/${latestEvent.slug}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                    >
                      View & Register
                      <ArrowRight className="h-3 w-3 rtl:-scale-x-100" />
                    </Link>
                  ) : (
                    latestEvent.registrationUrl && (
                      <a
                        href={latestEvent.registrationUrl}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                      >
                        Register
                        <ArrowRight className="h-3 w-3 rtl:-scale-x-100" />
                      </a>
                    )
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
