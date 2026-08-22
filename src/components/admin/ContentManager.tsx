"use client";

import { useState, useTransition } from "react";
import { useRouter } from "../../../i18n/navigation";
import { useTranslations } from "next-intl";
import {
  Archive,
  ArrowDown,
  ArrowUp,
  Copy,
  ExternalLink,
  Loader2,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
  Youtube,
} from "lucide-react";
import { toast } from "sonner";

import { ContentTree, type UniversityNode } from "./ContentTree";
import { StatusPill } from "./StatusPill";
import { Empty, Panel } from "./AdminChrome";
import { TriLingualField } from "./TriLingual";
import {
  archiveAction,
  duplicateModuleAction,
  reorderResourcesAction,
  saveResourceAction,
  setVisibilityAction,
} from "@/server/actions/content";
import { purgeFromTrashAction, restoreFromTrashAction } from "@/server/actions/trash";
import { ResourceQuickAdd } from "./ResourceQuickAdd";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
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

export type ResourceRow = {
  id: string;
  titleEn: string;
  titleAr: string | null;
  titleFr: string | null;
  source: string;
  externalUrl: string | null;
  sizeBytes: number | null;
  allowDownload: boolean;
  isVisible: boolean;
  archivedAt: Date | null;
  typeId: string;
  typeLabelEn: string;
};

export type ResourceType = { id: string; key: string; labelEn: string };

function readableSize(bytes: number | null) {
  if (!bytes) return null;
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;
}

/**
 * The tree on the left, the open module's resources on the right.
 *
 * Loading a semester of material is one sitting of repetitive work, so the
 * two panes stay on screen together: pick a module once, add six resources,
 * move on. Navigating away to a resource page and back for each one is what
 * makes content ingestion the thing the client never finishes.
 */
export function ContentManager({
  universities,
  resourceTypes,
  resources,
  openModuleId,
  openModuleName,
}: {
  universities: UniversityNode[];
  resourceTypes: ResourceType[];
  resources: ResourceRow[];
  openModuleId: string | null;
  openModuleName: string | null;
}) {
  const t = useTranslations("admin.content");
  const tc = useTranslations("admin.common");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ResourceRow | null>(null);
  const [source, setSource] = useState<string>("file");
  const [typeId, setTypeId] = useState<string>(resourceTypes[0]?.id ?? "");
  // Ordered locally so the arrows answer immediately; the server is the
  // authority and `router.refresh()` reconciles.
  const [order, setOrder] = useState<ResourceRow[]>(resources);
  const [duplicating, setDuplicating] = useState(false);
  const [targetSemester, setTargetSemester] = useState("");

  // The prop changes when a different module is opened, or after a refresh.
  const signature = resources.map((r) => r.id).join(",");
  const [lastSignature, setLastSignature] = useState(signature);
  if (signature !== lastSignature) {
    setLastSignature(signature);
    setOrder(resources);
  }

  function moveResource(index: number, by: -1 | 1) {
    const next = [...order];
    const target = index + by;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setOrder(next);
    if (!openModuleId) return;
    act(() =>
      reorderResourcesAction({
        moduleId: openModuleId,
        resourceIds: next.map((r) => r.id),
      }),
    );
  }

  function openModule(moduleId: string) {
    const params = new URLSearchParams(window.location.search);
    params.set("module", moduleId);
    router.push(`/admin/content?${params.toString()}`, { scroll: false });
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    if (openModuleId) form.set("moduleId", openModuleId);
    form.set("resourceTypeId", typeId);
    form.set("source", source);
    if (editing) form.set("id", editing.id);

    startTransition(async () => {
      const result = await saveResourceAction(form);
      if (result.ok) {
        toast.success(result.message);
        setDialogOpen(false);
        setEditing(null);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  function act(fn: () => Promise<{ ok: boolean; message: string }>) {
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

  const [purgeTarget, setPurgeTarget] = useState<ResourceRow | null>(null);

  return (
    <>
      <div className="grid gap-6 xl:grid-cols-[1.1fr_1fr]">
        <div className="space-y-3">
          <ContentTree universities={universities} onOpenModule={openModule} />
        </div>

        <Panel
          title={
            openModuleName ? t("resourcesFor", { name: openModuleName }) : t("resources")
          }
          padded={false}
          action={
            openModuleId && (
              <div className="flex items-center gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 gap-1 px-2 text-xs"
                  onClick={() => {
                    setTargetSemester("");
                    setDuplicating(true);
                  }}
                >
                  <Copy className="h-3 w-3" aria-hidden="true" />
                  {t("duplicate")}
                </Button>
                <Button
                  size="sm"
                  className="h-7 gap-1 px-2 text-xs"
                  onClick={() => {
                    setEditing(null);
                    setSource("file");
                    setTypeId(resourceTypes[0]?.id ?? "");
                    setDialogOpen(true);
                  }}
                >
                  <Plus className="h-3 w-3" aria-hidden="true" />
                  {t("moreOptions")}
                </Button>
              </div>
            )
          }
        >
          {openModuleId && (
            <ResourceQuickAdd moduleId={openModuleId} resourceTypes={resourceTypes} />
          )}
          {!openModuleId ? (
            <Empty title={t("pickModuleTitle")} hint={t("pickModuleHint")} />
          ) : resources.length === 0 ? (
            <Empty
              title={t("noResourcesTitle")}
              hint={t("noResourcesHint")}
              action={
                <Button size="sm" onClick={() => setDialogOpen(true)}>
                  {t("addFirstOne")}
                </Button>
              }
            />
          ) : (
            <ul className="divide-y divide-border">
              {order.map((r, index) => (
                <li key={r.id} className="flex items-start gap-3 px-4 py-3">
                  {/*
                    Arrows, not drag. The list sits inside a scrolling panel
                    beside a tree that also scrolls, and a drag that fights the
                    scroll on a laptop trackpad is worse than two buttons that
                    always work. This is the order students read them in.
                  */}
                  <div className="flex shrink-0 flex-col">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5"
                      disabled={isPending || index === 0}
                      aria-label={t("moveUp", { name: r.titleEn })}
                      onClick={() => moveResource(index, -1)}
                    >
                      <ArrowUp className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5"
                      disabled={isPending || index === order.length - 1}
                      aria-label={t("moveDown", { name: r.titleEn })}
                      onClick={() => moveResource(index, 1)}
                    >
                      <ArrowDown className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-baseline gap-2">
                      <span className="truncate text-sm font-medium">{r.titleEn}</span>
                      <span className="ui-dense shrink-0 rounded border border-border bg-paper px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                        {r.typeLabelEn}
                      </span>
                    </p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                      {r.source === "file" ? (
                        <span>{readableSize(r.sizeBytes) ?? t("file")}</span>
                      ) : (
                        <a
                          href={r.externalUrl ?? "#"}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 hover:text-primary-press"
                        >
                          {r.source === "youtube" ? (
                            <Youtube className="h-3 w-3" aria-hidden="true" />
                          ) : (
                            <ExternalLink className="h-3 w-3" aria-hidden="true" />
                          )}
                          {r.source}
                        </a>
                      )}
                      {r.allowDownload && (
                        <span className="text-amber-700">{t("downloadAllowed")}</span>
                      )}
                      {!r.titleAr && <span className="text-amber-700">{t("noArabic")}</span>}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-1.5">
                    {r.archivedAt ? (
                      <StatusPill tone="halted">{t("archived")}</StatusPill>
                    ) : !r.isVisible ? (
                      <StatusPill tone="pending">{t("hidden")}</StatusPill>
                    ) : null}

                    {/*
                      Quick-add and bulk upload cover getting a resource in;
                      changing a title afterwards had no way in but the full
                      dialog, and nothing on the row opened it in edit mode —
                      `editing` and the pre-filled form already existed, they
                      just had no trigger. Available even on an archived row:
                      fixing a typo before restoring it is a reasonable thing
                      to want and costs nothing to allow.
                    */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      aria-label={t("edit", { name: r.titleEn })}
                      onClick={() => {
                        setEditing(r);
                        setSource(r.source);
                        setTypeId(r.typeId);
                        setDialogOpen(true);
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>

                    {r.archivedAt ? (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          aria-label={t("restore", { name: r.titleEn })}
                          onClick={() =>
                            act(() => restoreFromTrashAction({ entity: "content_resource", id: r.id }))
                          }
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-primary-press hover:text-primary-press"
                          aria-label={t("deleteForever", { name: r.titleEn })}
                          onClick={() => setPurgeTarget(r)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    ) : (
                      <>
                        {/* dir="ltr": a toggle's thumb travel is not text direction. */}
                        <Switch
                          dir="ltr"
                          checked={r.isVisible}
                          aria-label={t(r.isVisible ? "hide" : "show", { name: r.titleEn })}
                          onCheckedChange={(next) =>
                            act(() =>
                              setVisibilityAction({
                                entity: "resource",
                                id: r.id,
                                isVisible: next,
                              }),
                            )
                          }
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          aria-label={t("archive", { name: r.titleEn })}
                          onClick={() =>
                            act(() => archiveAction({ entity: "resource", id: r.id }))
                          }
                        >
                          <Archive className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? t("editResource") : t("addResource")}</DialogTitle>
            <DialogDescription>{t("dialogDescription")}</DialogDescription>
          </DialogHeader>

          <form onSubmit={submit} className="space-y-5">
            <TriLingualField
              name="title"
              label={t("titleFieldLabel")}
              values={
                editing
                  ? { En: editing.titleEn, Ar: editing.titleAr, Fr: editing.titleFr }
                  : undefined
              }
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="type">{t("typeLabel")}</Label>
                <Select value={typeId} onValueChange={setTypeId}>
                  <SelectTrigger id="type">
                    <SelectValue placeholder={t("chooseType")} />
                  </SelectTrigger>
                  <SelectContent>
                    {resourceTypes.map((rt) => (
                      <SelectItem key={rt.id} value={rt.id}>
                        {rt.labelEn}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="source">{t("whereItLives")}</Label>
                <Select value={source} onValueChange={setSource}>
                  <SelectTrigger id="source">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="file">{t("uploadedFile")}</SelectItem>
                    <SelectItem value="youtube">{t("youtube")}</SelectItem>
                    <SelectItem value="drive">{t("googleDrive")}</SelectItem>
                    <SelectItem value="link">{t("otherLink")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {source === "file" ? (
              <div className="space-y-1.5">
                <Label htmlFor="file">{t("file")}</Label>
                <Input id="file" name="file" type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" />
                <p className="text-xs text-muted-foreground">
                  {t("fileHint")}
                  {editing && ` ${t("leaveEmptyToKeep")}`}
                </p>
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label htmlFor="externalUrl">{t("link")}</Label>
                <Input
                  id="externalUrl"
                  name="externalUrl"
                  type="url"
                  required
                  defaultValue={editing?.externalUrl ?? ""}
                  placeholder="https://www.youtube.com/watch?v=..."
                />
                <p className="text-xs text-muted-foreground">{t("unlistedLinkNote")}</p>
              </div>
            )}

            <label className="flex items-start gap-3 rounded-md border border-border p-3">
              <input
                type="checkbox"
                name="allowDownload"
                defaultChecked={editing?.allowDownload ?? false}
                className="mt-0.5 h-4 w-4 accent-[oklch(0.588_0.226_27.5)]"
              />
              <span>
                <span className="block text-sm font-medium">{t("allowDownloadTitle")}</span>
                <span className="block text-xs text-muted-foreground">
                  {t("allowDownloadHint")}
                </span>
              </span>
            </label>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                {tc("cancel")}
              </Button>
              <Button type="submit" disabled={isPending || !typeId}>
                {isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                {tc("save")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/*
        Duplicating a module into another semester.

        02_DOMAIN.md is explicit that reuse across universities is a copy of
        the resources and never a shared reference, so one university editing
        their material cannot change another's. The picker therefore spans
        every university, not just the current one: copying L1 Atelier from
        EPAU to another school is the case this exists for.
      */}
      <Dialog open={duplicating} onOpenChange={setDuplicating}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("duplicateModule", { name: openModuleName ?? "" })}</DialogTitle>
            <DialogDescription>{t("duplicateDescription")}</DialogDescription>
          </DialogHeader>

          <div className="space-y-1.5">
            <Label htmlFor="targetSemester">{t("copyInto")}</Label>
            <Select value={targetSemester} onValueChange={setTargetSemester}>
              <SelectTrigger id="targetSemester">
                <SelectValue placeholder={t("pickSemester")} />
              </SelectTrigger>
              <SelectContent>
                {universities.flatMap((u) =>
                  u.years.flatMap((y) =>
                    y.semesters.map((sem) => (
                      <SelectItem key={sem.id} value={sem.id}>
                        {u.nameEn} · {y.level} · {sem.label}
                      </SelectItem>
                    )),
                  ),
                )}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDuplicating(false)}>
              {tc("cancel")}
            </Button>
            <Button
              type="button"
              disabled={isPending || !targetSemester || !openModuleId}
              onClick={() => {
                if (!openModuleId || !targetSemester) return;
                startTransition(async () => {
                  const result = await duplicateModuleAction({
                    moduleId: openModuleId,
                    targetSemesterId: targetSemester,
                  });
                  if (result.ok) {
                    toast.success(result.message);
                    setDuplicating(false);
                    router.refresh();
                  } else {
                    toast.error(result.message);
                  }
                });
              }}
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              {t("duplicate")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={purgeTarget !== null} onOpenChange={(open) => !open && setPurgeTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("deleteForeverConfirm", { name: purgeTarget?.titleEn ?? "" })}
            </AlertDialogTitle>
            <AlertDialogDescription>{t("cannotBeUndone")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("keepIt")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!purgeTarget) return;
                const id = purgeTarget.id;
                setPurgeTarget(null);
                act(() => purgeFromTrashAction({ entity: "content_resource", id }));
              }}
            >
              {t("deleteForeverButton")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
