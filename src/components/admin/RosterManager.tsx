"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { toast } from "sonner";

import {
  archiveRosterMemberAction,
  purgeRosterMemberAction,
  reorderRosterMembersAction,
  restoreRosterMemberAction,
  saveRosterMemberAction,
  setRosterMemberVisibleAction,
  type ActionResult,
} from "@/server/actions/roster";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { TriLingualField } from "./TriLingual";
import { rosterImageUrl } from "@/lib/media";
import { cn } from "@/lib/utils";

export type RosterRow = {
  id: string;
  name: string;
  roleEn: string;
  roleAr: string | null;
  roleFr: string | null;
  imagePath: string;
  isVisible: boolean;
  position: number;
  archivedAt: Date | null;
};

/**
 * "Meet the team". Add and edit share one dialog, the way `TeamMemberActions`
 * uses one for renaming: a form that opens in place, rather than appended
 * below a grid that can already be several rows tall, which is where the
 * previous inline form went to disappear.
 */
export function RosterManager({ rows }: { rows: RosterRow[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [order, setOrder] = useState(rows.filter((r) => !r.archivedAt));
  const archived = rows.filter((r) => r.archivedAt);
  const [editing, setEditing] = useState<RosterRow | "new" | null>(null);
  const [deleting, setDeleting] = useState<RosterRow | null>(null);
  const [purging, setPurging] = useState<RosterRow | null>(null);

  function act(fn: () => Promise<ActionResult>) {
    startTransition(async () => {
      try {
        const result = await fn();
        if (result.ok) {
          toast.success(result.message);
          setEditing(null);
          router.refresh();
        } else {
          toast.error(result.message);
        }
      } catch {
        toast.error("That did not go through. Try again.");
      }
    });
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    if (editing && editing !== "new") form.set("id", editing.id);
    act(() => saveRosterMemberAction(form));
  }

  function move(index: number, by: -1 | 1) {
    const next = [...order];
    const target = index + by;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setOrder(next);
    act(() => reorderRosterMembersAction({ memberIds: next.map((r) => r.id) }));
  }

  const current = editing !== "new" ? editing : null;

  return (
    <div className="space-y-6">
      <Button type="button" size="sm" className="gap-1.5" onClick={() => setEditing("new")}>
        <Plus className="h-3.5 w-3.5" aria-hidden="true" />
        Add a team member
      </Button>

      {order.length === 0 ? (
        <p className="rounded-md border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground">
          Nobody yet. Add a team member above and they appear on the about page.
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {order.map((row, index) => {
            const url = rosterImageUrl(row.imagePath);
            return (
              <li
                key={row.id}
                className={cn(
                  "group overflow-hidden rounded-xl border border-border bg-background shadow-sm transition-shadow hover:shadow-md",
                  !row.isVisible && "opacity-50",
                )}
              >
                <div className="aspect-square w-full overflow-hidden bg-paper">
                  {url ? (
                    <img src={url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <UserRound className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
                    </div>
                  )}
                </div>
                <div className="p-3 text-center">
                  <p className="truncate text-sm font-semibold">{row.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{row.roleEn}</p>
                </div>
                <div className="flex items-center justify-between border-t border-border px-1 py-1">
                  <div className="flex">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      disabled={isPending || index === 0}
                      aria-label={`Move ${row.name} earlier`}
                      onClick={() => move(index, -1)}
                    >
                      <ArrowLeft className="h-3.5 w-3.5 rtl:-scale-x-100" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      disabled={isPending || index === order.length - 1}
                      aria-label={`Move ${row.name} later`}
                      onClick={() => move(index, 1)}
                    >
                      <ArrowRight className="h-3.5 w-3.5 rtl:-scale-x-100" />
                    </Button>
                  </div>
                  <div className="flex">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      disabled={isPending}
                      aria-label={row.isVisible ? "Hide from the about page" : "Show on the about page"}
                      onClick={() =>
                        act(() =>
                          setRosterMemberVisibleAction({
                            memberId: row.id,
                            isVisible: !row.isVisible,
                          }),
                        )
                      }
                    >
                      {row.isVisible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      aria-label={`Edit ${row.name}`}
                      onClick={() => setEditing(row)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-primary-press"
                      disabled={isPending}
                      aria-label={`Delete ${row.name}`}
                      onClick={() => setDeleting(row)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {archived.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Deleted</p>
          <ul className="mt-2 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {archived.map((row) => {
              const url = rosterImageUrl(row.imagePath);
              return (
                <li key={row.id} className="overflow-hidden rounded-xl border border-border bg-background opacity-60">
                  <div className="aspect-square w-full overflow-hidden bg-paper">
                    {url && <img src={url} alt="" className="h-full w-full object-cover" />}
                  </div>
                  <div className="p-3 text-center">
                    <p className="truncate text-sm font-medium">{row.name}</p>
                  </div>
                  <div className="flex items-center justify-center gap-1 border-t border-border px-1 py-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      disabled={isPending}
                      aria-label={`Restore ${row.name}`}
                      onClick={() => act(() => restoreRosterMemberAction({ memberId: row.id }))}
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-primary-press"
                      disabled={isPending}
                      aria-label={`Delete ${row.name} forever`}
                      onClick={() => setPurging(row)}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{current ? `Edit ${current.name}` : "New team member"}</DialogTitle>
            <DialogDescription>Shown on the about page, under &ldquo;Meet the team&rdquo;.</DialogDescription>
          </DialogHeader>

          <form onSubmit={submit} className="space-y-4" encType="multipart/form-data">
            <div className="space-y-1.5">
              <Label htmlFor="roster-name">Name</Label>
              <Input id="roster-name" name="name" required minLength={2} defaultValue={current?.name ?? ""} />
            </div>

            <TriLingualField
              name="role"
              label="Role"
              values={{ En: current?.roleEn, Ar: current?.roleAr, Fr: current?.roleFr }}
            />

            <div className="space-y-1.5">
              <Label htmlFor="roster-image">{current ? "Replace photo" : "Photo"}</Label>
              <Input id="roster-image" name="image" type="file" accept="image/*" required={!current} />
              <p className="text-xs text-muted-foreground">
                Converted to WebP and capped at 2000px on the way in.
              </p>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditing(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleting !== null} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleting?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              They come off the about page immediately. Nothing is removed, so this can
              still be undone from the deleted list below.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep them</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!deleting) return;
                setOrder(order.filter((r) => r.id !== deleting.id));
                act(() => archiveRosterMemberAction({ memberId: deleting.id }));
                setDeleting(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={purging !== null} onOpenChange={(open) => !open && setPurging(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {purging?.name} forever?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the row for good. There is no further undo after this one.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!purging) return;
                act(() => purgeRosterMemberAction({ memberId: purging.id }));
                setPurging(null);
              }}
            >
              Delete forever
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
