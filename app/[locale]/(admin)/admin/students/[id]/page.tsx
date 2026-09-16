import { notFound } from "next/navigation";
import { Link } from "../../../../../../i18n/navigation";
import { ArrowLeft, Mail, Phone } from "lucide-react";

import { PageHead, Panel } from "@/components/admin/AdminChrome";
import { NotesPanel } from "@/components/admin/NotesPanel";
import { ENTITLEMENT_TONE, StatusPill } from "@/components/admin/StatusPill";
import { PermissionGate } from "@/components/admin/PermissionGate";
import { hasPermission, requireStaffOrNotFound } from "@/server/session";
import { getStudent } from "@/server/admin";
import { listNotes } from "@/server/notes";
import { formatPhone } from "@/lib/phone";

export const dynamic = "force-dynamic";

/**
 * One student.
 *
 * Built for the notes panel, which needed somewhere to live: the students
 * table is a row per entitlement and has no room for a conversation. What is
 * here is what someone about to phone this person needs, and nothing else.
 */
export default async function AdminStudentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireStaffOrNotFound();
  if (!user.permissions.has("students.view")) {
    return (
      <div className="space-y-6">
        <PageHead title="Student Details" />
        <PermissionGate permission="students.view" />
      </div>
    );
  }

  const { id } = await params;

  const student = await getStudent(id);
  if (!student) notFound();

  const [canManage, notes] = await Promise.all([
    hasPermission("students.manage"),
    listNotes("student", id),
  ]);

  const facts = [
    { label: "Email", value: student.email, icon: Mail },
    student.phone
      ? { label: "Phone", value: formatPhone(student.phone), icon: Phone }
      : null,
  ].filter(Boolean) as { label: string; value: string; icon: typeof Mail }[];

  return (
    <div className="space-y-6">
      <Link
        href="/admin/students"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5 rtl:-scale-x-100" aria-hidden="true" />
        All students
      </Link>

      <PageHead
        title={student.fullName ?? student.name}
        meta={
          <>
            Signed up{" "}
            {student.createdAt.toLocaleDateString("en-GB", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
            . Account is {student.state.replace("_", " ")}.
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <Panel title="Access" padded={false}>
            {student.entitlements.length === 0 ? (
              <p className="px-4 py-6 text-sm text-muted-foreground">
                Nothing granted yet. They see the on-hold screen.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {student.entitlements.map((row) => {
                  // Same rule as the LMS: a date in the past wins over the
                  // stored status.
                  const effective = row.isExpired ? "expired" : row.status;
                  return (
                    <li
                      key={row.id}
                      className="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-4 py-3"
                    >
                      <StatusPill tone={ENTITLEMENT_TONE[effective] ?? "halted"}>
                        {effective}
                      </StatusPill>
                      <span className="text-sm font-medium">
                        {row.packageTitleEn ?? "Package removed"}
                      </span>
                      <span className="figures ms-auto text-xs text-muted-foreground">
                        {row.expiresAt
                          ? `until ${row.expiresAt.toLocaleDateString("en-GB", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}`
                          : "unlimited"}
                        {" · via "}
                        {row.source}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>

          {canManage && (
            <NotesPanel subjectType="student" subjectId={student.userId} notes={notes} />
          )}
        </div>

        <Panel title="Contact">
          <dl className="space-y-3 text-sm">
            {facts.map((fact) => (
              <div key={fact.label}>
                <dt className="text-xs text-muted-foreground">{fact.label}</dt>
                <dd className="mt-0.5 flex items-center gap-1.5">
                  <fact.icon
                    className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
                    aria-hidden="true"
                  />
                  {/* Phone numbers stay LTR inside an RTL page. */}
                  <bdi dir="ltr">{fact.value}</bdi>
                </dd>
              </div>
            ))}
            {student.level && (
              <div>
                <dt className="text-xs text-muted-foreground">Year</dt>
                <dd className="mt-0.5">{student.level}</dd>
              </div>
            )}
          </dl>
        </Panel>
      </div>
    </div>
  );
}
