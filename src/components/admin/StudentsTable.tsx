"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Link } from "../../../i18n/navigation";
import { CalendarPlus, MoreHorizontal, Pause, Play, Ban, Trash2, RotateCcw } from "lucide-react";
import { toast } from "sonner";

import {
  deleteStudentAction,
  extendEntitlementAction,
  restoreStudentAction,
  setEntitlementStatusAction,
  type ActionResult,
} from "@/server/actions/access";
import { ENTITLEMENT_TONE, StatusPill } from "./StatusPill";
import { DataTable, type Column } from "./DataTable";
import { BulkBar } from "./BulkBar";
import { Empty } from "./AdminChrome";
import { CopyButton } from "./CopyButton";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

export type StudentRow = {
  userId: string;
  name: string;
  email: string;
  phone: string | null;
  level: string | null;
  state: string;
  entitlementId: string | null;
  entitlementStatus: string | null;
  expiresAt: Date | null;
  isExpired: boolean;
  packageTitle: string | null;
};

const STATE_LABEL: Record<string, string> = {
  on_hold: "On hold",
  active: "Active",
  suspended: "Suspended",
};

const ENTITLEMENT_LABEL: Record<string, string> = {
  active: "Reading",
  paused: "Paused",
  expired: "Expired",
  revoked: "Revoked",
};

export function StudentsTable({
  rows,
  canManage,
  canDelete,
  total,
  page,
  perPage,
  sort,
  direction,
}: {
  rows: StudentRow[];
  canManage: boolean;
  canDelete: boolean;
  total: number;
  page: number;
  perPage: number;
  sort: string;
  direction: "asc" | "desc";
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  function run(key: string, fn: () => Promise<ActionResult>) {
    setBusy(key);
    startTransition(async () => {
      try {
        const result = await fn();
        if (result.ok) {
          toast.success(result.message);
          router.refresh();
        } else {
          toast.error(result.message);
        }
      } catch {
        toast.error("That did not go through. Try again.");
      } finally {
        setBusy(null);
      }
    });
  }

  function toggleOne(userId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  }

  const selectedRows = rows.filter((r) => selected.has(r.userId));
  const selectedActive = selectedRows.filter((r) => r.state !== "suspended");
  const selectedSuspended = selectedRows.filter((r) => r.state === "suspended");

  function bulkSuspend() {
    const ids = selectedActive.map((r) => r.userId);
    startTransition(async () => {
      const results = await Promise.all(ids.map((userId) => deleteStudentAction({ userId })));
      const failed = results.filter((r) => !r.ok).length;
      if (failed === 0) toast.success("Deleted.");
      else toast.error(`${failed} of ${ids.length} did not go through.`);
      setSelected(new Set());
      router.refresh();
    });
  }

  function bulkRestore() {
    const ids = selectedSuspended.map((r) => r.userId);
    startTransition(async () => {
      const results = await Promise.all(ids.map((userId) => restoreStudentAction({ userId })));
      const failed = results.filter((r) => !r.ok).length;
      if (failed === 0) toast.success("Restored.");
      else toast.error(`${failed} of ${ids.length} did not go through.`);
      setSelected(new Set());
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      {canDelete && (
        <BulkBar count={selected.size} onClear={() => setSelected(new Set())}>
          {selectedActive.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 px-2 text-xs text-primary-press hover:text-primary-press"
              disabled={isPending}
              onClick={bulkSuspend}
            >
              <Trash2 className="h-3 w-3" />
              Delete {selectedActive.length}
            </Button>
          )}
          {selectedSuspended.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 gap-1 px-2 text-xs"
              disabled={isPending}
              onClick={bulkRestore}
            >
              <RotateCcw className="h-3 w-3" />
              Restore {selectedSuspended.length}
            </Button>
          )}
        </BulkBar>
      )}
      <DataTable<StudentRow>
      rows={rows}
      getKey={(row) => row.entitlementId ?? row.userId}
      total={total}
      page={page}
      perPage={perPage}
      sort={sort}
      direction={direction}
      minWidth="min-w-[820px]"
      empty={<Empty title="No students match" hint="Try a shorter search, or clear it." />}
      columns={([
        ...(canDelete
          ? [
              {
                header: (
                  <Checkbox
                    checked={rows.length > 0 && selected.size === rows.length}
                    onCheckedChange={() =>
                      setSelected((prev) =>
                        prev.size === rows.length ? new Set() : new Set(rows.map((r) => r.userId)),
                      )
                    }
                    aria-label="Select all students"
                  />
                ),
                cell: (row: StudentRow) => (
                  <Checkbox
                    checked={selected.has(row.userId)}
                    onCheckedChange={() => toggleOne(row.userId)}
                    aria-label={`Select ${row.name}`}
                  />
                ),
              } satisfies Column<StudentRow>,
            ]
          : []),
        {
          key: "name",
          header: "Student",
          cell: (row) => (
            <Link
              href={`/admin/students/${row.userId}`}
              className="group/name block"
            >
              <span className="flex items-center gap-1">
                <span className="font-medium group-hover/name:text-primary-press">
                  {row.name}
                </span>
                <CopyButton value={row.name} label="Copy the student's name" />
              </span>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <span className="truncate">{row.email}</span>
                <CopyButton value={row.email} label="Copy the email address" />
                {row.phone && (
                  <>
                    <span aria-hidden="true">{"\u00b7"}</span>
                    <bdi dir="ltr">{row.phone}</bdi>
                    <CopyButton value={row.phone} label="Copy the phone number" />
                  </>
                )}
              </span>
            </Link>
          ),
        },
        {
          key: "state",
          header: "Account",
          cell: (row) => (
            <>
              <StatusPill
                tone={
                  row.state === "active"
                    ? "done"
                    : row.state === "suspended"
                      ? "alert"
                      : "pending"
                }
              >
                {STATE_LABEL[row.state] ?? row.state}
              </StatusPill>
              {row.level && (
                <span className="ms-1.5 text-xs text-muted-foreground">{row.level}</span>
              )}
            </>
          ),
        },
        {
          key: "status",
          header: "Access",
          cell: (row) => {
            // An entitlement past its date reads as expired whatever the
            // stored status says, because that is how the LMS reads it too.
            const effective = row.isExpired ? "expired" : row.entitlementStatus;
            return effective ? (
              <>
                <StatusPill tone={ENTITLEMENT_TONE[effective] ?? "halted"}>
                  {ENTITLEMENT_LABEL[effective] ?? effective}
                </StatusPill>
                {row.packageTitle && (
                  <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                    {row.packageTitle}
                  </span>
                )}
              </>
            ) : (
              <span className="text-xs text-muted-foreground">No access yet</span>
            );
          },
        },
        {
          key: "expiresAt",
          header: "Expires",
          className: "figures text-muted-foreground",
          cell: (row) =>
            row.expiresAt
              ? row.expiresAt.toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })
              : row.entitlementId
                ? "Unlimited"
                : "\u2014",
        },
        {
          header: "",
          align: "end",
          cell: (row) => (
            <RowActions
              row={row}
              canManage={canManage}
              canDelete={canDelete}
              run={run}
              busy={busy}
              isPending={isPending}
            />
          ),
        },
      ] satisfies Column<StudentRow>[])}
      />
    </div>
  );
}

/**
 * The per-row menu, lifted out of the table body.
 *
 * `DataTable` takes a cell as a function, and a fifty-line dropdown inline in
 * an array literal is unreadable. Nothing about it changed.
 */
function RowActions({
  row,
  canManage,
  canDelete,
  run,
  busy,
  isPending,
}: {
  row: StudentRow;
  canManage: boolean;
  canDelete: boolean;
  run: (key: string, fn: () => Promise<ActionResult>) => void;
  busy: string | null;
  isPending: boolean;
}) {
  const key = row.entitlementId ?? row.userId;
  const working = busy === key && isPending;
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const showEntitlementActions = canManage && Boolean(row.entitlementId);
  if (!showEntitlementActions && !canDelete) return null;

  const deleted = row.state === "suspended";

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            disabled={working}
            aria-label={`Actions for ${row.name}`}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          {showEntitlementActions && (
            <>
              {row.entitlementStatus === "active" ? (
                <DropdownMenuItem
                  onSelect={() =>
                    run(key, () =>
                      setEntitlementStatusAction({
                        entitlementId: row.entitlementId!,
                        status: "paused",
                      }),
                    )
                  }
                >
                  <Pause className="h-4 w-4" aria-hidden="true" />
                  Pause access
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  onSelect={() =>
                    run(key, () =>
                      setEntitlementStatusAction({
                        entitlementId: row.entitlementId!,
                        status: "active",
                      }),
                    )
                  }
                >
                  <Play className="h-4 w-4" aria-hidden="true" />
                  Reopen access
                </DropdownMenuItem>
              )}

              {[30, 90, 180].map((days) => (
                <DropdownMenuItem
                  key={days}
                  onSelect={() =>
                    run(key, () =>
                      extendEntitlementAction({ entitlementId: row.entitlementId!, days }),
                    )
                  }
                >
                  <CalendarPlus className="h-4 w-4" aria-hidden="true" />
                  Extend {days} days
                </DropdownMenuItem>
              ))}

              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-primary-press focus:text-primary-press"
                onSelect={() =>
                  run(key, () =>
                    setEntitlementStatusAction({
                      entitlementId: row.entitlementId!,
                      status: "revoked",
                    }),
                  )
                }
              >
                <Ban className="h-4 w-4" aria-hidden="true" />
                Revoke access
              </DropdownMenuItem>
            </>
          )}

          {canDelete && (
            <>
              {showEntitlementActions && <DropdownMenuSeparator />}
              {deleted ? (
                <DropdownMenuItem
                  onSelect={() => run(key, () => restoreStudentAction({ userId: row.userId }))}
                >
                  <RotateCcw className="h-4 w-4" aria-hidden="true" />
                  Restore
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  className="text-primary-press focus:text-primary-press"
                  onSelect={() => setConfirmingDelete(true)}
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                  Delete
                </DropdownMenuItem>
              )}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Destructive and account-wide, so it confirms and names who it affects. */}
      <AlertDialog open={confirmingDelete} onOpenChange={setConfirmingDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {row.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              They will not be able to sign in again. Their orders, entitlements and
              activity history are kept, not removed &mdash; this can be undone from the
              same menu.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep them</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => run(key, () => deleteStudentAction({ userId: row.userId }))}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
