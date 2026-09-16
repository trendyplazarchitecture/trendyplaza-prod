import "server-only";

import { cache } from "react";
import {
  and,
  asc,
  count,
  desc,
  eq,
  gt,
  inArray,
  isNotNull,
  isNull,
  lte,
  notExists,
  or,
  type SQL,
} from "drizzle-orm";
import { db } from "@/db";
import { eventRegistrations, postViews, posts } from "@/db/schema";
import type { Locale } from "@/lib/i18n-content";
import { pickField } from "@/lib/i18n-content";
import { paged, resolveList, type ListQuery, type Paged } from "./_list";

export type PostKind = "announcement" | "event" | "news";

export type PostSummary = {
  id: string;
  kind: PostKind;
  slug: string | null;
  title: string;
  body: string;
  coverImagePath: string | null;
  galleryImages: string[];
  instagramUrl: string | null;
  externalUrl: string | null;
  registrationUrl: string | null;
  allowRegistration: boolean;
  maxAttendees: number | null;
  startsAt: Date | null;
  endsAt: Date | null;
  location: string | null;
  isOnline: boolean;
  createdAt: Date;
  registrationCount?: number;
};

export type RegisteredEventItem = {
  registrationId: string;
  postId: string;
  slug: string | null;
  title: string;
  coverImagePath: string | null;
  startsAt: Date | null;
  endsAt: Date | null;
  location: string | null;
  isOnline: boolean;
  registrationStatus: string;
  registeredAt: Date;
  timeStatus: "upcoming" | "ongoing" | "passed";
  daysLeft: number | null;
};

export type EventAttendee = {
  id: string;
  postId: string;
  userId: string | null;
  name: string;
  phone: string;
  email: string;
  university: string | null;
  notes: string | null;
  status: string;
  createdAt: Date;
};

/**
 * List active posts of a given kind, localized for display.
 */
export const listActivePosts = cache(
  async (locale: Locale, kind?: PostKind): Promise<PostSummary[]> => {
    const conditions: SQL[] = [eq(posts.isActive, true), isNull(posts.archivedAt)];
    if (kind) {
      conditions.push(eq(posts.kind, kind));
    }

    const rows = await db
      .select()
      .from(posts)
      .where(and(...conditions))
      .orderBy(asc(posts.position), desc(posts.createdAt));

    return rows.map((r) => ({
      id: r.id,
      kind: r.kind as PostKind,
      slug: r.slug,
      title: pickField(locale, r, "title"),
      body: pickField(locale, r, "body"),
      coverImagePath: r.coverImagePath,
      galleryImages: r.galleryImages ?? [],
      instagramUrl: r.instagramUrl,
      externalUrl: r.externalUrl,
      registrationUrl: r.registrationUrl,
      allowRegistration: r.allowRegistration,
      maxAttendees: r.maxAttendees,
      startsAt: r.startsAt,
      endsAt: r.endsAt,
      location: pickField(locale, r, "location"),
      isOnline: r.isOnline,
      createdAt: r.createdAt,
    }));
  },
);

/**
 * Upcoming events: startsAt in future or currently ongoing (or startsAt is null).
 */
export const listUpcomingEvents = cache(
  async (locale: Locale, limitCount: number = 50): Promise<PostSummary[]> => {
    const now = new Date();
    const rows = await db
      .select()
      .from(posts)
      .where(
        and(
          eq(posts.kind, "event"),
          eq(posts.isActive, true),
          isNull(posts.archivedAt),
          or(isNull(posts.startsAt), gt(posts.startsAt, now), gt(posts.endsAt, now)),
        ),
      )
      .orderBy(asc(posts.startsAt), desc(posts.createdAt))
      .limit(limitCount);

    return rows.map((r) => ({
      id: r.id,
      kind: "event",
      slug: r.slug,
      title: pickField(locale, r, "title"),
      body: pickField(locale, r, "body"),
      coverImagePath: r.coverImagePath,
      galleryImages: r.galleryImages ?? [],
      instagramUrl: r.instagramUrl,
      externalUrl: r.externalUrl,
      registrationUrl: r.registrationUrl,
      allowRegistration: r.allowRegistration,
      maxAttendees: r.maxAttendees,
      startsAt: r.startsAt,
      endsAt: r.endsAt,
      location: pickField(locale, r, "location"),
      isOnline: r.isOnline,
      createdAt: r.createdAt,
    }));
  },
);

/**
 * Past events: events whose endsAt or startsAt has already passed.
 */
export const listPastEvents = cache(
  async (locale: Locale, limitCount: number = 50): Promise<PostSummary[]> => {
    const now = new Date();
    const rows = await db
      .select()
      .from(posts)
      .where(
        and(
          eq(posts.kind, "event"),
          eq(posts.isActive, true),
          isNull(posts.archivedAt),
          isNotNull(posts.startsAt),
          lte(posts.startsAt, now),
          or(isNull(posts.endsAt), lte(posts.endsAt, now)),
        ),
      )
      .orderBy(desc(posts.startsAt), desc(posts.createdAt))
      .limit(limitCount);

    return rows.map((r) => ({
      id: r.id,
      kind: "event",
      slug: r.slug,
      title: pickField(locale, r, "title"),
      body: pickField(locale, r, "body"),
      coverImagePath: r.coverImagePath,
      galleryImages: r.galleryImages ?? [],
      instagramUrl: r.instagramUrl,
      externalUrl: r.externalUrl,
      registrationUrl: r.registrationUrl,
      allowRegistration: r.allowRegistration,
      maxAttendees: r.maxAttendees,
      startsAt: r.startsAt,
      endsAt: r.endsAt,
      location: pickField(locale, r, "location"),
      isOnline: r.isOnline,
      createdAt: r.createdAt,
    }));
  },
);

/**
 * Paged news feed.
 */
export async function listNews(
  locale: Locale,
  query: ListQuery = {},
): Promise<Paged<PostSummary>> {
  const sortable = {
    createdAt: posts.createdAt,
    position: posts.position,
  };
  const resolved = resolveList(query, sortable, { sort: "createdAt", direction: "desc" });

  const conditions = [
    eq(posts.kind, "news"),
    eq(posts.isActive, true),
    isNull(posts.archivedAt),
  ];

  const [{ value: total }] = await db
    .select({ value: count() })
    .from(posts)
    .where(and(...conditions));

  const rows = await db
    .select()
    .from(posts)
    .where(and(...conditions))
    .orderBy(resolved.orderBy)
    .limit(resolved.limit)
    .offset(resolved.offset);

  const mapped: PostSummary[] = rows.map((r) => ({
    id: r.id,
    kind: "news",
    slug: r.slug,
    title: pickField(locale, r, "title"),
    body: pickField(locale, r, "body"),
    coverImagePath: r.coverImagePath,
    galleryImages: r.galleryImages ?? [],
    instagramUrl: r.instagramUrl,
    externalUrl: r.externalUrl,
    registrationUrl: r.registrationUrl,
    allowRegistration: r.allowRegistration,
    maxAttendees: r.maxAttendees,
    startsAt: r.startsAt,
    endsAt: r.endsAt,
    location: pickField(locale, r, "location"),
    isOnline: r.isOnline,
    createdAt: r.createdAt,
  }));

  return paged(mapped, total, resolved);
}

/**
 * Get single post by slug for public detail views.
 */
export const getPostBySlug = cache(
  async (slug: string, locale: Locale): Promise<PostSummary | null> => {
    const [row] = await db
      .select()
      .from(posts)
      .where(and(eq(posts.slug, slug), eq(posts.isActive, true), isNull(posts.archivedAt)))
      .limit(1);

    if (!row) return null;

    let regCount = 0;
    if (row.kind === "event") {
      const [{ c }] = await db
        .select({ c: count() })
        .from(eventRegistrations)
        .where(eq(eventRegistrations.postId, row.id));
      regCount = c;
    }

    return {
      id: row.id,
      kind: row.kind as PostKind,
      slug: row.slug,
      title: pickField(locale, row, "title"),
      body: pickField(locale, row, "body"),
      coverImagePath: row.coverImagePath,
      galleryImages: row.galleryImages ?? [],
      instagramUrl: row.instagramUrl,
      externalUrl: row.externalUrl,
      registrationUrl: row.registrationUrl,
      allowRegistration: row.allowRegistration,
      maxAttendees: row.maxAttendees,
      startsAt: row.startsAt,
      endsAt: row.endsAt,
      location: pickField(locale, row, "location"),
      isOnline: row.isOnline,
      createdAt: row.createdAt,
      registrationCount: regCount,
    };
  },
);

/**
 * Get raw post by ID for editing.
 */
export async function getPostById(id: string) {
  const [row] = await db.select().from(posts).where(eq(posts.id, id)).limit(1);
  return row ?? null;
}

/**
 * Admin view of all posts with registration counts.
 */
export async function listAdminPosts(filter?: { kind?: PostKind | "all" }) {
  const conditions: SQL[] = [];
  if (filter?.kind && filter.kind !== "all") {
    conditions.push(eq(posts.kind, filter.kind));
  }

  const query = db.select().from(posts);
  const rows = conditions.length > 0
    ? await query.where(and(...conditions)).orderBy(asc(posts.position), desc(posts.createdAt))
    : await query.orderBy(asc(posts.position), desc(posts.createdAt));

  // Fetch registration counts for events
  const eventIds = rows.filter((r) => r.kind === "event").map((r) => r.id);
  const countsMap = new Map<string, number>();

  if (eventIds.length > 0) {
    const counts = await db
      .select({
        postId: eventRegistrations.postId,
        regCount: count(),
      })
      .from(eventRegistrations)
      .where(inArray(eventRegistrations.postId, eventIds))
      .groupBy(eventRegistrations.postId);

    for (const c of counts) {
      countsMap.set(c.postId, c.regCount);
    }
  }

  return rows.map((r) => ({
    ...r,
    galleryImages: r.galleryImages ?? [],
    registrationCount: countsMap.get(r.id) ?? 0,
  }));
}

/**
 * List registered attendees for an event (Admin).
 */
export async function listEventRegistrations(postId: string): Promise<EventAttendee[]> {
  const rows = await db
    .select()
    .from(eventRegistrations)
    .where(eq(eventRegistrations.postId, postId))
    .orderBy(desc(eventRegistrations.createdAt));

  return rows;
}

/**
 * List events the current student has registered for with time status.
 */
export async function listMyRegisteredEvents(
  userId: string,
  locale: Locale,
): Promise<RegisteredEventItem[]> {
  const registrations = await db
    .select({
      registrationId: eventRegistrations.id,
      registeredAt: eventRegistrations.createdAt,
      status: eventRegistrations.status,
      post: posts,
    })
    .from(eventRegistrations)
    .innerJoin(posts, eq(eventRegistrations.postId, posts.id))
    .where(and(eq(eventRegistrations.userId, userId), isNull(posts.archivedAt)))
    .orderBy(desc(posts.startsAt));

  const now = new Date();

  return registrations.map((r) => {
    let timeStatus: "upcoming" | "ongoing" | "passed" = "upcoming";
    let daysLeft: number | null = null;

    if (r.post.startsAt) {
      const diffMs = r.post.startsAt.getTime() - now.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      if (r.post.endsAt && now >= r.post.startsAt && now <= r.post.endsAt) {
        timeStatus = "ongoing";
        daysLeft = 0;
      } else if (now > (r.post.endsAt ?? r.post.startsAt)) {
        timeStatus = "passed";
        daysLeft = null;
      } else {
        timeStatus = "upcoming";
        daysLeft = Math.max(0, diffDays);
      }
    }

    return {
      registrationId: r.registrationId,
      postId: r.post.id,
      slug: r.post.slug,
      title: pickField(locale, r.post, "title"),
      coverImagePath: r.post.coverImagePath,
      startsAt: r.post.startsAt,
      endsAt: r.post.endsAt,
      location: pickField(locale, r.post, "location"),
      isOnline: r.post.isOnline,
      registrationStatus: r.status,
      registeredAt: r.registeredAt,
      timeStatus,
      daysLeft,
    };
  });
}

/**
 * Fetches the active in-app announcement banner for a signed-in student.
 */
export const getActiveAnnouncementForUser = cache(
  async (
    userId: string | null,
    locale: Locale,
    audienceType: "all" | "students" | "on_hold" = "all",
  ): Promise<PostSummary | null> => {
    const now = new Date();
    const audienceFilter =
      audienceType === "students"
        ? or(eq(posts.audience, "all"), eq(posts.audience, "students"))!
        : audienceType === "on_hold"
          ? or(eq(posts.audience, "all"), eq(posts.audience, "on_hold"))!
          : eq(posts.audience, "all");

    const conditions: SQL[] = [
      eq(posts.kind, "announcement"),
      eq(posts.isActive, true),
      isNull(posts.archivedAt),
      audienceFilter,
      or(isNull(posts.startsAt), lte(posts.startsAt, now))!,
      or(isNull(posts.endsAt), gt(posts.endsAt, now))!,
    ];

    if (userId) {
      conditions.push(
        notExists(
          db
            .select()
            .from(postViews)
            .where(and(eq(postViews.postId, posts.id), eq(postViews.userId, userId))),
        ),
      );
    }

    const [row] = await db
      .select()
      .from(posts)
      .where(and(...conditions))
      .orderBy(desc(posts.createdAt))
      .limit(1);

    if (!row) return null;

    return {
      id: row.id,
      kind: "announcement",
      slug: row.slug,
      title: pickField(locale, row, "title"),
      body: pickField(locale, row, "body"),
      coverImagePath: row.coverImagePath,
      galleryImages: row.galleryImages ?? [],
      instagramUrl: row.instagramUrl,
      externalUrl: row.externalUrl,
      registrationUrl: row.registrationUrl,
      allowRegistration: row.allowRegistration,
      maxAttendees: row.maxAttendees,
      startsAt: row.startsAt,
      endsAt: row.endsAt,
      location: pickField(locale, row, "location"),
      isOnline: row.isOnline,
      createdAt: row.createdAt,
    };
  },
);

export async function isPostSlugTaken(slug: string, excludeId?: string): Promise<boolean> {
  const [row] = await db
    .select({ id: posts.id })
    .from(posts)
    .where(eq(posts.slug, slug))
    .limit(1);

  if (!row) return false;
  return row.id !== excludeId;
}
