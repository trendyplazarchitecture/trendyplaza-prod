"use server";

import { revalidatePath } from "next/cache";
import { and, count, desc, eq, isNotNull, isNull, max, or } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { eventRegistrations, postViews, posts } from "@/db/schema";
import { getCurrentUser, requirePermission, requireUser } from "@/server/session";
import { storeUpload } from "@/server/storage";
import { logActivity } from "@/server/activity";
import type { ActionResult } from "./orders";

export type { ActionResult };

const REVALIDATE_PATHS = [
  "/admin/posts",
  "/events",
  "/news",
  "/account",
  "/",
] as const;

function revalidatePostPaths() {
  for (const path of REVALIDATE_PATHS) {
    revalidatePath(path);
  }
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const savePostInput = z.object({
  id: z.string().uuid().optional(),
  kind: z.enum(["announcement", "event", "news"]).default("announcement"),
  slug: z.string().trim().max(160).nullable().optional(),
  titleEn: z.string().trim().min(2).max(250),
  titleFr: z.string().trim().max(250).nullable(),
  titleAr: z.string().trim().max(250).nullable(),
  bodyEn: z.string().trim().min(2).max(10_000),
  bodyFr: z.string().trim().max(10_000).nullable(),
  bodyAr: z.string().trim().max(10_000).nullable(),
  audience: z.enum(["all", "students", "on_hold"]).default("all"),
  startsAt: z.string().datetime().nullable().optional(),
  endsAt: z.string().datetime().nullable().optional(),
  locationEn: z.string().trim().max(250).nullable().optional(),
  locationFr: z.string().trim().max(250).nullable().optional(),
  locationAr: z.string().trim().max(250).nullable().optional(),
  isOnline: z.boolean().default(false),
  instagramUrl: z.string().trim().url().nullable().optional().or(z.literal("")),
  externalUrl: z.string().trim().url().nullable().optional().or(z.literal("")),
  registrationUrl: z.string().trim().url().nullable().optional().or(z.literal("")),
  allowRegistration: z.boolean().default(true),
  maxAttendees: z.number().int().positive().nullable().optional(),
  isActive: z.boolean().default(true),
});

export async function savePostAction(formData: FormData): Promise<ActionResult> {
  const actor = await requirePermission("posts.manage");

  const field = (name: string) => {
    const value = formData.get(name);
    const trimmed = typeof value === "string" ? value.trim() : "";
    return trimmed || null;
  };

  const kind = (formData.get("kind") as "announcement" | "event" | "news") || "announcement";
  let slugValue = field("slug");
  const titleEn = field("titleEn") || "";

  if (kind !== "announcement") {
    if (!slugValue) {
      slugValue = slugify(titleEn) || `post-${Date.now()}`;
    } else {
      slugValue = slugify(slugValue);
    }
  } else {
    slugValue = null;
  }

  const startsAtRaw = field("startsAt");
  const endsAtRaw = field("endsAt");
  const regUrlRaw = field("registrationUrl");
  const igUrlRaw = field("instagramUrl");
  const extUrlRaw = field("externalUrl");
  const maxAttendeesRaw = field("maxAttendees");

  const parsed = savePostInput.safeParse({
    id: (formData.get("id") as string) || undefined,
    kind,
    slug: slugValue,
    titleEn,
    titleFr: field("titleFr"),
    titleAr: field("titleAr"),
    bodyEn: field("bodyEn"),
    bodyFr: field("bodyFr"),
    bodyAr: field("bodyAr"),
    audience: (formData.get("audience") as string) || "all",
    startsAt: startsAtRaw ? new Date(startsAtRaw).toISOString() : null,
    endsAt: endsAtRaw ? new Date(endsAtRaw).toISOString() : null,
    locationEn: field("locationEn"),
    locationFr: field("locationFr"),
    locationAr: field("locationAr"),
    isOnline: formData.get("isOnline") === "true" || formData.get("isOnline") === "on",
    instagramUrl: igUrlRaw || null,
    externalUrl: extUrlRaw || null,
    registrationUrl: regUrlRaw || null,
    allowRegistration: formData.get("allowRegistration") !== "false",
    maxAttendees: maxAttendeesRaw ? parseInt(maxAttendeesRaw, 10) : null,
    isActive: formData.get("isActive") !== "false",
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Invalid form input.",
    };
  }

  const {
    id,
    slug,
    titleEn: tEn,
    titleFr,
    titleAr,
    bodyEn,
    bodyFr,
    bodyAr,
    audience,
    startsAt,
    endsAt,
    locationEn,
    locationFr,
    locationAr,
    isOnline,
    instagramUrl,
    externalUrl,
    registrationUrl,
    allowRegistration,
    maxAttendees,
    isActive,
  } = parsed.data;

  // Handle Cover Image (either existing path, string from gallery picker, or new file upload)
  let coverImagePath: string | null | undefined = undefined;
  const coverPathField = formData.get("coverImagePath");
  if (typeof coverPathField === "string") {
    coverImagePath = coverPathField.trim() || null;
  }

  const coverFile = formData.get("coverImage");
  if (coverFile instanceof File && coverFile.size > 0) {
    const buffer = Buffer.from(await coverFile.arrayBuffer());
    const stored = await storeUpload("posts", { buffer, declaredName: coverFile.name });
    if (stored.ok) {
      coverImagePath = stored.relativePath;
    }
  }

  // Handle Gallery Images
  const existingGalleryJson = formData.get("existingGalleryImages");
  let galleryImages: string[] = [];
  if (typeof existingGalleryJson === "string") {
    try {
      galleryImages = JSON.parse(existingGalleryJson);
    } catch {
      galleryImages = [];
    }
  }

  const galleryFiles = formData.getAll("galleryFiles");
  for (const f of galleryFiles) {
    if (f instanceof File && f.size > 0) {
      const buffer = Buffer.from(await f.arrayBuffer());
      const stored = await storeUpload("posts", { buffer, declaredName: f.name });
      if (stored.ok) {
        galleryImages.push(stored.relativePath);
      }
    }
  }

  // Check Slug uniqueness
  if (slug) {
    const [existing] = await db
      .select({ id: posts.id })
      .from(posts)
      .where(and(eq(posts.slug, slug), isNotNull(posts.id)))
      .limit(1);

    if (existing && existing.id !== id) {
      return {
        ok: false,
        message: `The slug "${slug}" is already in use by another post. Choose a distinct title or slug.`,
      };
    }
  }

  if (id) {
    const updateValues: Record<string, unknown> = {
      kind,
      slug,
      titleEn: tEn,
      titleFr,
      titleAr,
      bodyEn,
      bodyFr,
      bodyAr,
      audience,
      startsAt: startsAt ? new Date(startsAt) : null,
      endsAt: endsAt ? new Date(endsAt) : null,
      locationEn,
      locationFr,
      locationAr,
      isOnline,
      galleryImages,
      instagramUrl,
      externalUrl,
      registrationUrl: registrationUrl || externalUrl || null,
      allowRegistration,
      maxAttendees,
      isActive,
    };

    if (coverImagePath !== undefined) {
      updateValues.coverImagePath = coverImagePath;
    }

    await db.update(posts).set(updateValues).where(eq(posts.id, id));

    await logActivity({
      actorId: actor.id,
      action: "posts.updated",
      entity: "post",
      entityId: id,
    });
  } else {
    const [{ maxPos }] = await db
      .select({ maxPos: max(posts.position) })
      .from(posts)
      .where(eq(posts.kind, kind));

    const nextPos = (maxPos ?? 0) + 1;

    const [created] = await db
      .insert(posts)
      .values({
        kind,
        slug,
        titleEn: tEn,
        titleFr,
        titleAr,
        bodyEn,
        bodyFr,
        bodyAr,
        coverImagePath: coverImagePath ?? null,
        galleryImages,
        instagramUrl,
        externalUrl,
        registrationUrl: registrationUrl || externalUrl || null,
        allowRegistration,
        maxAttendees,
        audience,
        startsAt: startsAt ? new Date(startsAt) : null,
        endsAt: endsAt ? new Date(endsAt) : null,
        locationEn,
        locationFr,
        locationAr,
        isOnline,
        isActive,
        position: nextPos,
      })
      .returning({ id: posts.id });

    await logActivity({
      actorId: actor.id,
      action: "posts.created",
      entity: "post",
      entityId: created.id,
    });
  }

  revalidatePostPaths();
  return { ok: true, message: "Saved successfully." };
}

export async function archivePostAction(input: { id: string }): Promise<ActionResult> {
  const actor = await requirePermission("posts.manage");
  const parsed = z.object({ id: z.string().uuid() }).parse(input);

  await db
    .update(posts)
    .set({ archivedAt: new Date(), isActive: false })
    .where(eq(posts.id, parsed.id));

  await logActivity({
    actorId: actor.id,
    action: "posts.archived",
    entity: "post",
    entityId: parsed.id,
  });

  revalidatePostPaths();
  return { ok: true, message: "Archived." };
}

export async function restorePostAction(input: { id: string }): Promise<ActionResult> {
  const actor = await requirePermission("posts.manage");
  const parsed = z.object({ id: z.string().uuid() }).parse(input);

  await db
    .update(posts)
    .set({ archivedAt: null, isActive: true })
    .where(eq(posts.id, parsed.id));

  await logActivity({
    actorId: actor.id,
    action: "posts.restored",
    entity: "post",
    entityId: parsed.id,
  });

  revalidatePostPaths();
  return { ok: true, message: "Restored." };
}

export async function purgePostAction(input: { id: string }): Promise<ActionResult> {
  const actor = await requirePermission("posts.manage");
  const parsed = z.object({ id: z.string().uuid() }).parse(input);

  // eslint-disable-next-line no-restricted-syntax -- permanent deletion of unneeded post only from admin purge dialog
  await db.delete(posts).where(eq(posts.id, parsed.id));

  await logActivity({
    actorId: actor.id,
    action: "posts.purged",
    entity: "post",
    entityId: parsed.id,
  });

  revalidatePostPaths();
  return { ok: true, message: "Permanently deleted." };
}

export async function setPostActiveAction(input: {
  id: string;
  isActive: boolean;
}): Promise<ActionResult> {
  const actor = await requirePermission("posts.manage");
  const parsed = z
    .object({ id: z.string().uuid(), isActive: z.boolean() })
    .parse(input);

  await db
    .update(posts)
    .set({ isActive: parsed.isActive })
    .where(eq(posts.id, parsed.id));

  await logActivity({
    actorId: actor.id,
    action: "posts.active_toggled",
    entity: "post",
    entityId: parsed.id,
    after: { isActive: parsed.isActive },
  });

  revalidatePostPaths();
  return { ok: true, message: parsed.isActive ? "Published." : "Deactivated." };
}

export async function reorderPostsAction(input: {
  kind: "announcement" | "event" | "news";
  orderedIds: string[];
}): Promise<ActionResult> {
  const actor = await requirePermission("posts.manage");
  const parsed = z
    .object({
      kind: z.enum(["announcement", "event", "news"]),
      orderedIds: z.array(z.string().uuid()),
    })
    .parse(input);

  await db.transaction(async (tx) => {
    for (let index = 0; index < parsed.orderedIds.length; index++) {
      await tx
        .update(posts)
        .set({ position: index + 1 })
        .where(eq(posts.id, parsed.orderedIds[index]));
    }
  });

  await logActivity({
    actorId: actor.id,
    action: "posts.reordered",
    entity: "post",
    after: { kind: parsed.kind, count: parsed.orderedIds.length },
  });

  revalidatePostPaths();
  return { ok: true, message: "Reordered." };
}

export async function dismissAnnouncementAction(input: {
  postId: string;
}): Promise<ActionResult> {
  const session = await requireUser();
  const parsed = z.object({ postId: z.string().uuid() }).parse(input);

  await db
    .insert(postViews)
    .values({ postId: parsed.postId, userId: session.id })
    .onConflictDoNothing();

  revalidatePath("/account");
  return { ok: true, message: "Dismissed." };
}

// -----------------------------------------------------------------------------
// EVENT REGISTRATIONS
// -----------------------------------------------------------------------------

const registrationInput = z.object({
  postId: z.string().uuid(),
  name: z.string().trim().min(2, "Name is required.").max(120),
  phone: z
    .string()
    .trim()
    .min(9, "Phone number is too short.")
    .max(20, "Phone number is too long."),
  email: z.string().trim().email("Invalid email address."),
  university: z.string().trim().max(160).nullable().optional(),
  notes: z.string().trim().max(500).nullable().optional(),
});

export async function registerForEventAction(input: {
  postId: string;
  name: string;
  phone: string;
  email: string;
  university?: string | null;
  notes?: string | null;
}): Promise<ActionResult> {
  const parsed = registrationInput.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Invalid registration details.",
    };
  }

  const { postId, name, phone, email, university, notes } = parsed.data;

  // Check if event exists and allows registration
  const [event] = await db
    .select({
      id: posts.id,
      kind: posts.kind,
      allowRegistration: posts.allowRegistration,
      maxAttendees: posts.maxAttendees,
      archivedAt: posts.archivedAt,
      isActive: posts.isActive,
    })
    .from(posts)
    .where(eq(posts.id, postId))
    .limit(1);

  if (!event || event.kind !== "event" || event.archivedAt || !event.isActive) {
    return { ok: false, message: "This event is not open for registration." };
  }

  if (!event.allowRegistration) {
    return { ok: false, message: "Registration is closed for this event." };
  }

  // Get current user if logged in
  const currentUser = await getCurrentUser();

  // Check duplicate registration
  const duplicateConditions = [
    eq(eventRegistrations.postId, postId),
    or(
      eq(eventRegistrations.email, email),
      eq(eventRegistrations.phone, phone),
      currentUser ? eq(eventRegistrations.userId, currentUser.id) : undefined,
    )!,
  ];

  const [existing] = await db
    .select({ id: eventRegistrations.id })
    .from(eventRegistrations)
    .where(and(...duplicateConditions))
    .limit(1);

  if (existing) {
    return {
      ok: true,
      message: "You are already registered for this event.",
    };
  }

  // Check max attendees capacity if set
  if (event.maxAttendees && event.maxAttendees > 0) {
    const [{ c }] = await db
      .select({ c: count() })
      .from(eventRegistrations)
      .where(
        and(
          eq(eventRegistrations.postId, postId),
          eq(eventRegistrations.status, "registered"),
        ),
      );

    if (c >= event.maxAttendees) {
      return {
        ok: false,
        message: "This event has reached full capacity.",
      };
    }
  }

  await db.insert(eventRegistrations).values({
    postId,
    userId: currentUser?.id ?? null,
    name,
    phone,
    email,
    university: university || null,
    notes: notes || null,
    status: "registered",
  });

  revalidatePath("/events");
  revalidatePath("/account");
  return {
    ok: true,
    message: "Registration successful! We look forward to seeing you.",
  };
}

export async function cancelEventRegistrationAction(input: {
  registrationId: string;
}): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = z.object({ registrationId: z.string().uuid() }).parse(input);

  const [reg] = await db
    .select()
    .from(eventRegistrations)
    .where(eq(eventRegistrations.id, parsed.registrationId))
    .limit(1);

  if (!reg || reg.userId !== user.id) {
    return { ok: false, message: "Registration not found." };
  }

  // eslint-disable-next-line no-restricted-syntax -- student can cancel their own event RSVP
  await db
    .delete(eventRegistrations)
    .where(eq(eventRegistrations.id, parsed.registrationId));

  revalidatePath("/account");
  return { ok: true, message: "Registration cancelled." };
}

export async function updateAttendeeStatusAction(input: {
  registrationId: string;
  status: "registered" | "attended" | "cancelled";
}): Promise<ActionResult> {
  const actor = await requirePermission("posts.manage");
  const parsed = z
    .object({
      registrationId: z.string().uuid(),
      status: z.enum(["registered", "attended", "cancelled"]),
    })
    .parse(input);

  await db
    .update(eventRegistrations)
    .set({ status: parsed.status })
    .where(eq(eventRegistrations.id, parsed.registrationId));

  await logActivity({
    actorId: actor.id,
    action: "posts.attendee_status_updated",
    entity: "event_registration",
    entityId: parsed.registrationId,
    after: { status: parsed.status },
  });

  revalidatePath("/admin/posts");
  return { ok: true, message: "Attendee status updated." };
}

export async function listEventRegistrationsAction(input: {
  postId: string;
}) {
  await requirePermission("posts.manage");
  const parsed = z.object({ postId: z.string().uuid() }).parse(input);

  const rows = await db
    .select()
    .from(eventRegistrations)
    .where(eq(eventRegistrations.postId, parsed.postId))
    .orderBy(desc(eventRegistrations.createdAt));

  return rows;
}
