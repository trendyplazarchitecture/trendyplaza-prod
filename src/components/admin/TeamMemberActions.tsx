"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArchiveRestore,
  Copy,
  Loader2,
  MoreHorizontal,
  Pencil,
  RotateCcw,
  Trash2,
  UserMinus,
} from "lucide-react";
import { toast } from "sonner";

import {
  archiveUserAction,
  reissueInviteAction,
  restoreUserAction,
  setAccountStateAction,
  updateAccountAction,
} from "@/server/actions/accounts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function TeamMemberActions({
  userId,
  name,
  state,
  isArchived = false,
  isSelf,
}: {
  userId: string;
  name: string;
  state: "on_hold" | "active" | "suspended";
  isArchived?: boolean;
  isSelf: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [renaming, setRenaming] = useState(false);
  const [confirmingTrash, setConfirmingTrash] = useState(false);

  function run(fn: () => Promise<{ ok: boolean; message: string }>) {
    startTransition(async () => {
      const result = await fn();
      if (result.ok) {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  function handleArchive() {
    startTransition(async () => {
      const result = await archiveUserAction({ userId });
      if (result.ok) {
        toast.success(result.message);
        setConfirmingTrash(false);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  function handleRestore() {
    startTransition(async () => {
      const result = await restoreUserAction({ userId });
      if (result.ok) {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            disabled={isPending}
            aria-label={`Actions for ${name}`}
            onClick={(e) => e.stopPropagation()}
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MoreHorizontal className="h-4 w-4" />
            )}
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-56">
          {isArchived ? (
            <DropdownMenuItem onSelect={handleRestore} className="text-emerald-600 focus:text-emerald-600">
              <ArchiveRestore className="h-4 w-4" aria-hidden="true" />
              Restore from Trash
            </DropdownMenuItem>
          ) : (
            <>
              <DropdownMenuItem onSelect={() => setRenaming(true)}>
                <Pencil className="h-4 w-4" aria-hidden="true" />
                Rename
              </DropdownMenuItem>

              <DropdownMenuItem
                onSelect={() =>
                  startTransition(async () => {
                    const result = await reissueInviteAction({ userId });
                    if (result.ok) {
                      const link = `${window.location.origin}${result.setupPath}`;
                      await navigator.clipboard.writeText(link).catch(() => {});
                      toast.success("New link copied to the clipboard. Send it to them.");
                      router.refresh();
                    } else {
                      toast.error(result.message);
                    }
                  })
                }
              >
                <Copy className="h-4 w-4" aria-hidden="true" />
                New password link
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              {state === "suspended" ? (
                <DropdownMenuItem
                  onSelect={() => run(() => setAccountStateAction({ userId, state: "active" }))}
                >
                  <RotateCcw className="h-4 w-4" aria-hidden="true" />
                  Reactivate
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  disabled={isSelf}
                  onSelect={() =>
                    run(() => setAccountStateAction({ userId, state: "suspended" }))
                  }
                >
                  <UserMinus className="h-4 w-4" aria-hidden="true" />
                  {isSelf ? "Cannot deactivate yourself" : "Deactivate"}
                </DropdownMenuItem>
              )}

              <DropdownMenuSeparator />

              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                disabled={isSelf}
                onSelect={() => setConfirmingTrash(true)}
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                {isSelf ? "Cannot delete yourself" : "Delete (Move to Trash)"}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Rename Dialog */}
      <Dialog open={renaming} onOpenChange={setRenaming}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Rename {name}</DialogTitle>
            <DialogDescription>
              The email address stays as it is: it is how they sign in.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              const value = String(new FormData(event.currentTarget).get("name") ?? "");
              startTransition(async () => {
                const result = await updateAccountAction({ userId, name: value });
                if (result.ok) {
                  toast.success(result.message);
                  setRenaming(false);
                  router.refresh();
                } else {
                  toast.error(result.message);
                }
              });
            }}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <Label htmlFor={`name-${userId}`}>Name</Label>
              <Input
                id={`name-${userId}`}
                name="name"
                defaultValue={name}
                required
                minLength={2}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setRenaming(false)}>
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

      {/* Delete / Move to Trash Confirmation Dialog */}
      <Dialog open={confirmingTrash} onOpenChange={setConfirmingTrash}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" aria-hidden="true" />
              Move &ldquo;{name}&rdquo; to Trash?
            </DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-2 pt-2 text-sm text-muted-foreground">
                <p>
                  This will immediately revoke all access permissions for this user and deactivate their account.
                </p>
                <p className="font-semibold text-destructive">
                  Account will be kept in the Trash and permanently deleted after 30 days.
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setConfirmingTrash(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={isPending}
              onClick={handleArchive}
              className="gap-1.5"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              Move to Trash
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
