import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";

import type { Locale } from "@/lib/i18n-content";
import { EventDetailClient } from "@/components/site/EventDetailClient";
import { getPostBySlug } from "@/server/posts";
import { getCurrentUser } from "@/server/session";

type Props = { params: Promise<{ locale: Locale; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const event = await getPostBySlug(slug, locale);
  if (!event || event.kind !== "event") {
    return { title: "Event Not Found" };
  }

  return {
    title: `${event.title} — TP Architecture`,
    description: event.body.slice(0, 160),
    openGraph: {
      title: event.title,
      description: event.body.slice(0, 160),
    },
  };
}

export default async function EventDetailPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const [event, user] = await Promise.all([
    getPostBySlug(slug, locale),
    getCurrentUser(),
  ]);

  if (!event || event.kind !== "event") {
    notFound();
  }

  return (
    <EventDetailClient
      event={event}
      user={user ? { name: user.name, email: user.email } : null}
    />
  );
}
