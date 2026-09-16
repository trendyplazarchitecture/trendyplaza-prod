import { PageHead } from "@/components/admin/AdminChrome";
import { PostsManager } from "@/components/admin/PostsManager";
import { PermissionGate } from "@/components/admin/PermissionGate";
import { MaintenanceToggle } from "@/components/admin/MaintenanceToggle";
import { requireStaffOrNotFound } from "@/server/session";
import { listAdminPosts } from "@/server/posts";
import { isSectionUnderMaintenance } from "@/server/maintenance";

export const dynamic = "force-dynamic";

export default async function AdminPostsPage() {
  const user = await requireStaffOrNotFound();
  if (!user.permissions.has("posts.manage")) {
    return (
      <div className="space-y-6">
        <PageHead title="Posts & Events" />
        <PermissionGate permission="posts.manage" />
      </div>
    );
  }

  const [rows, isMaintenance] = await Promise.all([
    listAdminPosts(),
    isSectionUnderMaintenance("news-events"),
  ]);
  const live = rows.filter((r) => r.isActive && !r.archivedAt).length;

  return (
    <div className="space-y-6">
      <PageHead
        title="Posts, Events & News"
        meta={`${rows.length} total item${rows.length === 1 ? "" : "s"}, ${live} active across announcements, events and news.`}
        action={
          <MaintenanceToggle section="news-events" isActive={isMaintenance} />
        }
      />
      <PostsManager rows={rows} />
    </div>
  );
}
