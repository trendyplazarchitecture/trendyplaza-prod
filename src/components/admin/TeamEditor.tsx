"use client";

import { useMemo, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "../../../i18n/navigation";
import {
  ArchiveRestore,
  ArrowUpDown,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Edit3,
  Loader2,
  Search,
  Shield,
  ShieldAlert,
  ShieldQuestion,
  SlidersHorizontal,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { setUserPermissionsAction } from "@/server/actions/team";
import { restoreUserAction } from "@/server/actions/accounts";
import { reviewStaffAccessRequestAction } from "@/server/actions/access-requests";
import type { PendingStaffAccessRequest } from "@/server/access-requests";
import type { RolePresetRecord } from "@/server/roles";
import { Empty } from "./AdminChrome";
import { AccountCreator } from "./AccountCreator";
import { TeamMemberActions } from "./TeamMemberActions";
import { RolePresetsManager, ROLE_COLOR_STYLES } from "./RolePresetsManager";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  PERMISSION_DETAILS,
  PERMISSION_GROUPS,
  type Permission,
} from "@/lib/permissions";
import { cn } from "@/lib/utils";

export type StaffRow = {
  id: string;
  name: string;
  email: string;
  permissions: Permission[];
  state: "on_hold" | "active" | "suspended";
  archivedAt?: Date | null;
  awaitingSetup: boolean;
};

export type CandidateRow = { id: string; name: string; email: string };

type TabKey = "staff" | "requests" | "presets" | "candidates" | "trash";

/**
 * The unified team permission and access control console.
 *
 * Organized with top-level tabs matching the Orders filter style,
 * with search, sorting, and pagination for candidate accounts.
 */
export function TeamEditor({
  staff,
  archivedStaff = [],
  candidates,
  accessRequests = [],
  rolePresets = [],
  currentUserId,
}: {
  staff: StaffRow[];
  archivedStaff?: StaffRow[];
  candidates: CandidateRow[];
  accessRequests?: PendingStaffAccessRequest[];
  rolePresets?: RolePresetRecord[];
  currentUserId: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialTab = (searchParams.get("tab") as TabKey) || "staff";
  const [activeTab, setActiveTab] = useState<TabKey>(
    ["staff", "requests", "presets", "candidates", "trash"].includes(initialTab) ? initialTab : "staff",
  );

  const [openId, setOpenId] = useState<string | null>(null);
  const [staffSearch, setStaffSearch] = useState("");

  // Candidate section state: search, sorting, pagination
  const [candidateSearch, setCandidateSearch] = useState("");
  const [candidateSort, setCandidateSort] = useState<"name_asc" | "name_desc" | "email_asc">("name_asc");
  const [candidatePage, setCandidatePage] = useState(1);
  const PAGE_SIZE = 8;

  // Filtered active staff
  const filteredStaff = useMemo(() => {
    const q = staffSearch.trim().toLowerCase();
    if (!q) return staff;
    return staff.filter(
      (m) => m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q),
    );
  }, [staff, staffSearch]);

  // Filtered and sorted candidates
  const processedCandidates = useMemo(() => {
    const q = candidateSearch.trim().toLowerCase();
    let list = candidates;
    if (q) {
      list = list.filter(
        (c) => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q),
      );
    }
    return [...list].sort((a, b) => {
      if (candidateSort === "name_desc") return b.name.localeCompare(a.name);
      if (candidateSort === "email_asc") return a.email.localeCompare(b.email);
      return a.name.localeCompare(b.name);
    });
  }, [candidates, candidateSearch, candidateSort]);

  const totalCandidatePages = Math.max(1, Math.ceil(processedCandidates.length / PAGE_SIZE));
  const paginatedCandidates = useMemo(() => {
    const start = (candidatePage - 1) * PAGE_SIZE;
    return processedCandidates.slice(start, start + PAGE_SIZE);
  }, [processedCandidates, candidatePage]);

  function switchTab(tab: TabKey) {
    setActiveTab(tab);
    const sp = new URLSearchParams(searchParams.toString());
    sp.set("tab", tab);
    router.replace(`/admin/team?${sp.toString()}`, { scroll: false });
  }

  return (
    <div className="space-y-6">
      {/* ------------------------------------------------------------------ */}
      {/* Top Filter Tabs (Matching Orders Filter Styling)                   */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => switchTab("staff")}
            className={cn(
              "ui-dense inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors duration-150",
              activeTab === "staff"
                ? "border-foreground bg-foreground text-background"
                : "border-border bg-card text-muted-foreground hover:border-foreground/30 hover:text-foreground",
            )}
          >
            <Users className="h-3.5 w-3.5" aria-hidden="true" />
            Active Staff
            <span
              className={cn(
                "figures ms-1 rounded-full px-1.5 py-0.2 text-[10px] font-semibold",
                activeTab === "staff" ? "bg-background/20 text-background" : "bg-muted text-muted-foreground",
              )}
            >
              {staff.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => switchTab("requests")}
            className={cn(
              "ui-dense inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors duration-150",
              activeTab === "requests"
                ? "border-foreground bg-foreground text-background"
                : "border-border bg-card text-muted-foreground hover:border-foreground/30 hover:text-foreground",
            )}
          >
            <ShieldQuestion className="h-3.5 w-3.5" aria-hidden="true" />
            Access Requests
            {accessRequests.length > 0 ? (
              <span className="figures ms-1 rounded-full bg-destructive px-1.5 py-0.2 text-[10px] font-bold text-destructive-foreground animate-pulse">
                {accessRequests.length}
              </span>
            ) : (
              <span
                className={cn(
                  "figures ms-1 rounded-full px-1.5 py-0.2 text-[10px] font-semibold",
                  activeTab === "requests" ? "bg-background/20 text-background" : "bg-muted text-muted-foreground",
                )}
              >
                0
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => switchTab("presets")}
            className={cn(
              "ui-dense inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors duration-150",
              activeTab === "presets"
                ? "border-foreground bg-foreground text-background"
                : "border-border bg-card text-muted-foreground hover:border-foreground/30 hover:text-foreground",
            )}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
            Role Presets
            <span
              className={cn(
                "figures ms-1 rounded-full px-1.5 py-0.2 text-[10px] font-semibold",
                activeTab === "presets" ? "bg-background/20 text-background" : "bg-muted text-muted-foreground",
              )}
            >
              {rolePresets.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => switchTab("candidates")}
            className={cn(
              "ui-dense inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors duration-150",
              activeTab === "candidates"
                ? "border-foreground bg-foreground text-background"
                : "border-border bg-card text-muted-foreground hover:border-foreground/30 hover:text-foreground",
            )}
          >
            <UserPlus className="h-3.5 w-3.5" aria-hidden="true" />
            No Access Users
            <span
              className={cn(
                "figures ms-1 rounded-full px-1.5 py-0.2 text-[10px] font-semibold",
                activeTab === "candidates" ? "bg-background/20 text-background" : "bg-muted text-muted-foreground",
              )}
            >
              {candidates.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => switchTab("trash")}
            className={cn(
              "ui-dense inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors duration-150",
              activeTab === "trash"
                ? "border-foreground bg-foreground text-background"
                : "border-border bg-card text-muted-foreground hover:border-foreground/30 hover:text-foreground",
            )}
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            Trash
            <span
              className={cn(
                "figures ms-1 rounded-full px-1.5 py-0.2 text-[10px] font-semibold",
                activeTab === "trash" ? "bg-background/20 text-background" : "bg-muted text-muted-foreground",
              )}
            >
              {archivedStaff.length}
            </span>
          </button>
        </div>

        {activeTab === "staff" && <AccountCreator presets={rolePresets} />}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* TAB 1: ACTIVE STAFF                                                */}
      {/* ------------------------------------------------------------------ */}
      {activeTab === "staff" && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute start-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Filter active team by name or email..."
                value={staffSearch}
                onChange={(e) => setStaffSearch(e.target.value)}
                className="h-9 ps-9 text-xs"
              />
            </div>
            <span className="text-xs text-muted-foreground">
              {filteredStaff.length} of {staff.length} staff shown
            </span>
          </div>

          {filteredStaff.length === 0 ? (
            <div className="rounded-lg border border-border bg-card p-6">
              <Empty
                title="No staff members found"
                hint={staffSearch ? "Try adjusting your search filter." : "Create an account to add team members."}
              />
            </div>
          ) : (
            <ul className="space-y-2">
              {filteredStaff.map((member) => {
                const memberPermSet = new Set(member.permissions);
                const matchedPreset = rolePresets.find(
                  (p) =>
                    p.permissions.length === member.permissions.length &&
                    p.permissions.every((perm) => memberPermSet.has(perm)),
                );
                const colorStyle = matchedPreset
                  ? ROLE_COLOR_STYLES[matchedPreset.color] ?? ROLE_COLOR_STYLES.blue
                  : null;

                return (
                  <li key={member.id} className="rounded-lg border border-border bg-card">
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => setOpenId(openId === member.id ? null : member.id)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          setOpenId(openId === member.id ? null : member.id);
                        }
                      }}
                      aria-expanded={openId === member.id}
                      className="flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-start"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-medium">{member.name}</span>
                          {member.id === currentUserId && (
                            <span className="rounded bg-muted px-1.5 py-0.2 text-[11px] font-normal text-muted-foreground">
                              you
                            </span>
                          )}
                          {matchedPreset && colorStyle && (
                            <span
                              className={cn(
                                "rounded border px-2 py-0.5 text-[11px] font-semibold",
                                colorStyle.badgeClass,
                              )}
                            >
                              {matchedPreset.name}
                            </span>
                          )}
                        </span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          <bdi dir="ltr">{member.email}</bdi>
                          {member.state === "suspended" && (
                            <span className="ms-2 font-semibold text-primary-press">
                              deactivated
                            </span>
                          )}
                          {member.awaitingSetup && (
                            <span className="ms-2 text-amber-700 dark:text-amber-400">
                              setup link pending
                            </span>
                          )}
                        </span>
                      </span>

                      <TeamMemberActions
                        userId={member.id}
                        name={member.name}
                        state={member.state}
                        isSelf={member.id === currentUserId}
                      />

                      <span className="figures shrink-0 text-xs text-muted-foreground">
                        {member.permissions.length} / {PERMISSION_GROUPS.flatMap((g) => g.permissions).length} perms
                      </span>

                      <ChevronDown
                        className={cn(
                          "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                          openId === member.id && "rotate-180",
                        )}
                        aria-hidden="true"
                      />
                    </div>

                    {openId === member.id && (
                      <PermissionForm
                        member={member}
                        isSelf={member.id === currentUserId}
                        rolePresets={rolePresets}
                        onDone={() => setOpenId(null)}
                      />
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* TAB 2: ACCESS REQUESTS                                             */}
      {/* ------------------------------------------------------------------ */}
      {activeTab === "requests" && (
        <section className="space-y-4">
          <div>
            <h2 className="text-sm font-semibold tracking-tight">Staff Access Requests</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Team members who attempted to open a restricted admin section and clicked &ldquo;Request Access from Admin&rdquo;.
            </p>
          </div>

          {accessRequests.length === 0 ? (
            <div className="rounded-lg border border-border bg-card p-6">
              <Empty
                title="No pending access requests"
                hint="When team members request permission to access gated sections, their requests will appear here for review."
              />
            </div>
          ) : (
            <ul className="divide-y divide-border/60 rounded-lg border border-border bg-card">
              {accessRequests.map((req) => (
                <AccessRequestRowItem key={req.id} req={req} />
              ))}
            </ul>
          )}
        </section>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* TAB 3: ROLE PRESETS (FULL CRUD)                                   */}
      {/* ------------------------------------------------------------------ */}
      {activeTab === "presets" && <RolePresetsManager presets={rolePresets} />}

      {/* ------------------------------------------------------------------ */}
      {/* TAB 4: ACCOUNTS WITH NO ACCESS (CANDIDATES)                        */}
      {/* ------------------------------------------------------------------ */}
      {activeTab === "candidates" && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold tracking-tight">Accounts with no access</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Registered users without staff roles. Assign a role preset to bring them onto the team.
              </p>
            </div>
          </div>

          {/* Search and Sort Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card p-3">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute start-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search candidates by name or email..."
                value={candidateSearch}
                onChange={(e) => {
                  setCandidateSearch(e.target.value);
                  setCandidatePage(1);
                }}
                className="h-8 ps-8 text-xs"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <ArrowUpDown className="h-3 w-3" /> Sort:
              </span>
              <select
                value={candidateSort}
                onChange={(e) => {
                  setCandidateSort(e.target.value as any);
                  setCandidatePage(1);
                }}
                className="h-8 rounded-md border border-border bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="name_asc">Name (A → Z)</option>
                <option value="name_desc">Name (Z → A)</option>
                <option value="email_asc">Email (A → Z)</option>
              </select>
            </div>
          </div>

          {processedCandidates.length === 0 ? (
            <div className="rounded-lg border border-border bg-card p-6">
              <Empty
                title="Nobody found"
                hint={candidateSearch ? "No users match your search query." : "Everyone who has signed up already holds permissions."}
              />
            </div>
          ) : (
            <>
              <ul className="space-y-2">
                {paginatedCandidates.map((candidate) => (
                  <li
                    key={candidate.id}
                    className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card px-4 py-3"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium">{candidate.name}</span>
                      <span className="block text-xs text-muted-foreground">
                        <bdi dir="ltr">{candidate.email}</bdi>
                      </span>
                    </span>
                    <PromoteButtons userId={candidate.id} rolePresets={rolePresets} />
                  </li>
                ))}
              </ul>

              {/* Pagination Controls */}
              {totalCandidatePages > 1 && (
                <div className="flex items-center justify-between border-t border-border pt-3">
                  <span className="text-xs text-muted-foreground">
                    Showing {(candidatePage - 1) * PAGE_SIZE + 1}–
                    {Math.min(candidatePage * PAGE_SIZE, processedCandidates.length)} of{" "}
                    {processedCandidates.length} accounts
                  </span>
                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={candidatePage <= 1}
                      onClick={() => setCandidatePage((p) => Math.max(1, p - 1))}
                      className="h-8 gap-1 px-2.5 text-xs"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" /> Prev
                    </Button>
                    <span className="px-2 text-xs font-semibold">
                      {candidatePage} / {totalCandidatePages}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={candidatePage >= totalCandidatePages}
                      onClick={() => setCandidatePage((p) => Math.min(totalCandidatePages, p + 1))}
                      className="h-8 gap-1 px-2.5 text-xs"
                    >
                      Next <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* TAB 5: TRASH (ARCHIVED USERS)                                      */}
      {/* ------------------------------------------------------------------ */}
      {activeTab === "trash" && (
        <section className="space-y-4">
          <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4">
            <div className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              <h2 className="text-sm font-semibold tracking-tight">
                Trash ({archivedStaff.length} accounts)
              </h2>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              These accounts are deactivated and their permissions are revoked. They will be permanently purged after 30 days.
            </p>
          </div>

          {archivedStaff.length === 0 ? (
            <div className="rounded-lg border border-border bg-card p-6">
              <Empty
                title="The trash is empty"
                hint="Deleted staff accounts will appear here and can be restored before the 30-day permanent deletion."
              />
            </div>
          ) : (
            <ul className="space-y-2">
              {archivedStaff.map((archived) => (
                <ArchivedMemberRow key={archived.id} member={archived} />
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}

function AccessRequestRowItem({ req }: { req: PendingStaffAccessRequest }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const detail = PERMISSION_DETAILS[req.permission as Permission];

  function handleReview(approved: boolean) {
    startTransition(async () => {
      const res = await reviewStaffAccessRequestAction({ requestId: req.id, approved });
      if (res.ok) {
        toast.success(res.message);
        router.refresh();
      } else {
        toast.error(res.message);
      }
    });
  }

  function relativeTime(date: Date) {
    const mins = Math.round((Date.now() - new Date(date).getTime()) / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.round(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.round(hours / 24)}d ago`;
  }

  return (
    <li className="flex flex-wrap items-center justify-between gap-4 p-3.5 sm:p-4">
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-sm">{req.userName}</span>
          <span className="text-xs text-muted-foreground">
            <bdi dir="ltr">({req.userEmail})</bdi>
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded bg-primary/10 px-2 py-0.5 font-semibold text-primary-press">
            {detail?.labelEn ?? req.permission}
          </span>
          <span className="font-mono text-[11px] text-muted-foreground">
            [{req.permission}]
          </span>
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Clock className="h-3 w-3" aria-hidden="true" />
            {relativeTime(req.createdAt)}
          </span>
        </div>

        {req.note && (
          <p className="text-xs italic text-muted-foreground">
            &ldquo;{req.note}&rdquo;
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <Button
          size="sm"
          variant="outline"
          disabled={isPending}
          onClick={() => handleReview(false)}
          className="gap-1 text-xs text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
          Deny
        </Button>

        <Button
          size="sm"
          disabled={isPending}
          onClick={() => handleReview(true)}
          className="gap-1 text-xs bg-emerald-600 font-medium text-white hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500"
        >
          {isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
          ) : (
            <Check className="h-3.5 w-3.5" aria-hidden="true" />
          )}
          Accept &amp; Grant
        </Button>
      </div>
    </li>
  );
}

function ArchivedMemberRow({ member }: { member: StaffRow }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleRestore() {
    startTransition(async () => {
      const res = await restoreUserAction({ userId: member.id });
      if (res.ok) {
        toast.success(res.message);
        router.refresh();
      } else {
        toast.error(res.message);
      }
    });
  }

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium line-through text-muted-foreground">
            {member.name}
          </span>
          <span className="rounded bg-destructive/10 px-1.5 py-0.5 text-[10px] font-semibold text-destructive">
            In Trash
          </span>
        </div>
        <span className="block text-xs text-muted-foreground">
          <bdi dir="ltr">{member.email}</bdi>
        </span>
      </div>

      <Button
        size="sm"
        variant="outline"
        disabled={isPending}
        onClick={handleRestore}
        className="gap-1.5 text-xs text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
      >
        {isPending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
        ) : (
          <ArchiveRestore className="h-3.5 w-3.5" aria-hidden="true" />
        )}
        Restore User
      </Button>
    </li>
  );
}

function PermissionForm({
  member,
  isSelf,
  rolePresets = [],
  onDone,
}: {
  member: StaffRow;
  isSelf: boolean;
  rolePresets?: RolePresetRecord[];
  onDone: () => void;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [held, setHeld] = useState<Set<Permission>>(new Set(member.permissions));

  function toggle(permission: Permission, on: boolean) {
    setHeld((previous) => {
      const next = new Set(previous);
      if (on) next.add(permission);
      else next.delete(permission);
      return next;
    });
  }

  function save() {
    start(async () => {
      const result = await setUserPermissionsAction({
        userId: member.id,
        permissions: [...held],
      });
      toast[result.ok ? "success" : "error"](result.message);
      if (result.ok) {
        router.refresh();
        onDone();
      }
    });
  }

  return (
    <div className="border-t border-border px-4 py-4">
      {/* Preset Quick Picks */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="me-1 text-xs font-semibold text-muted-foreground">Quick Presets:</span>
        {rolePresets.map((p) => {
          const style = ROLE_COLOR_STYLES[p.color] ?? ROLE_COLOR_STYLES.blue;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setHeld(new Set(p.permissions))}
              className="ui-dense inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
            >
              <span className={cn("h-2 w-2 rounded-full", style.dotClass)} />
              {p.name}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => setHeld(new Set())}
          className="ui-dense rounded-md border border-destructive/30 px-2.5 py-1 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10"
        >
          Clear all
        </button>
      </div>

      {/* Permission Groups with Human-Readable Labels */}
      <div className="mt-5 grid gap-x-8 gap-y-6 sm:grid-cols-2">
        {PERMISSION_GROUPS.map((group) => (
          <fieldset key={group.key} className="rounded-lg border border-border/60 bg-muted/20 p-3">
            <legend className="px-1 text-[11px] font-bold tracking-wider text-foreground uppercase">
              {group.labelEn}
            </legend>
            <div className="mt-2 space-y-2.5">
              {group.permissions.map((permission) => {
                const detail = PERMISSION_DETAILS[permission];
                const locked = isSelf && permission === "users.manage";

                return (
                  <label
                    key={permission}
                    className={cn(
                      "flex items-start gap-2.5 text-sm cursor-pointer hover:text-foreground",
                      locked && "opacity-60 cursor-not-allowed",
                    )}
                  >
                    <Checkbox
                      checked={held.has(permission)}
                      disabled={locked}
                      onCheckedChange={(value) => toggle(permission, value === true)}
                      className="mt-0.5"
                    />
                    <div className="min-w-0">
                      <span className="block font-medium text-xs text-foreground">
                        {detail?.labelEn ?? permission}
                      </span>
                      <span className="block text-[11px] text-muted-foreground">
                        {detail?.description}
                      </span>
                    </div>
                  </label>
                );
              })}
            </div>
          </fieldset>
        ))}
      </div>

      <div className="mt-6 flex items-center gap-2">
        <Button size="sm" onClick={save} disabled={pending} className="gap-1.5">
          {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />}
          Save permissions
        </Button>
        <Button size="sm" variant="ghost" onClick={onDone} disabled={pending}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

function PromoteButtons({
  userId,
  rolePresets = [],
}: {
  userId: string;
  rolePresets?: RolePresetRecord[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function promote(preset: RolePresetRecord) {
    start(async () => {
      const result = await setUserPermissionsAction({
        userId,
        permissions: preset.permissions,
      });
      toast[result.ok ? "success" : "error"](result.message);
      if (result.ok) router.refresh();
    });
  }

  // Show up to 4 quick promote presets
  const displayPresets = rolePresets.slice(0, 4);

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />}
      {displayPresets.map((preset) => {
        const style = ROLE_COLOR_STYLES[preset.color] ?? ROLE_COLOR_STYLES.blue;
        return (
          <button
            key={preset.id}
            type="button"
            disabled={pending}
            onClick={() => promote(preset)}
            className="ui-dense inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-xs font-medium transition-colors hover:border-foreground/30 hover:bg-paper disabled:opacity-50"
          >
            <span className={cn("h-2 w-2 rounded-full", style.dotClass)} />
            {preset.name}
          </button>
        );
      })}
    </div>
  );
}
