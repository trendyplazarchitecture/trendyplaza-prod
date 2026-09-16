"use client";

import { ArrowRight, Calendar, Newspaper } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Link } from "../../../i18n/navigation";
import type { PostSummary } from "@/server/posts";
import type { Paged } from "@/server/_list";
import { mediaSrcSet, postCoverImageUrl } from "@/lib/media";

export function NewsPageClient({ news }: { news: Paged<PostSummary> }) {
  const t = useTranslations("newsPage");
  const locale = useLocale();

  const featured = news.rows[0];
  const rest = news.rows.slice(1);

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
        </div>
      </section>

      {/* News Feed */}
      <section className="mx-auto w-full max-w-[1400px] px-4 py-12 sm:px-6 lg:px-12">
        {news.rows.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border py-16 text-center">
            <Newspaper className="mx-auto h-10 w-10 text-muted-foreground/40" />
            <h2 className="mt-3 text-base font-semibold text-foreground">
              {t("emptyTitle")}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">{t("emptyLede")}</p>
          </div>
        ) : (
          <div className="space-y-12">
            {/* Featured Article */}
            {featured && (
              <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs transition-colors hover:border-foreground/30">
                <div className="grid gap-6 lg:grid-cols-12 lg:items-center">
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-paper lg:col-span-7">
                    {featured.coverImagePath ? (
                      <img
                        src={postCoverImageUrl(featured.coverImagePath) ?? ""}
                        srcSet={mediaSrcSet(postCoverImageUrl(featured.coverImagePath), [480, 640, 960])}
                        sizes="(min-width: 1024px) 56vw, 100vw"
                        alt={featured.title}
                        fetchPriority="high"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-paper text-muted-foreground/40">
                        <Newspaper className="h-12 w-12" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-3.5 p-6 sm:p-8 lg:col-span-5 lg:p-8">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>
                        {new Date(featured.createdAt).toLocaleDateString(
                          locale === "ar" ? "ar-DZ" : locale === "fr" ? "fr-DZ" : "en-US",
                          { day: "numeric", month: "long", year: "numeric" },
                        )}
                      </span>
                    </div>

                    <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                      {featured.slug ? (
                        <Link
                          href={`/news/${featured.slug}`}
                          className="hover:underline"
                        >
                          {featured.title}
                        </Link>
                      ) : (
                        featured.title
                      )}
                    </h2>

                    <p className="line-clamp-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
                      {featured.body}
                    </p>

                    {featured.slug && (
                      <div className="pt-2">
                        <Link
                          href={`/news/${featured.slug}`}
                          className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground hover:underline"
                        >
                          {t("readFullArticle")}
                          <ArrowRight className="h-4 w-4 rtl:-scale-x-100" />
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Rest of News Items */}
            {rest.length > 0 && (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {rest.map((item) => {
                  const coverUrl = postCoverImageUrl(item.coverImagePath);
                  const dateStr = new Date(item.createdAt).toLocaleDateString(
                    locale === "ar" ? "ar-DZ" : locale === "fr" ? "fr-DZ" : "en-US",
                    { day: "numeric", month: "short", year: "numeric" },
                  );

                  return (
                    <article
                      key={item.id}
                      className="group flex flex-col justify-between overflow-hidden rounded-xl border border-border bg-card shadow-xs transition-colors hover:border-foreground/30"
                    >
                      <div>
                        <div className="relative aspect-[16/10] w-full overflow-hidden bg-paper">
                          {coverUrl ? (
                            <img
                              src={coverUrl}
                              srcSet={mediaSrcSet(coverUrl, [320, 480, 640])}
                              sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
                              alt={item.title}
                              loading="lazy"
                              decoding="async"
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-paper text-muted-foreground/40">
                              <Newspaper className="h-10 w-10" />
                            </div>
                          )}
                        </div>

                        <div className="space-y-2 p-5">
                          <div className="flex items-center gap-1 text-xs font-semibold text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>{dateStr}</span>
                          </div>

                          <h2 className="line-clamp-2 text-base font-bold text-foreground">
                            {item.slug ? (
                              <Link href={`/news/${item.slug}`} className="hover:underline">
                                {item.title}
                              </Link>
                            ) : (
                              item.title
                            )}
                          </h2>

                          <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                            {item.body}
                          </p>
                        </div>
                      </div>

                      <div className="border-t border-border px-5 py-3.5">
                        {item.slug && (
                          <Link
                            href={`/news/${item.slug}`}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-foreground hover:underline"
                          >
                            {t("readArticle")}
                            <ArrowRight className="h-3.5 w-3.5 rtl:-scale-x-100" />
                          </Link>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
