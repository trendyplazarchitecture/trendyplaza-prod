import { eq } from "drizzle-orm";

import { PageHead } from "@/components/admin/AdminChrome";
import { ContentManager, type ResourceRow } from "@/components/admin/ContentManager";
import type { UniversityNode } from "@/components/admin/ContentTree";
import { PermissionGate } from "@/components/admin/PermissionGate";
import { requireStaffOrNotFound } from "@/server/session";
import { getAdminContentTree, getModuleResources } from "@/server/admin";
import { db } from "@/db";
import { modules, resourceTypes } from "@/db/schema";

export const dynamic = "force-dynamic";

export default async function AdminContentPage({
  searchParams,
}: {
  searchParams: Promise<{ module?: string }>;
}) {
  const user = await requireStaffOrNotFound();
  if (!user.permissions.has("content.manage")) {
    return (
      <div className="space-y-6">
        <PageHead title="Content" />
        <PermissionGate permission="content.manage" />
      </div>
    );
  }

  const { module: moduleId } = await searchParams;
  const [{ universities: unis, rows }, types] = await Promise.all([
    getAdminContentTree(),
    db.select().from(resourceTypes).orderBy(resourceTypes.position),
  ]);

  // Shape the flat join into the tree the client component walks.
  const byUniversity = new Map<string, UniversityNode>();
  for (const uni of unis) {
    byUniversity.set(uni.id, {
      id: uni.id,
      slug: uni.slug,
      nameEn: uni.nameEn,
      nameAr: uni.nameAr,
      nameFr: uni.nameFr,
      isVisible: uni.isVisible,
      archived: uni.archivedAt !== null,
      years: [],
    });
  }

  for (const row of rows) {
    const uni = byUniversity.get(row.universityId);
    if (!uni) continue;

    let year = uni.years.find((y) => y.id === row.yearId);
    if (!year) {
      year = {
        id: row.yearId,
        level: row.yearNameEn,
        nameEn: row.yearNameEn,
        nameAr: row.yearNameAr,
        nameFr: row.yearNameFr,
        archived: row.yearArchived !== null,
        semesters: [],
      };
      uni.years.push(year);
    }

    // A year with no terms yet joins as a row of nulls. It belongs in the tree
    // — that is where the control to add its first term lives — but it has no
    // semester to push.
    if (!row.semesterId) continue;

    let semester = year.semesters.find((s) => s.id === row.semesterId);
    if (!semester) {
      semester = {
        id: row.semesterId,
        number: row.semesterNumber ?? 0,
        label: row.semesterLabelEn ?? `Semester ${row.semesterNumber}`,
        labelEn: row.semesterLabelEn ?? "",
        labelAr: row.semesterLabelAr,
        labelFr: row.semesterLabelFr,
        archived: row.semesterArchived !== null,
        modules: [],
      };
      year.semesters.push(semester);
    }

    if (row.moduleId) {
      semester.modules.push({
        id: row.moduleId,
        nameEn: row.moduleNameEn ?? "",
        nameAr: row.moduleNameAr,
        nameFr: row.moduleNameFr,
        isVisible: row.moduleVisible ?? true,
        archived: row.moduleArchived !== null,
        resourceCount: row.resourceCount ?? 0,
      });
    }
  }

  let resources: ResourceRow[] = [];
  let openModuleName: string | null = null;

  if (moduleId && /^[0-9a-f-]{36}$/i.test(moduleId)) {
    const [mod] = await db
      .select({ nameEn: modules.nameEn })
      .from(modules)
      .where(eq(modules.id, moduleId))
      .limit(1);

    if (mod) {
      openModuleName = mod.nameEn;
      resources = await getModuleResources(moduleId);
    }
  }

  const totalModules = rows.filter((r) => r.moduleId).length;
  const missingArabic = rows.filter((r) => r.moduleId && !r.moduleNameAr).length;

  return (
    <div className="space-y-6">
      <PageHead
        title="Content"
        meta={
          <>
            {unis.length} universit{unis.length === 1 ? "y" : "ies"}, {totalModules} modules.
            {missingArabic > 0 && (
              <>
                {" "}
                <span className="text-amber-700">
                  {missingArabic} module{missingArabic === 1 ? "" : "s"} without an Arabic name
                </span>
                , which read in English for Arabic students until translated.
              </>
            )}
          </>
        }
      />

      <ContentManager
        universities={[...byUniversity.values()]}
        resourceTypes={types.map((t) => ({ id: t.id, key: t.key, labelEn: t.labelEn }))}
        resources={resources}
        openModuleId={moduleId ?? null}
        openModuleName={openModuleName}
      />
    </div>
  );
}
