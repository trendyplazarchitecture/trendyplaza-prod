import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";

import type { Locale } from "@/lib/i18n-content";
import { NewsDetailClient } from "@/components/site/NewsDetailClient";
import { getPostBySlug } from "@/server/posts";

type Props = { params: Promise<{ locale: Locale; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const post = await getPostBySlug(slug, locale);
  if (!post || post.kind !== "news") {
    return { title: "News Not Found" };
  }

  return {
    title: `${post.title} — TP Architecture`,
    description: post.body.slice(0, 160),
    openGraph: {
      title: post.title,
      description: post.body.slice(0, 160),
    },
  };
}

export default async function NewsDetailPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const post = await getPostBySlug(slug, locale);
  if (!post || post.kind !== "news") {
    notFound();
  }

  return <NewsDetailClient post={post} />;
}
