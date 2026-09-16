import { PageHead } from "@/components/admin/AdminChrome";
import { TestimonialsManager } from "@/components/admin/TestimonialsManager";
import { PermissionGate } from "@/components/admin/PermissionGate";
import { requireStaffOrNotFound } from "@/server/session";
import { listAdminTestimonials } from "@/server/testimonials";

export const dynamic = "force-dynamic";

export default async function AdminTestimonialsPage() {
  const user = await requireStaffOrNotFound();
  if (!user.permissions.has("testimonials.manage")) {
    return (
      <div className="space-y-6">
        <PageHead title="Testimonials" />
        <PermissionGate permission="testimonials.manage" />
      </div>
    );
  }

  const rows = await listAdminTestimonials();
  const live = rows.filter((r) => r.isVisible && !r.archivedAt).length;

  return (
    <div className="space-y-6">
      <PageHead
        title="Testimonials"
        meta={`${rows.length} screenshot${rows.length === 1 ? "" : "s"}, ${live} showing on the home page.`}
      />
      <TestimonialsManager rows={rows} />
    </div>
  );
}
