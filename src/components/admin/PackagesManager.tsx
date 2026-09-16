"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Archive, Loader2, Package as PackageIcon, Pencil, Plus, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  archivePackageAction,
  restorePackageAction,
  savePackageAction,
  setPackageVisibilityAction,
  type ActionResult,
} from "@/server/actions/packages";
import { purgeFromTrashAction } from "@/server/actions/trash";
import { BulkBar } from "./BulkBar";
import { Empty } from "./AdminChrome";
import { StatusPill } from "./StatusPill";
import { TriLingualField } from "./TriLingual";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatDzd, toDinars } from "@/lib/money";
import { cn } from "@/lib/utils";

export type PackageRow = {
  id: string;
  titleEn: string;
  titleAr: string | null;
  titleFr: string | null;
  descriptionEn: string | null;
  descriptionAr: string | null;
  descriptionFr: string | null;
  priceDzd: number;
  defaultDurationDays: number | null;
  isVisible: boolean;
  archivedAt: Date | null;
  scopeType: "university" | "year" | "semester" | "module" | null;
  scopeId: string | null;
  scopeLabel: string;
};

export type ScopeModule = { id: string; nameEn: string };
export type ScopeSemester = { id: string; labelEn: string; modules: ScopeModule[] };
export type ScopeYear = { id: string; nameEn: string; semesters: ScopeSemester[] };
export type ScopeUniversity = { id: string; nameEn: string; years: ScopeYear[] };

/**
 * What an access code or a Baridimob payment actually opens.
 *
 * A package is a title, a price, a duration and one scope into the content
 * tree — chosen here from the same University → Year → Semester → Module
 * shape the Content screen edits, so a package can never point at a branch
 * that does not exist.
 */
export function PackagesManager({
  rows,
  tree,
}: {
  rows: PackageRow[];
  tree: ScopeUniversity[];
}) {
  const t = useTranslations("admin.packages");
  const tc = useTranslations("admin.common");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState<PackageRow | "new" | null>(null);
  const [scopeValue, setScopeValue] = useState("");

  function act(fn: () => Promise<ActionResult>) {
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
        toast.error(t("genericError"));
      }
    });
  }

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmBulkPurge, setConfirmBulkPurge] = useState(false);
  const [bulkConfirmText, setBulkConfirmText] = useState("");
  const selectedRows = rows.filter((p) => selected.has(p.id));
  const selectedArchived = selectedRows.filter((p) => p.archivedAt);
  const selectedLive = selectedRows.filter((p) => !p.archivedAt);

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected((prev) => (prev.size === rows.length ? new Set() : new Set(rows.map((p) => p.id))));
  }

  async function bulk(ids: string[], fn: (id: string) => Promise<ActionResult>, doneMessage: string) {
    startTransition(async () => {
      const results = await Promise.all(ids.map((id) => fn(id)));
      const failed = results.filter((r) => !r.ok).length;
      if (failed === 0) toast.success(doneMessage);
      else toast.error(t("someFailed", { failed, total: ids.length }));
      setSelected(new Set());
      router.refresh();
    });
  }

  function open(pkg: PackageRow | "new") {
    setEditing(pkg);
    setScopeValue(pkg !== "new" && pkg.scopeType && pkg.scopeId ? `${pkg.scopeType}:${pkg.scopeId}` : "");
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    if (editing && editing !== "new") form.set("id", editing.id);

    const [scopeType, scopeId] = scopeValue.split(":");
    if (!scopeType || !scopeId) {
      toast.error(t("chooseWhatOpens"));
      return;
    }
    form.set("scopeType", scopeType);
    form.set("scopeId", scopeId);

    startTransition(async () => {
      const result = await savePackageAction(form);
      if (result.ok) {
        toast.success(result.message);
        setEditing(null);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  const current = editing !== "new" ? editing : null;

  return (
    <>
      <div className="flex justify-end">
        <Button size="sm" className="gap-1.5" onClick={() => open("new")} disabled={tree.length === 0}>
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          {t("newPackage")}
        </Button>
      </div>

      {tree.length === 0 && (
        <p className="text-xs text-amber-700">{t("needsContentFirst")}</p>
      )}

      {rows.length === 0 ? (
        <Empty title={t("emptyTitle")} hint={t("emptyHint")} />
      ) : (
        <div className="space-y-2">
          <BulkBar count={selected.size} onClear={() => setSelected(new Set())}>
            {selectedLive.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 gap-1 px-2 text-xs"
                disabled={isPending}
                onClick={() =>
                  bulk(
                    selectedLive.map((p) => p.id),
                    (id) => archivePackageAction({ packageId: id }),
                    t("archivedToast"),
                  )
                }
              >
                <Archive className="h-3 w-3" />
                {t("archiveCount", { count: selectedLive.length })}
              </Button>
            )}
            {selectedArchived.length > 0 && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1 px-2 text-xs"
                  disabled={isPending}
                  onClick={() =>
                    bulk(
                      selectedArchived.map((p) => p.id),
                      (id) => restorePackageAction({ packageId: id }),
                      t("restoredToast"),
                    )
                  }
                >
                  <RotateCcw className="h-3 w-3" />
                  {t("restoreCount", { count: selectedArchived.length })}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1 px-2 text-xs text-primary-press hover:text-primary-press"
                  disabled={isPending}
                  onClick={() => {
                    setBulkConfirmText("");
                    setConfirmBulkPurge(true);
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                  {t("deleteForeverCount", { count: selectedArchived.length })}
                </Button>
              </>
            )}
          </BulkBar>

          <div className="overflow-x-auto rounded-lg border border-border bg-card">
          <table className="w-full min-w-[860px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-rule">
                <th scope="col" className="ui-dense w-10 px-4 py-2.5">
                  <Checkbox
                    checked={rows.length > 0 && selected.size === rows.length}
                    onCheckedChange={toggleAll}
                    aria-label={t("selectAll")}
                  />
                </th>
                {[
                  t("columns.package"),
                  t("columns.opens"),
                  t("columns.price"),
                  t("columns.duration"),
                  t("columns.visible"),
                  "",
                ].map((h, i) => (
                  <th
                    key={h || i}
                    scope="col"
                    className={cn(
                      "ui-dense px-4 py-2.5 text-[11px] font-semibold tracking-[0.1em] text-muted-foreground uppercase",
                      i === 2 && "text-end",
                    )}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr
                  key={p.id}
                  className={cn(
                    "border-b border-border last:border-0 hover:bg-paper",
                    p.archivedAt && "opacity-60",
                  )}
                >
                  <td className="px-4 py-3">
                    <Checkbox
                      checked={selected.has(p.id)}
                      onCheckedChange={() => toggleOne(p.id)}
                      aria-label={t("select", { name: p.titleEn })}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <span className="block truncate font-medium">{p.titleEn}</span>
                    {!p.titleAr && (
                      <span className="text-xs text-amber-700">{t("noArabic")}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{p.scopeLabel}</td>
                  <td className="figures px-4 py-3 text-end font-semibold">
                    {formatDzd(p.priceDzd)}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {p.defaultDurationDays
                      ? t("durationDays", { count: p.defaultDurationDays })
                      : t("unlimited")}
                  </td>
                  <td className="px-4 py-3">
                    {p.archivedAt ? (
                      <StatusPill tone="halted">{t("archived")}</StatusPill>
                    ) : (
                      // dir="ltr": a toggle's thumb travel is not text direction.
                      <Switch
                        dir="ltr"
                        checked={p.isVisible}
                        disabled={isPending}
                        aria-label={t(p.isVisible ? "hide" : "show", { name: p.titleEn })}
                        onCheckedChange={(next) =>
                          act(() => setPackageVisibilityAction({ packageId: p.id, isVisible: next }))
                        }
                      />
                    )}
                  </td>
                  <td className="px-4 py-3 text-end">
                    <div className="flex items-center justify-end gap-1">
                      {p.archivedAt ? (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            aria-label={t("restore", { name: p.titleEn })}
                            onClick={() => act(() => restorePackageAction({ packageId: p.id }))}
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-primary-press hover:text-primary-press"
                            aria-label={t("deleteForever", { name: p.titleEn })}
                            onClick={() => {
                              setSelected(new Set([p.id]));
                              setBulkConfirmText("");
                              setConfirmBulkPurge(true);
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            aria-label={t("edit", { name: p.titleEn })}
                            onClick={() => open(p)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            aria-label={t("archive", { name: p.titleEn })}
                            onClick={() => act(() => archivePackageAction({ packageId: p.id }))}
                          >
                            <Archive className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}

      <AlertDialog
        open={confirmBulkPurge}
        onOpenChange={(o) => {
          setConfirmBulkPurge(o);
          if (!o) setBulkConfirmText("");
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("bulkPurgeDialog.title", { count: selectedArchived.length })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("bulkPurgeDialog.description", {
                list: selectedArchived.map((p) => p.titleEn).join(", "),
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="packages-bulk-confirm" className="text-xs">
              {t.rich("bulkPurgeDialog.typeDeleteToConfirm", {
                b: (chunks) => <span className="font-mono font-semibold">{chunks}</span>,
              })}
            </Label>
            <Input
              id="packages-bulk-confirm"
              value={bulkConfirmText}
              onChange={(e) => setBulkConfirmText(e.target.value)}
              autoComplete="off"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("bulkPurgeDialog.keepThem")}</AlertDialogCancel>
            <AlertDialogAction
              disabled={bulkConfirmText.trim() !== "DELETE"}
              onClick={() => {
                setConfirmBulkPurge(false);
                bulk(
                  selectedArchived.map((p) => p.id),
                  (id) => purgeFromTrashAction({ entity: "package", id }),
                  t("deletedForGood"),
                );
              }}
            >
              {t("bulkPurgeDialog.confirmButton")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={editing !== null} onOpenChange={(next) => !next && setEditing(null)}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PackageIcon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              {current ? t("editPackage") : t("newPackage")}
            </DialogTitle>
            <DialogDescription>{t("editDialogDescription")}</DialogDescription>
          </DialogHeader>

          <form onSubmit={submit} className="space-y-5">
            <TriLingualField
              name="title"
              label={t("titleFieldLabel")}
              values={current ? { En: current.titleEn, Ar: current.titleAr, Fr: current.titleFr } : undefined}
            />

            <TriLingualField
              name="description"
              label={t("descriptionFieldLabel")}
              multiline
              hint={t("descriptionHint")}
              values={
                current
                  ? { En: current.descriptionEn, Ar: current.descriptionAr, Fr: current.descriptionFr }
                  : undefined
              }
            />

            <div className="space-y-1.5">
              <Label htmlFor="scope">{t("opensLabel")}</Label>
              <Select value={scopeValue} onValueChange={setScopeValue}>
                <SelectTrigger id="scope">
                  <SelectValue placeholder={t("opensPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {tree.map((uni) => (
                    <SelectGroup key={uni.id}>
                      <SelectLabel>{uni.nameEn}</SelectLabel>
                      <SelectItem value={`university:${uni.id}`}>{t("wholeUniversity")}</SelectItem>
                      {uni.years.map((year) => (
                        <div key={year.id}>
                          <SelectItem value={`year:${year.id}`}>
                            {t("wholeYear", { name: year.nameEn })}
                          </SelectItem>
                          {year.semesters.map((semester) => (
                            <div key={semester.id}>
                              <SelectItem value={`semester:${semester.id}`}>
                                {t("wholeSemester", {
                                  year: year.nameEn,
                                  semester: semester.labelEn,
                                })}
                              </SelectItem>
                              {semester.modules.map((mod) => (
                                <SelectItem key={mod.id} value={`module:${mod.id}`}>
                                  {t("moduleOption", {
                                    year: year.nameEn,
                                    semester: semester.labelEn,
                                    module: mod.nameEn,
                                  })}
                                </SelectItem>
                              ))}
                            </div>
                          ))}
                        </div>
                      ))}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">{t("opensHint")}</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="price">{t("priceLabel")}</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  min={0}
                  step={1}
                  required
                  defaultValue={current ? toDinars(current.priceDzd) : ""}
                  className="figures"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="durationDays">{t("durationLabel")}</Label>
                <Input
                  id="durationDays"
                  name="durationDays"
                  type="number"
                  min={1}
                  max={3650}
                  defaultValue={current?.defaultDurationDays ?? ""}
                  placeholder={t("durationPlaceholder")}
                  className="figures"
                />
              </div>
            </div>

            {!current && <p className="text-xs text-muted-foreground">{t("createdVisibleHint")}</p>}

            <DialogFooter className="gap-2 sm:justify-between">
              {current && !current.archivedAt ? (
                <Button
                  type="button"
                  variant="outline"
                  className="text-primary-press"
                  onClick={() => {
                    act(() => archivePackageAction({ packageId: current.id }));
                    setEditing(null);
                  }}
                >
                  <Archive className="h-3.5 w-3.5" aria-hidden="true" />
                  {t("archiveButton")}
                </Button>
              ) : (
                <span />
              )}
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setEditing(null)}>
                  {tc("cancel")}
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                  {current ? tc("save") : t("create")}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
