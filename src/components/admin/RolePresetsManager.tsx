"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Check,
  Edit2,
  Loader2,
  Plus,
  Shield,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import {
  createRolePresetAction,
  deleteRolePresetAction,
  updateRolePresetAction,
} from "@/server/actions/roles";
import type { RolePresetRecord } from "@/server/roles";
import {
  PERMISSION_DETAILS,
  PERMISSION_GROUPS,
  type Permission,
} from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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

export const ROLE_COLOR_STYLES: Record<
  string,
  {
    name: string;
    dotClass: string;
    badgeClass: string;
    borderClass: string;
    bgHoverClass: string;
  }
> = {
  purple: {
    name: "Purple",
    dotClass: "bg-purple-500",
    badgeClass: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30",
    borderClass: "hover:border-purple-500/40",
    bgHoverClass: "hover:bg-purple-500/5",
  },
  blue: {
    name: "Blue",
    dotClass: "bg-blue-500",
    badgeClass: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
    borderClass: "hover:border-blue-500/40",
    bgHoverClass: "hover:bg-blue-500/5",
  },
  emerald: {
    name: "Emerald",
    dotClass: "bg-emerald-500",
    badgeClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
    borderClass: "hover:border-emerald-500/40",
    bgHoverClass: "hover:bg-emerald-500/5",
  },
  amber: {
    name: "Amber",
    dotClass: "bg-amber-500",
    badgeClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
    borderClass: "hover:border-amber-500/40",
    bgHoverClass: "hover:bg-amber-500/5",
  },
  rose: {
    name: "Rose",
    dotClass: "bg-rose-500",
    badgeClass: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30",
    borderClass: "hover:border-rose-500/40",
    bgHoverClass: "hover:bg-rose-500/5",
  },
  indigo: {
    name: "Indigo",
    dotClass: "bg-indigo-500",
    badgeClass: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30",
    borderClass: "hover:border-indigo-500/40",
    bgHoverClass: "hover:bg-indigo-500/5",
  },
  cyan: {
    name: "Cyan",
    dotClass: "bg-cyan-500",
    badgeClass: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/30",
    borderClass: "hover:border-cyan-500/40",
    bgHoverClass: "hover:bg-cyan-500/5",
  },
  orange: {
    name: "Orange",
    dotClass: "bg-orange-500",
    badgeClass: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30",
    borderClass: "hover:border-orange-500/40",
    bgHoverClass: "hover:bg-orange-500/5",
  },
  pink: {
    name: "Pink",
    dotClass: "bg-pink-500",
    badgeClass: "bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/30",
    borderClass: "hover:border-pink-500/40",
    bgHoverClass: "hover:bg-pink-500/5",
  },
};

const ALL_PERMISSIONS = PERMISSION_GROUPS.flatMap((g) => g.permissions);

export function RolePresetsManager({ presets }: { presets: RolePresetRecord[] }) {
  const t = useTranslations("admin.rolePresets");
  const [creating, setCreating] = useState(false);
  const [editingPreset, setEditingPreset] = useState<RolePresetRecord | null>(null);
  const [deletingPreset, setDeletingPreset] = useState<RolePresetRecord | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold tracking-tight">{t("heading")}</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">{t("headingHint")}</p>
        </div>

        <Button size="sm" onClick={() => setCreating(true)} className="gap-1.5 font-semibold">
          <Plus className="h-4 w-4" aria-hidden="true" />
          {t("createPreset")}
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
        {presets.map((preset) => {
          const style = ROLE_COLOR_STYLES[preset.color] ?? ROLE_COLOR_STYLES.blue;
          const permCount = preset.permissions.length;

          return (
            <div
              key={preset.id}
              className={cn(
                "relative flex flex-col justify-between rounded-xl border border-border bg-card p-4 transition-all duration-150 shadow-sm",
                style.borderClass,
              )}
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={cn("h-2.5 w-2.5 rounded-full", style.dotClass)} />
                    <h3 className="font-semibold text-sm text-foreground">{preset.name}</h3>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {preset.isSystem && (
                      <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                        {t("system")}
                      </span>
                    )}
                    <span className={cn("rounded border px-2 py-0.5 text-[11px] font-semibold", style.badgeClass)}>
                      {t("permsCount", { count: permCount, total: ALL_PERMISSIONS.length })}
                    </span>
                  </div>
                </div>

                <p className="mt-2 text-xs text-muted-foreground line-clamp-2">
                  {preset.description || t("noDescription")}
                </p>

                {/* Group Breakdown Summary */}
                <div className="mt-3 flex flex-wrap gap-1">
                  {PERMISSION_GROUPS.map((group) => {
                    const heldInGroup = group.permissions.filter((p) => preset.permissions.includes(p));
                    if (heldInGroup.length === 0) return null;
                    return (
                      <span
                        key={group.key}
                        className="inline-flex items-center rounded-md bg-muted/60 px-1.5 py-0.5 text-[10px] font-medium text-foreground/80"
                      >
                        {group.labelEn}: {heldInGroup.length}
                      </span>
                    );
                  })}
                </div>
              </div>

              <div className="mt-4 flex items-center justify-end gap-2 border-t border-border/60 pt-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setEditingPreset(preset)}
                  className="h-8 gap-1 text-xs"
                >
                  <Edit2 className="h-3 w-3" /> {t("edit")}
                </Button>

                {!preset.isSystem && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setDeletingPreset(preset)}
                    className="h-8 gap-1 text-xs text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-3 w-3" /> {t("delete")}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Dialog */}
      {creating && <RolePresetFormDialog open={creating} onClose={() => setCreating(false)} />}

      {/* Edit Dialog */}
      {editingPreset && (
        <RolePresetFormDialog
          open={!!editingPreset}
          preset={editingPreset}
          onClose={() => setEditingPreset(null)}
        />
      )}

      {/* Delete Dialog */}
      {deletingPreset && (
        <DeletePresetDialog
          preset={deletingPreset}
          open={!!deletingPreset}
          onClose={() => setDeletingPreset(null)}
        />
      )}
    </div>
  );
}

function RolePresetFormDialog({
  open,
  preset,
  onClose,
}: {
  open: boolean;
  preset?: RolePresetRecord;
  onClose: () => void;
}) {
  const t = useTranslations("admin.rolePresets");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState(preset?.name ?? "");
  const [description, setDescription] = useState(preset?.description ?? "");
  const [color, setColor] = useState<string>(preset?.color ?? "blue");
  const [selectedPermissions, setSelectedPermissions] = useState<Set<Permission>>(
    new Set(preset?.permissions ?? []),
  );

  function togglePermission(perm: Permission, checked: boolean) {
    setSelectedPermissions((prev) => {
      const next = new Set(prev);
      if (checked) next.add(perm);
      else next.delete(perm);
      return next;
    });
  }

  function toggleGroup(groupPerms: readonly Permission[], select: boolean) {
    setSelectedPermissions((prev) => {
      const next = new Set(prev);
      for (const p of groupPerms) {
        if (select) next.add(p);
        else next.delete(p);
      }
      return next;
    });
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!name.trim()) {
      toast.error(t("nameRequired"));
      return;
    }

    if (selectedPermissions.size === 0) {
      toast.error(t("atLeastOnePermission"));
      return;
    }

    startTransition(async () => {
      const permsArray = Array.from(selectedPermissions);
      let res;
      if (preset) {
        res = await updateRolePresetAction({
          id: preset.id,
          name: name.trim(),
          description: description.trim(),
          color: color as any,
          permissions: permsArray,
        });
      } else {
        res = await createRolePresetAction({
          name: name.trim(),
          description: description.trim(),
          color: color as any,
          permissions: permsArray,
        });
      }

      if (res.ok) {
        toast.success(res.message);
        router.refresh();
        onClose();
      } else {
        toast.error(res.message);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[88vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-3 shrink-0 border-b border-border/40">
          <DialogTitle>
            {preset ? t("editPresetTitle", { name: preset.name }) : t("createPresetTitle")}
          </DialogTitle>
          <DialogDescription asChild>
            <div className="text-xs text-muted-foreground">{t("dialogDescription")}</div>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto scroll-thin px-6 py-4 space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="role-name" className="text-xs font-semibold">
                  {t("roleNameLabel")} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="role-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("roleNamePlaceholder")}
                  required
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">{t("colorAccentLabel")}</Label>
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  {Object.keys(ROLE_COLOR_STYLES).map((key) => {
                    const c = ROLE_COLOR_STYLES[key];
                    const selected = color === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setColor(key)}
                        title={c.name}
                        className={cn(
                          "h-6 w-6 rounded-full transition-transform",
                          c.dotClass,
                          selected ? "ring-2 ring-foreground ring-offset-2 scale-110" : "opacity-80 hover:opacity-100",
                        )}
                      />
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="role-desc" className="text-xs font-semibold">
                {t("descriptionLabel")}
              </Label>
              <Input
                id="role-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t("descriptionPlaceholder")}
                className="h-9 text-xs"
              />
            </div>

            {/* Permissions Matrix */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {t("permissionsAndAccesses", {
                    count: selectedPermissions.size,
                    total: ALL_PERMISSIONS.length,
                  })}
                </Label>
                <div className="flex items-center gap-1.5 text-xs">
                  <button
                    type="button"
                    onClick={() => setSelectedPermissions(new Set(ALL_PERMISSIONS))}
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    {t("selectAll")}
                  </button>
                  <span className="text-muted-foreground">•</span>
                  <button
                    type="button"
                    onClick={() => setSelectedPermissions(new Set())}
                    className="text-xs font-medium text-destructive hover:underline"
                  >
                    {t("clear")}
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {PERMISSION_GROUPS.map((group) => {
                  const allInGroupSelected = group.permissions.every((p) => selectedPermissions.has(p));

                  return (
                    <div key={group.key} className="rounded-md border border-border/60 bg-muted/20 p-2.5">
                      <div className="flex items-center justify-between border-b border-border/40 pb-1.5 mb-2">
                        <span className="text-[11px] font-bold text-foreground uppercase tracking-wider">
                          {group.labelEn}
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleGroup(group.permissions, !allInGroupSelected)}
                          className="text-[11px] font-medium text-muted-foreground hover:text-foreground"
                        >
                          {allInGroupSelected ? t("deselectGroup") : t("selectGroup")}
                        </button>
                      </div>

                      <div className="grid gap-2 sm:grid-cols-2">
                        {group.permissions.map((permission) => {
                          const detail = PERMISSION_DETAILS[permission];
                          const checked = selectedPermissions.has(permission);

                          return (
                            <label
                              key={permission}
                              className={cn(
                                "flex items-start gap-2 rounded-md p-1 text-xs cursor-pointer transition-colors",
                                checked ? "bg-muted/40 font-medium" : "hover:bg-muted/20 text-muted-foreground",
                              )}
                            >
                              <Checkbox
                                checked={checked}
                                onCheckedChange={(val) => togglePermission(permission, val === true)}
                                className="mt-0.5"
                              />
                              <div className="min-w-0">
                                <span className="block text-xs text-foreground">
                                  {detail?.labelEn ?? permission}
                                </span>
                                <span className="block text-[10px] text-muted-foreground line-clamp-1">
                                  {detail?.description}
                                </span>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <DialogFooter className="px-6 py-3 border-t border-border bg-muted/20 shrink-0 gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={isPending} className="gap-1.5 font-semibold">
              {isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              {preset ? t("saveChanges") : t("createPresetButton")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeletePresetDialog({
  preset,
  open,
  onClose,
}: {
  preset: RolePresetRecord;
  open: boolean;
  onClose: () => void;
}) {
  const t = useTranslations("admin.rolePresets");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      const res = await deleteRolePresetAction({ id: preset.id });
      if (res.ok) {
        toast.success(res.message);
        router.refresh();
        onClose();
      } else {
        toast.error(res.message);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-destructive flex items-center gap-2">
            <Trash2 className="h-5 w-5" />
            {t("deletePresetTitle", { name: preset.name })}
          </DialogTitle>
          <DialogDescription asChild>
            <div className="text-xs text-muted-foreground pt-1 space-y-1">
              <p>{t("deletePresetNote1")}</p>
              <p>{t("deletePresetNote2")}</p>
            </div>
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
            {t("cancel")}
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={isPending}
            onClick={handleDelete}
            className="gap-1.5"
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            {t("deletePresetButton")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
