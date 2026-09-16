"use client";

import { useState } from "react";
import {
  ArrowLeft,
  Calendar,
  ExternalLink,
  ImageIcon,
  Instagram,
  Link as LinkIcon,
  Share2,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";

import { Link } from "../../../i18n/navigation";
import type { PostSummary } from "@/server/posts";
import { postCoverImageUrl } from "@/lib/media";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";

export function NewsDetailClient({ post }: { post: PostSummary }) {
  const t = useTranslations("newsPage");
  const locale = useLocale();
  const coverUrl = postCoverImageUrl(post.coverImagePath);
  const [selectedGalleryPhoto, setSelectedGalleryPhoto] = useState<string | null>(null);

  const dateStr = new Date(post.createdAt).toLocaleDateString(
    locale === "ar" ? "ar-DZ" : locale === "fr" ? "fr-DZ" : "en-US",
    {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    },
  );

  async function handleShare() {
    if (typeof window === "undefined") return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title,
          text: post.body.slice(0, 140),
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

  return (
    <div className="min-h-screen bg-background py-10 sm:py-16">
      <div className="mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Navigation Bar */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/news"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 rtl:-scale-x-100" />
            {t("backToNews")}
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

        {/* Header Title */}
        <header className="space-y-4 border-b border-border pb-8">
          <div className="flex items-center gap-2 text-xs font-semibold text-primary">
            <Calendar className="h-4 w-4" />
            <span>{dateStr}</span>
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            {post.title}
          </h1>
        </header>

        {/* Cover Image */}
        {coverUrl && (
          <div className="relative my-8 aspect-[16/9] w-full overflow-hidden rounded-xl border border-border bg-paper shadow-xs">
            <img
              src={coverUrl}
              alt={post.title}
              className="h-full w-full object-cover"
            />
          </div>
        )}

        {/* Article Body */}
        <article className="prose prose-neutral dark:prose-invert max-w-none py-6">
          <p className="text-base leading-relaxed whitespace-pre-line text-foreground/90 sm:text-lg">
            {post.body}
          </p>
        </article>

        {/* Photo Gallery */}
        {post.galleryImages && post.galleryImages.length > 0 && (
          <div className="border-t border-border py-8 space-y-4">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-base font-bold text-foreground">Photo Gallery</h2>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {post.galleryImages.map((imgPath, i) => {
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
        {(post.instagramUrl || post.externalUrl) && (
          <div className="flex flex-wrap items-center gap-3 border-t border-border py-6">
            {post.instagramUrl && (
              <a
                href={post.instagramUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground transition-colors hover:border-foreground/40"
              >
                <Instagram className="h-4 w-4 text-primary" />
                <span>View on Instagram</span>
                <ExternalLink className="h-3 w-3 text-muted-foreground" />
              </a>
            )}

            {post.externalUrl && (
              <a
                href={post.externalUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground transition-colors hover:border-foreground/40"
              >
                <LinkIcon className="h-4 w-4 text-primary" />
                <span>Official External Link / Resource</span>
                <ExternalLink className="h-3 w-3 text-muted-foreground" />
              </a>
            )}
          </div>
        )}
      </div>

      {/* Gallery Lightbox */}
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
