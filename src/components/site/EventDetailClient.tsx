"use client";

import { useState, useTransition } from "react";
import {
  ArrowLeft,
  Calendar,
  Check,
  Clock,
  ExternalLink,
  Globe,
  ImageIcon,
  Instagram,
  Link as LinkIcon,
  Loader2,
  MapPin,
  Share2,
  UserCheck,
  Users,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";

import { Link } from "../../../i18n/navigation";
import type { PostSummary } from "@/server/posts";
import { registerForEventAction } from "@/server/actions/posts";
import { postCoverImageUrl } from "@/lib/media";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function EventDetailClient({
  event,
  user,
}: {
  event: PostSummary;
  user?: { name?: string; email?: string } | null;
}) {
  const t = useTranslations("eventsPage");
  const locale = useLocale();
  const coverUrl = postCoverImageUrl(event.coverImagePath);

  const [registerOpen, setRegisterOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [hasRegistered, setHasRegistered] = useState(false);
  const [selectedGalleryPhoto, setSelectedGalleryPhoto] = useState<string | null>(null);

  const eventDate = event.startsAt
    ? new Date(event.startsAt).toLocaleDateString(
        locale === "ar" ? "ar-DZ" : locale === "fr" ? "fr-DZ" : "en-US",
        {
          weekday: "long",
          day: "numeric",
          month: "long",
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

  async function handleShare() {
    if (typeof window === "undefined") return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: event.title,
          text: event.body.slice(0, 140),
          url: window.location.href,
        });
        return;
      } catch {
        // Fallback to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success(t("linkCopied"));
    } catch {
      toast.error("Failed to copy link.");
    }
  }

  function handleRegisterSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const name = (formData.get("name") as string)?.trim();
    const phone = (formData.get("phone") as string)?.trim();
    const email = (formData.get("email") as string)?.trim();
    const university = (formData.get("university") as string)?.trim();
    const notes = (formData.get("notes") as string)?.trim();

    if (!name || !phone || !email) {
      toast.error("Please fill in your name, phone number, and email.");
      return;
    }

    startTransition(async () => {
      try {
        const res = await registerForEventAction({
          postId: event.id,
          name,
          phone,
          email,
          university,
          notes,
        });

        if (res.ok) {
          toast.success(res.message);
          setHasRegistered(true);
          setRegisterOpen(false);
        } else {
          toast.error(res.message);
        }
      } catch {
        toast.error("Registration failed. Please try again.");
      }
    });
  }

  return (
    <div className="min-h-screen bg-background py-10 sm:py-16">
      <div className="mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Navigation & Share */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/events"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 rtl:-scale-x-100" />
            {t("backToEvents")}
          </Link>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={handleShare}
          >
            <Share2 className="h-3.5 w-3.5" />
            <span>{t("share")}</span>
          </Button>
        </div>

        {/* Cover Photo */}
        {coverUrl && (
          <div className="relative mb-8 aspect-video w-full overflow-hidden rounded-xl border border-border bg-paper shadow-xs">
            <img
              src={coverUrl}
              alt={event.title}
              className="h-full w-full object-cover"
            />
          </div>
        )}

        {/* Header Information */}
        <div className="space-y-4 border-b border-border pb-8">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded bg-foreground px-2 py-0.5 text-xs font-bold text-background">
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

            {event.registrationCount !== undefined && event.registrationCount > 0 && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground">
                <Users className="h-3.5 w-3.5" />
                <span>{event.registrationCount} attendee{event.registrationCount === 1 ? "" : "s"}</span>
              </span>
            )}
          </div>

          <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            {event.title}
          </h1>

          {/* Metadata Cards */}
          <div className="grid gap-3 pt-2 sm:grid-cols-2">
            <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-4">
              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-foreground/5 text-foreground">
                <Calendar className="h-4.5 w-4.5" />
              </span>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("dateAndTime")}
                </div>
                <div className="mt-0.5 text-sm font-bold text-foreground">
                  {eventDate || t("tba")}
                </div>
                {eventTime && (
                  <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{eventTime}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-4">
              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-foreground/5 text-foreground">
                <MapPin className="h-4.5 w-4.5" />
              </span>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("venue")}
                </div>
                <div className="mt-0.5 text-sm font-bold text-foreground">
                  {event.isOnline ? t("onlineEvent") : event.location || t("tba")}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Description Body */}
        <div className="prose prose-neutral dark:prose-invert max-w-none py-8 text-base leading-relaxed text-foreground">
          <p className="whitespace-pre-line">{event.body}</p>
        </div>

        {/* Gallery Grid */}
        {event.galleryImages && event.galleryImages.length > 0 && (
          <div className="border-t border-border py-8 space-y-4">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-base font-bold text-foreground">Photo Gallery</h2>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {event.galleryImages.map((imgPath, i) => {
                const url = postCoverImageUrl(imgPath);
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setSelectedGalleryPhoto(url)}
                    className="group relative aspect-[4/3] w-full overflow-hidden rounded-lg border border-border bg-paper transition-transform hover:scale-[1.02]"
                  >
                    {url && (
                      <img
                        src={url}
                        alt={`Gallery photo ${i + 1}`}
                        className="h-full w-full object-cover"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* External & Social Links */}
        {(event.instagramUrl || event.externalUrl || event.registrationUrl) && (
          <div className="flex flex-wrap items-center gap-3 border-t border-border py-6">
            {event.instagramUrl && (
              <a
                href={event.instagramUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground transition-colors hover:border-foreground/40"
              >
                <Instagram className="h-4 w-4 text-primary" />
                <span>View on Instagram</span>
                <ExternalLink className="h-3 w-3 text-muted-foreground" />
              </a>
            )}

            {(event.externalUrl || (event.registrationUrl && !event.allowRegistration)) && (
              <a
                href={event.externalUrl || event.registrationUrl || "#"}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground transition-colors hover:border-foreground/40"
              >
                <LinkIcon className="h-4 w-4 text-primary" />
                <span>Official External Link / Form</span>
                <ExternalLink className="h-3 w-3 text-muted-foreground" />
              </a>
            )}
          </div>
        )}

        {/* Native Registration Section */}
        {event.allowRegistration && (
          <div className="mt-8 rounded-2xl border border-primary/30 bg-primary/5 p-6 sm:p-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1.5">
                <h2 className="text-lg font-bold text-foreground sm:text-xl">
                  {hasRegistered ? "You are registered!" : t("readyToJoin")}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {hasRegistered
                    ? "Your spot is confirmed. Check your student dashboard for countdown and event updates."
                    : t("readyToJoinLede")}
                </p>
              </div>

              {hasRegistered ? (
                <div className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground">
                  <UserCheck className="h-4 w-4" />
                  <span>Confirmed</span>
                </div>
              ) : (
                <Button
                  type="button"
                  size="lg"
                  onClick={() => setRegisterOpen(true)}
                  className="shrink-0 gap-2 font-bold"
                >
                  <Users className="h-4 w-4" />
                  <span>{t("registerNow")}</span>
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Registration Dialog */}
      <Dialog open={registerOpen} onOpenChange={setRegisterOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Register for Event</DialogTitle>
            <DialogDescription>
              {event.title}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleRegisterSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="reg-name">Full Name *</Label>
              <Input
                id="reg-name"
                name="name"
                required
                defaultValue={user?.name ?? ""}
                placeholder="e.g. Amina Benali"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="reg-phone">Phone Number *</Label>
              <Input
                id="reg-phone"
                name="phone"
                type="tel"
                required
                placeholder="0550 00 00 00"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="reg-email">Email Address *</Label>
              <Input
                id="reg-email"
                name="email"
                type="email"
                required
                defaultValue={user?.email ?? ""}
                placeholder="amina@example.com"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="reg-university">University / Faculty (Optional)</Label>
              <Input
                id="reg-university"
                name="university"
                placeholder="e.g. EPAU Alger, Constantine 3..."
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="reg-notes">Notes / Questions (Optional)</Label>
              <Textarea
                id="reg-notes"
                name="notes"
                rows={2}
                placeholder="Any questions or requirements..."
              />
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setRegisterOpen(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending} className="gap-2 font-bold">
                {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>Confirm Registration</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Gallery Photo Lightbox */}
      <Dialog
        open={selectedGalleryPhoto !== null}
        onOpenChange={(open) => !open && setSelectedGalleryPhoto(null)}
      >
        <DialogContent className="max-w-4xl p-1 bg-black/90 border-0">
          {selectedGalleryPhoto && (
            <div className="relative aspect-auto max-h-[85vh] flex items-center justify-center">
              <img
                src={selectedGalleryPhoto}
                alt="Enlarged photo"
                className="max-h-[85vh] max-w-full rounded-md object-contain"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
