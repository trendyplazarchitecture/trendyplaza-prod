import { PageHead } from "@/components/admin/AdminChrome";
import { MessagesTable, type TrashedMessageRow } from "@/components/admin/MessagesTable";
import { PermissionGate } from "@/components/admin/PermissionGate";
import { hasPermission, requireStaffOrNotFound } from "@/server/session";
import { listContactMessages } from "@/server/messages";
import { listTrash } from "@/server/trash";

export const dynamic = "force-dynamic";

/**
 * The other end of the public contact form.
 *
 * `messages.view` gets the list; `messages.reply` gets the ability to mark
 * one read or answered. Nothing here sends a message — there is no outbound
 * email in this project, so "answered" records that a person actually
 * messaged the sender back on WhatsApp or Instagram.
 */
export default async function AdminMessagesPage() {
  const user = await requireStaffOrNotFound();
  if (!user.permissions.has("messages.view")) {
    return (
      <div className="space-y-6">
        <PageHead title="Messages" />
        <PermissionGate permission="messages.view" />
      </div>
    );
  }

  const canReply = await hasPermission("messages.reply");
  const [messages, trashed] = await Promise.all([
    listContactMessages(),
    canReply ? listTrash(["contact_message"]) : Promise.resolve([]),
  ]);
  const trashRows: TrashedMessageRow[] = trashed.map((r) => ({
    id: r.id,
    title: r.title,
    archivedAt: r.archivedAt.toISOString(),
    daysRemaining: r.daysRemaining,
  }));

  return (
    <div className="space-y-6">
      <PageHead
        title="Messages"
        meta={`${messages.length} received through the contact page.`}
      />
      <MessagesTable messages={messages} canReply={canReply} trashRows={trashRows} />
    </div>
  );
}
