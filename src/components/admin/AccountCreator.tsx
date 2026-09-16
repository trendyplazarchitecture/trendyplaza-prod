"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Copy, Link2, Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";

import { createAccountAction } from "@/server/actions/accounts";
import type { RolePresetRecord } from "@/server/roles";
import { ROLE_COLOR_STYLES } from "./RolePresetsManager";
import { type Permission } from "@/lib/permissions";
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
import { cn } from "@/lib/utils";

/**
 * Creating an account, decision D2.
 *
 * The admin fills in a name, an email and selects a role preset;
 * the system mints a single-use link and shows it once;
 * the invited person sets their own password.
 */
export function AccountCreator({
  presets = [],
}: {
  presets?: RolePresetRecord[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [selectedPresetId, setSelectedPresetId] = useState<string>(
    presets[0]?.id ?? "",
  );
  const [link, setLink] = useState<string | null>(null);

  const selectedPreset =
    presets.find((p) => p.id === selectedPresetId) ?? presets[0];

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    if (!selectedPreset) {
      toast.error("Please select a role preset.");
      return;
    }

    startTransition(async () => {
      const result = await createAccountAction({
        name: String(form.get("name") ?? ""),
        email: String(form.get("email") ?? ""),
        permissions: selectedPreset.permissions as Permission[],
      });

      if (result.ok) {
        setLink(`${window.location.origin}${result.setupPath}`);
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  function close() {
    setOpen(false);
    setLink(null);
  }

  return (
    <>
      <Button size="sm" className="gap-1.5 font-semibold" onClick={() => setOpen(true)}>
        <UserPlus className="h-3.5 w-3.5" aria-hidden="true" />
        New account
      </Button>

      <Dialog open={open} onOpenChange={(o) => (o ? setOpen(true) : close())}>
        <DialogContent className="max-w-lg max-h-[88vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-3 shrink-0 border-b border-border/40">
            <DialogTitle>New account</DialogTitle>
            <DialogDescription>
              You will get a single-use link to send them. They choose their own password, and
              nobody here ever sees it.
            </DialogDescription>
          </DialogHeader>

          {link ? (
            <div className="flex-1 overflow-y-auto scroll-thin p-6 space-y-4">
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
                <p className="flex items-center gap-1.5 text-sm font-semibold">
                  <Link2 className="h-4 w-4 text-primary" aria-hidden="true" />
                  Send them this setup link
                </p>
                <p className="figures mt-2 break-all rounded border border-border bg-card p-2 text-xs">
                  {link}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  It works once and expires in 72 hours. It is not stored anywhere you
                  can read it again, so copy it now; if it is lost, reissue a new one.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => {
                    navigator.clipboard.writeText(link);
                    toast.success("Link copied to clipboard.");
                  }}
                >
                  <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                  Copy
                </Button>
                <Button size="sm" onClick={close}>
                  Done
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={submit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto scroll-thin px-6 py-4 space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Full name</Label>
                  <Input id="name" name="name" required minLength={2} placeholder="e.g. Sarah Benali" />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="email">Email address</Label>
                  <Input id="email" name="email" type="email" required dir="ltr" placeholder="staff@example.com" />
                </div>

                <div className="space-y-2">
                  <Label>Role Preset &amp; Access Profile</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {presets.map((p) => {
                      const style = ROLE_COLOR_STYLES[p.color] ?? ROLE_COLOR_STYLES.blue;
                      const active = (selectedPreset?.id ?? "") === p.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setSelectedPresetId(p.id)}
                          aria-pressed={active}
                          className={cn(
                            "flex flex-col items-start rounded-lg border p-2.5 text-start transition-all",
                            active
                              ? "border-primary bg-primary/5 ring-1 ring-primary"
                              : "border-border hover:bg-muted/40",
                          )}
                        >
                          <div className="flex items-center gap-1.5">
                            <span className={cn("inline-block h-2 w-2 rounded-full", style.dotClass)} />
                            <span className="text-xs font-semibold text-foreground">
                              {p.name}
                            </span>
                          </div>
                          <span className="mt-1 line-clamp-2 text-[11px] text-muted-foreground">
                            {p.description || `Grants ${p.permissions.length} permissions`}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {selectedPreset && (
                    <div className="rounded-md border border-border/70 bg-muted/30 p-2.5 text-xs text-muted-foreground">
                      <p className="font-medium text-foreground">
                        Grants {selectedPreset.permissions.length} permissions by default.
                      </p>
                      <p className="mt-0.5 text-[11px]">
                        You can customize or fine-tune exact permissions per user at any time.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <DialogFooter className="px-6 py-3 border-t border-border bg-muted/20 shrink-0">
                <Button type="button" variant="outline" onClick={close}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending && (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  )}
                  Create and get setup link
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
