import { PageHead, Panel } from "@/components/admin/AdminChrome";
import { CodeLookup } from "@/components/admin/CodeLookup";
import { PermissionGate } from "@/components/admin/PermissionGate";
import { requireStaffOrNotFound } from "@/server/session";

export const dynamic = "force-dynamic";

export default async function CodeLookupPage() {
  const user = await requireStaffOrNotFound();
  if (!user.permissions.has("codes.generate")) {
    return (
      <div className="space-y-6">
        <PageHead title="Check a code" />
        <PermissionGate permission="codes.generate" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHead
        title="Check a code"
        meta="A student is on the phone reading a card. Paste what they say and see whether it works."
      />
      <Panel title="Lookup">
        <CodeLookup />
      </Panel>
    </div>
  );
}
