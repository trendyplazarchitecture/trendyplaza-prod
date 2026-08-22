"use server";

import { revalidatePath } from "next/cache";
import { and, eq, isNull, max } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import {
  academicYears,
  modules,
  resourceTypes,
  resources,
  semesters,
  universities,
} from "@/db/schema";
import { requirePermission } from "@/server/session";
import { logActivity } from "@/server/activity";
import { MAX_RESOURCE_BYTES, storeUpload } from "@/server/storage";
import type { ActionResult } from "./orders";

export type { ActionResult };

/**
 * Content authoring.
 *
 * Two rules run through all of it. Nothing is ever deleted: `archived_at` is
 * set, because an entitlement resolving to a missing row is the failure this
 * schema exists to prevent. And English is required while Arabic and French
 * are optional, because requiring three translations at insert time stalls
 * the person loading a semester of material at 9pm.
 */

const triEn = z.string().trim().min(1).max(300);
const triOther = z.string().trim().max(300).nullable().optional();

/* ---------------------------------------------------------------- university */

const universityInput = z.object({
  id: z.string().uuid().optional(),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(60)
    .regex(/^[a-z0-9-]+$/, "Lower case letters, numbers and hyphens only"),
  nameEn: triEn,
  nameAr: triOther,
  nameFr: triOther,
  isVisible: z.boolean().optional(),
  /**
   * The starting shape. Only read when creating.
   *
   * `lmd` is the Licence/Master ladder. `years5` is the five-year diplome many
   * Algerian architecture schools still run. `empty` is for anyone whose
   * structure is neither, and it is the reason years are named rather than
   * enumerated.
   */
  preset: z.enum(["lmd", "years5", "empty"]).optional(),
});

export async function saveUniversityAction(
  input: z.infer<typeof universityInput>,
): Promise<ActionResult> {
  const actor = await requirePermission("content.manage");
  const data = universityInput.parse(input);

  const values = {
    slug: data.slug,
    nameEn: data.nameEn,
    nameAr: data.nameAr ?? null,
    nameFr: data.nameFr ?? null,
    isVisible: data.isVisible ?? true,
  };

  if (data.id) {
    await db.update(universities).set(values).where(eq(universities.id, data.id));
  } else {
    const [row] = await db.insert(universities).values(values).returning();
    await seedSkeleton(row.id, data.preset ?? "lmd");
  }

  await logActivity({
    actorId: actor.id,
    action: data.id ? "content.university_updated" : "content.university_created",
    entity: "university",
    entityId: data.id,
    after: values,
  });

  revalidatePath("/admin/content");
  return {
    ok: true,
    message: data.id
      ? "University saved."
      : data.preset === "empty"
        ? "University created. Add its years next; call them whatever the school calls them."
        : "University created, with its years and terms. Rename any of them.",
  };
}

/**
 * A starting shape, not a fixed one.
 *
 * This used to create L1 to M2 unconditionally, which quietly asserted that
 * every school runs LMD. They do not: a five-year diplome is common, and some
 * schools name their years something else again. A university created here can
 * now start empty and be built by hand, and every year created either way can
 * be renamed afterwards.
 */
const PRESETS = {
  lmd: [
    { nameEn: "Licence 1", nameFr: "Licence 1", nameAr: "ليسانس 1", level: "L1" as const },
    { nameEn: "Licence 2", nameFr: "Licence 2", nameAr: "ليسانس 2", level: "L2" as const },
    { nameEn: "Licence 3", nameFr: "Licence 3", nameAr: "ليسانس 3", level: "L3" as const },
    { nameEn: "Master 1", nameFr: "Master 1", nameAr: "ماستر 1", level: "M1" as const },
    { nameEn: "Master 2", nameFr: "Master 2", nameAr: "ماستر 2", level: "M2" as const },
  ],
  years5: [
    { nameEn: "Year 1", nameFr: "1re annee", nameAr: "السنة الأولى", level: null },
    { nameEn: "Year 2", nameFr: "2e annee", nameAr: "السنة الثانية", level: null },
    { nameEn: "Year 3", nameFr: "3e annee", nameAr: "السنة الثالثة", level: null },
    { nameEn: "Year 4", nameFr: "4e annee", nameAr: "السنة الرابعة", level: null },
    { nameEn: "Year 5", nameFr: "5e annee", nameAr: "السنة الخامسة", level: null },
  ],
  empty: [],
} as const;

async function seedSkeleton(universityId: string, preset: "lmd" | "years5" | "empty") {
  for (const [index, year] of PRESETS[preset].entries()) {
    const [row] = await db
      .insert(academicYears)
      .values({
        universityId,
        nameEn: year.nameEn,
        nameFr: year.nameFr,
        nameAr: year.nameAr,
        level: year.level,
        position: index + 1,
      })
      .returning();

    await db.insert(semesters).values(
      [1, 2].map((number) => ({
        academicYearId: row.id,
        number,
        labelEn: `Semester ${number}`,
        labelFr: `Semestre ${number}`,
        labelAr: `السداسي ${number}`,
      })),
    );
  }
}

/* ---------------------------------------------------------------------- year */

const yearInput = z.object({
  id: z.string().uuid().optional(),
  universityId: z.string().uuid(),
  nameEn: triEn,
  nameAr: triOther,
  nameFr: triOther,
});

/** Create or rename a year. The name is whatever the school calls it. */
export async function saveYearAction(
  input: z.infer<typeof yearInput>,
): Promise<ActionResult> {
  const actor = await requirePermission("content.manage");
  const parsed = yearInput.safeParse(input);
  if (!parsed.success) return { ok: false, message: "A year needs an English name." };
  const data = parsed.data;

  const values = {
    nameEn: data.nameEn,
    nameAr: data.nameAr ?? null,
    nameFr: data.nameFr ?? null,
  };

  if (data.id) {
    await db.update(academicYears).set(values).where(eq(academicYears.id, data.id));
  } else {
    const [last] = await db
      .select({ value: max(academicYears.position) })
      .from(academicYears)
      .where(eq(academicYears.universityId, data.universityId));

    await db.insert(academicYears).values({
      ...values,
      universityId: data.universityId,
      position: (last?.value ?? 0) + 1,
    });
  }

  await logActivity({
    actorId: actor.id,
    action: data.id ? "content.year_updated" : "content.year_created",
    entity: "year",
    entityId: data.id,
    after: values,
  });

  revalidatePath("/admin/content");
  return { ok: true, message: data.id ? "Year saved." : "Year added." };
}

/* ------------------------------------------------------------------ semester */

const semesterInput = z.object({
  id: z.string().uuid().optional(),
  academicYearId: z.string().uuid(),
  labelEn: triEn,
  labelAr: triOther,
  labelFr: triOther,
});

/**
 * Create or rename a term.
 *
 * `number` is derived rather than asked for. A school with three terms should
 * name them; making someone pick a number as well is a second way to say the
 * same thing, and the two drift apart.
 */
export async function saveSemesterAction(
  input: z.infer<typeof semesterInput>,
): Promise<ActionResult> {
  const actor = await requirePermission("content.manage");
  const parsed = semesterInput.safeParse(input);
  if (!parsed.success) return { ok: false, message: "A term needs an English name." };
  const data = parsed.data;

  const values = {
    labelEn: data.labelEn,
    labelAr: data.labelAr ?? null,
    labelFr: data.labelFr ?? null,
  };

  if (data.id) {
    await db.update(semesters).set(values).where(eq(semesters.id, data.id));
  } else {
    const [last] = await db
      .select({ value: max(semesters.number) })
      .from(semesters)
      .where(eq(semesters.academicYearId, data.academicYearId));

    await db.insert(semesters).values({
      ...values,
      academicYearId: data.academicYearId,
      number: (last?.value ?? 0) + 1,
    });
  }

  await logActivity({
    actorId: actor.id,
    action: data.id ? "content.semester_updated" : "content.semester_created",
    entity: "semester",
    entityId: data.id,
    after: values,
  });

  revalidatePath("/admin/content");
  return { ok: true, message: data.id ? "Term saved." : "Term added." };
}

/* -------------------------------------------------------------------- module */

const moduleInput = z.object({
  id: z.string().uuid().optional(),
  semesterId: z.string().uuid(),
  nameEn: triEn,
  nameAr: triOther,
  nameFr: triOther,
  descriptionEn: z.string().trim().max(600).nullable().optional(),
  descriptionAr: z.string().trim().max(600).nullable().optional(),
  descriptionFr: z.string().trim().max(600).nullable().optional(),
  isVisible: z.boolean().optional(),
});

export async function saveModuleAction(
  input: z.infer<typeof moduleInput>,
): Promise<ActionResult> {
  const actor = await requirePermission("content.manage");
  const data = moduleInput.parse(input);

  const values = {
    semesterId: data.semesterId,
    nameEn: data.nameEn,
    nameAr: data.nameAr ?? null,
    nameFr: data.nameFr ?? null,
    descriptionEn: data.descriptionEn ?? null,
    descriptionAr: data.descriptionAr ?? null,
    descriptionFr: data.descriptionFr ?? null,
    isVisible: data.isVisible ?? true,
  };

  if (data.id) {
    await db.update(modules).set(values).where(eq(modules.id, data.id));
  } else {
    const [row] = await db
      .select({ value: max(modules.position) })
      .from(modules)
      .where(eq(modules.semesterId, data.semesterId));

    await db.insert(modules).values({ ...values, position: (row?.value ?? 0) + 1 });
  }

  await logActivity({
    actorId: actor.id,
    action: data.id ? "content.module_updated" : "content.module_created",
    entity: "module",
    entityId: data.id,
    after: { nameEn: data.nameEn },
  });

  revalidatePath("/admin/content");
  return { ok: true, message: data.id ? "Module saved." : "Module added." };
}

/* ------------------------------------------------------------------ resource */

const resourceInput = z.object({
  id: z.string().uuid().optional(),
  moduleId: z.string().uuid(),
  resourceTypeId: z.string().uuid(),
  titleEn: triEn,
  titleAr: triOther,
  titleFr: triOther,
  source: z.enum(["file", "youtube", "drive", "link"]),
  externalUrl: z.string().url().max(600).nullable().optional(),
  allowDownload: z.boolean().optional(),
  isVisible: z.boolean().optional(),
});

/**
 * `file` sources take the upload here rather than through a separate route, so
 * the magic-byte check, the size cap and the row insert cannot come apart.
 */
export async function saveResourceAction(formData: FormData): Promise<ActionResult> {
  const actor = await requirePermission("content.manage");

  const parsed = resourceInput.safeParse({
    id: (formData.get("id") as string) || undefined,
    moduleId: formData.get("moduleId"),
    resourceTypeId: formData.get("resourceTypeId"),
    titleEn: formData.get("titleEn"),
    titleAr: (formData.get("titleAr") as string) || null,
    titleFr: (formData.get("titleFr") as string) || null,
    source: formData.get("source"),
    externalUrl: (formData.get("externalUrl") as string) || null,
    allowDownload: formData.get("allowDownload") === "on",
    isVisible: formData.get("isVisible") !== "off",
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "Check the fields: an English title and either a file or a valid link are needed.",
    };
  }
  const data = parsed.data;

  let filePath: string | null = null;
  let mimeType: string | null = null;
  let sizeBytes: number | null = null;

  const upload = formData.get("file");
  if (upload instanceof File && upload.size > 0) {
    const stored = await storeUpload(
      "resources",
      { buffer: Buffer.from(await upload.arrayBuffer()) },
      // Course PDFs are the point; re-encoding them is not, and a scanned
      // board arrives as a PDF more often than as an image.
      { maxBytes: MAX_RESOURCE_BYTES, convertImages: false },
    );

    if (!stored.ok) {
      return {
        ok: false,
        message:
          stored.error === "too_large"
            ? "That file is over 200 MB. Split it, or compress the scan."
            : "That file type is not accepted. Use a PDF, JPEG, PNG or WebP.",
      };
    }

    filePath = stored.relativePath;
    mimeType = stored.mime;
    sizeBytes = stored.bytes;
  }

  if (data.source === "file" && !filePath && !data.id) {
    return { ok: false, message: "Choose a file, or switch the source to a link." };
  }
  if (data.source !== "file" && !data.externalUrl) {
    return { ok: false, message: "Paste the link this resource points at." };
  }

  const values = {
    moduleId: data.moduleId,
    resourceTypeId: data.resourceTypeId,
    titleEn: data.titleEn,
    titleAr: data.titleAr ?? null,
    titleFr: data.titleFr ?? null,
    source: data.source,
    externalUrl: data.source === "file" ? null : (data.externalUrl ?? null),
    allowDownload: data.allowDownload ?? false,
    isVisible: data.isVisible ?? true,
  };

  if (data.id) {
    await db
      .update(resources)
      .set({
        ...values,
        // Keep the existing file when the editor did not attach a new one.
        ...(filePath ? { filePath, mimeType, sizeBytes } : {}),
      })
      .where(eq(resources.id, data.id));
  } else {
    const [row] = await db
      .select({ value: max(resources.position) })
      .from(resources)
      .where(eq(resources.moduleId, data.moduleId));

    await db.insert(resources).values({
      ...values,
      filePath,
      mimeType,
      sizeBytes,
      position: (row?.value ?? 0) + 1,
    });
  }

  await logActivity({
    actorId: actor.id,
    action: data.id ? "content.resource_updated" : "content.resource_created",
    entity: "resource",
    entityId: data.id,
    after: { titleEn: data.titleEn, source: data.source },
  });

  revalidatePath("/admin/content");
  return { ok: true, message: data.id ? "Resource saved." : "Resource added." };
}

/**
 * Twenty PDFs in, twenty resources out, the filename as the title.
 *
 * The single biggest time saver on this screen. Loading a semester today means
 * opening the dialog once per file, typing the title, choosing the type and
 * saving: for a forty-file semester that is forty round trips through a modal.
 * Here the client drops the folder, renames in place afterwards, and the
 * filename is a better first draft of a title than an empty box.
 *
 * One bad file does not lose the rest. The result says how many landed and how
 * many did not, because "some of your upload failed" with no number is worse
 * than useless when there were forty.
 */
const bulkInput = z.object({
  moduleId: z.string().uuid(),
  resourceTypeId: z.string().uuid(),
});

export type BulkResult =
  | { ok: true; message: string; created: number; rejected: string[] }
  | { ok: false; message: string };

export async function bulkAddResourcesAction(formData: FormData): Promise<BulkResult> {
  const actor = await requirePermission("content.manage");

  const parsed = bulkInput.safeParse({
    moduleId: formData.get("moduleId"),
    resourceTypeId: formData.get("resourceTypeId"),
  });
  if (!parsed.success) {
    return { ok: false, message: "Pick a module and a resource type first." };
  }
  const { moduleId, resourceTypeId } = parsed.data;

  const files = formData
    .getAll("files")
    .filter((f): f is File => f instanceof File && f.size > 0);

  if (files.length === 0) return { ok: false, message: "No files were attached." };
  if (files.length > 60) {
    return { ok: false, message: "Sixty files at a time. Split the drop." };
  }

  const [row] = await db
    .select({ value: max(resources.position) })
    .from(resources)
    .where(eq(resources.moduleId, moduleId));
  let position = (row?.value ?? 0) + 1;

  let created = 0;
  const rejected: string[] = [];

  for (const file of files) {
    const stored = await storeUpload(
      "resources",
      { buffer: Buffer.from(await file.arrayBuffer()) },
      { maxBytes: MAX_RESOURCE_BYTES, convertImages: false },
    );

    if (!stored.ok) {
      rejected.push(file.name);
      continue;
    }

    await db.insert(resources).values({
      moduleId,
      resourceTypeId,
      // The filename without its extension, tidied. `cours-01_final.pdf`
      // becomes "cours 01 final", which is a title worth editing rather than
      // one worth retyping.
      titleEn: titleFromFilename(file.name),
      source: "file",
      filePath: stored.relativePath,
      mimeType: stored.mime,
      sizeBytes: stored.bytes,
      position: position++,
    });
    created += 1;
  }

  await logActivity({
    actorId: actor.id,
    action: "content.resources_bulk_added",
    entity: "module",
    entityId: moduleId,
    after: { created, rejected: rejected.length },
  });

  revalidatePath("/admin/content");

  if (created === 0) {
    return { ok: false, message: "None of those files were a type we accept." };
  }

  return {
    ok: true,
    created,
    rejected,
    message:
      rejected.length === 0
        ? `${created} resource${created === 1 ? "" : "s"} added. Rename them in place.`
        : `${created} added. ${rejected.length} skipped: ${rejected.slice(0, 3).join(", ")}${rejected.length > 3 ? "…" : ""}`,
  };
}

function titleFromFilename(name: string): string {
  const withoutExtension = name.replace(/\.[^.]+$/, "");
  const words = withoutExtension.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
  if (!words) return "Untitled";
  return (words.charAt(0).toUpperCase() + words.slice(1)).slice(0, 200);
}

/** The order the student reads them in. Sent as the whole list, as arranged. */
export async function reorderResourcesAction(input: {
  moduleId: string;
  resourceIds: string[];
}): Promise<ActionResult> {
  const actor = await requirePermission("content.manage");
  const data = z
    .object({
      moduleId: z.string().uuid(),
      resourceIds: z.array(z.string().uuid()).max(200),
    })
    .parse(input);

  await db.transaction(async (tx) => {
    for (const [index, id] of data.resourceIds.entries()) {
      await tx
        .update(resources)
        .set({ position: index })
        .where(and(eq(resources.id, id), eq(resources.moduleId, data.moduleId)));
    }
  });

  await logActivity({
    actorId: actor.id,
    action: "content.resources_reordered",
    entity: "module",
    entityId: data.moduleId,
  });

  revalidatePath("/admin/content");
  return { ok: true, message: "Order saved." };
}

/**
 * Copies a module and its resources into another semester.
 *
 * `02_DOMAIN.md` describes reuse across universities as a copy of the
 * resources, never a shared reference, so that one university editing their
 * material cannot change another's. That is what this does: new module row,
 * new resource rows, and the same `file_path` on each.
 *
 * The file itself is not duplicated on disk. Two rows pointing at one blob is
 * correct here: the bytes are identical and immutable, nothing ever writes to
 * a stored file, and copying a 200 MB course pack per university would fill
 * the disk to no purpose. Deleting is a soft delete, so neither copy can pull
 * the file out from under the other.
 */
export async function duplicateModuleAction(input: {
  moduleId: string;
  targetSemesterId: string;
}): Promise<ActionResult> {
  const actor = await requirePermission("content.manage");
  const data = z
    .object({
      moduleId: z.string().uuid(),
      targetSemesterId: z.string().uuid(),
    })
    .parse(input);

  const [source] = await db
    .select()
    .from(modules)
    .where(eq(modules.id, data.moduleId))
    .limit(1);
  if (!source) return { ok: false, message: "That module no longer exists." };

  const [target] = await db
    .select({ id: semesters.id })
    .from(semesters)
    .where(and(eq(semesters.id, data.targetSemesterId), isNull(semesters.archivedAt)))
    .limit(1);
  if (!target) return { ok: false, message: "That semester no longer exists." };

  const copied = await db.transaction(async (tx) => {
    const [last] = await tx
      .select({ value: max(modules.position) })
      .from(modules)
      .where(eq(modules.semesterId, data.targetSemesterId));

    const [copy] = await tx
      .insert(modules)
      .values({
        semesterId: data.targetSemesterId,
        nameEn: source.nameEn,
        nameFr: source.nameFr,
        nameAr: source.nameAr,
        descriptionEn: source.descriptionEn,
        descriptionFr: source.descriptionFr,
        descriptionAr: source.descriptionAr,
        position: (last?.value ?? 0) + 1,
        // Hidden on arrival. A copy lands where students would see it, and the
        // client almost always wants to rename it first.
        isVisible: false,
      })
      .returning();

    const originals = await tx
      .select()
      .from(resources)
      .where(and(eq(resources.moduleId, data.moduleId), isNull(resources.archivedAt)));

    if (originals.length > 0) {
      await tx.insert(resources).values(
        originals.map((r) => ({
          moduleId: copy.id,
          resourceTypeId: r.resourceTypeId,
          titleEn: r.titleEn,
          titleFr: r.titleFr,
          titleAr: r.titleAr,
          descriptionEn: r.descriptionEn,
          descriptionFr: r.descriptionFr,
          descriptionAr: r.descriptionAr,
          source: r.source,
          filePath: r.filePath,
          externalUrl: r.externalUrl,
          mimeType: r.mimeType,
          sizeBytes: r.sizeBytes,
          allowDownload: r.allowDownload,
          isVisible: r.isVisible,
          position: r.position,
        })),
      );
    }

    return { moduleId: copy.id, resources: originals.length };
  });

  await logActivity({
    actorId: actor.id,
    action: "content.module_duplicated",
    entity: "module",
    entityId: copied.moduleId,
    before: { from: data.moduleId },
    after: { resources: copied.resources },
  });

  revalidatePath("/admin/content");
  return {
    ok: true,
    message: `Copied with ${copied.resources} resource${copied.resources === 1 ? "" : "s"}. It is hidden until you list it.`,
  };
}

/* --------------------------------------------------- visibility and archive */

const TABLE = {
  university: universities,
  year: academicYears,
  semester: semesters,
  module: modules,
  resource: resources,
} as const;

const toggleInput = z.object({
  entity: z.enum(["university", "year", "semester", "module", "resource"]),
  id: z.string().uuid(),
  isVisible: z.boolean(),
});

/** Hiding is not deleting. This is the column students see through. */
export async function setVisibilityAction(
  input: z.infer<typeof toggleInput>,
): Promise<ActionResult> {
  const actor = await requirePermission("content.publish");
  const data = toggleInput.parse(input);

  const table = TABLE[data.entity];
  await db.update(table).set({ isVisible: data.isVisible }).where(eq(table.id, data.id));

  await logActivity({
    actorId: actor.id,
    action: data.isVisible ? "content.shown" : "content.hidden",
    entity: data.entity,
    entityId: data.id,
  });

  revalidatePath("/admin/content");
  return {
    ok: true,
    message: data.isVisible ? "Students can see it now." : "Hidden from students.",
  };
}

const archiveInput = z.object({
  entity: z.enum(["university", "year", "semester", "module", "resource"]),
  id: z.string().uuid(),
});

/**
 * Soft delete, always. A hard delete on this chain removes content a student
 * paid for, raises no error, and leaves no trace.
 */
export async function archiveAction(
  input: z.infer<typeof archiveInput>,
): Promise<ActionResult> {
  const actor = await requirePermission("content.manage");
  const data = archiveInput.parse(input);

  const table = TABLE[data.entity];
  await db
    .update(table)
    .set({ archivedAt: new Date(), isVisible: false })
    .where(and(eq(table.id, data.id), isNull(table.archivedAt)));

  await logActivity({
    actorId: actor.id,
    action: "content.archived",
    entity: data.entity,
    entityId: data.id,
  });

  revalidatePath("/admin/content");
  return {
    ok: true,
    message:
      "Archived. Out of sight, but nothing was deleted, so access that already resolves still resolves.",
  };
}

export async function restoreAction(
  input: z.infer<typeof archiveInput>,
): Promise<ActionResult> {
  const actor = await requirePermission("content.manage");
  const data = archiveInput.parse(input);

  const table = TABLE[data.entity];
  await db.update(table).set({ archivedAt: null }).where(eq(table.id, data.id));

  await logActivity({
    actorId: actor.id,
    action: "content.restored",
    entity: data.entity,
    entityId: data.id,
  });

  revalidatePath("/admin/content");
  return { ok: true, message: "Restored, and still hidden until you show it." };
}

/** The type list the resource form offers. */
export async function listResourceTypesAction() {
  await requirePermission("content.manage");
  return db.select().from(resourceTypes).orderBy(resourceTypes.position);
}
