import { getTranslations } from "next-intl/server";
import { PageHead, Panel } from "@/components/admin/AdminChrome";
import { ActivityLogTable } from "@/components/admin/ActivityLogTable";
import { PermissionGate } from "@/components/admin/PermissionGate";
import { requireStaffOrNotFound } from "@/server/session";
import { listActivity } from "@/server/admin";
import type { ListQuery } from "@/server/_list";

export const dynamic = "force-dynamic";

export default async function AdminActivityPage({
  searchParams,
}: {
  searchParams: Promise<ListQuery>;
}) {
  const t = await getTranslations("admin.activity");
  const user = await requireStaffOrNotFound();
  if (!user.permissions.has("orders.view") && !user.permissions.has("users.manage")) {
    return (
      <div className="space-y-6">
        <PageHead title={t("pageTitle")} />
        <PermissionGate permission="users.manage" />
      </div>
    );
  }

  const query = await searchParams;
  const { rows, total, page, perPage, sort, direction } = await listActivity(query);

  return (
    <div className="space-y-6">
      <PageHead title={t("pageTitle")} meta={t("pageMeta")} />

      <Panel title={t("panelTitle", { count: total })} padded={false}>
        <ActivityLogTable
          rows={rows}
          total={total}
          page={page}
          perPage={perPage}
          sort={sort}
          direction={direction}
        />
      </Panel>
    </div>
  );
}
