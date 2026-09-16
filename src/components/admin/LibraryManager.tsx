"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  GripVertical,
  Loader2,
  Lock,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
  Unlock,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";

import {
  archiveLibraryItemAction,
  createLibraryTagAction,
  reorderLibraryItemsAction,
  saveLibraryItemAction,
  setLibraryItemGatedAction,
  setLibraryItemVisibleAction,
  type ActionResult,
} from "@/server/actions/library-items";
import { restoreFromTrashAction, purgeFromTrashAction } from "@/server/actions/trash";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
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
import { LibraryCategoriesManager, type LibraryCategoryRow } from "./LibraryCategoriesManager";
import { libraryCoverUrl } from "@/lib/media";
import { LIBRARY_COVER_FILES } from "@/lib/library-covers";
import { cn } from "@/lib/utils";

export type LibraryItemRow = {
  id: string;
  categoryId: string;
  titleEn: string;
  titleFr: string | null;
  titleAr: string | null;
  descriptionEn: string;
  descriptionFr: string | null;
  descriptionAr: string | null;
  authorEn: string | null;
  coverImagePath: string | null;
  source: "file" | "youtube" | "drive" | "link";
  filePath: string | null;
  externalUrl: string | null;
  mimeType: string | null;
  sizeBytes: number | null;
  allowDownload: boolean;
  isGated: boolean;
  isVisible: boolean;
  position: number;
  archivedAt: Date | null;
  tags: string[];
};

export type TagOption = { id: string; slug: string; labelEn: string };

/**
 * NextPhase/03-library. Template: `SoftwareManager.tsx` — one dialog for add
 * and edit, archive/restore/purge through the unified trash system
 * (`library_item`). Categories (`LibraryCategoriesManager`) are their own
 * admin-editable table, not a fixed list — see that component's doc comment.
 */
export function LibraryManager({
  rows,
  tagOptions,
  categories,
}: {
  rows: LibraryItemRow[];
  tagOptions: TagOption[];
  categories: LibraryCategoryRow[];
}) {
  const t = useTranslations("admin.library");
  const tc = useTranslations("admin.common");
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();
  const [isPending, startTransition] = useTransition();

  const liveCategories = categories.filter((c) => !c.archivedAt);
  const categoryById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  const live = rows.filter((r) => !r.archivedAt);
  const archived = rows.filter((r) => r.archivedAt);

  const [tab, setTab] = useState<string>("all");
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    return live
      .filter((r) => tab === "all" || r.categoryId === tab)
      .filter((r) => !query.trim() || r.titleEn.toLowerCase().includes(query.trim().toLowerCase()))
      .sort((a, b) => a.position - b.position);
  }, [live, tab, query]);

  const [order, setOrder] = useState(filtered.map((r) => r.id));
  const filteredIds = filtered.map((r) => r.id).join(",");
  useEffect(() => {
    setOrder(filteredIds.split(",").filter(Boolean));
  }, [filteredIds]);
  const ordered = order.map((id) => filtered.find((r) => r.id === id)!).filter(Boolean);
  // Reordering only makes sense within an unfiltered, unsorted-by-search view.
  const canReorder = tab !== "all" ? true : query.trim() === "";

  const [editing, setEditing] = useState<LibraryItemRow | "new" | null>(null);
  const [deleting, setDeleting] = useState<LibraryItemRow | null>(null);
  const [purging, setPurging] = useState<LibraryItemRow | null>(null);
  const [categoryId, setCategoryId] = useState<string>(liveCategories[0]?.id ?? "");
  const [source, setSource] = useState<"file" | "youtube" | "drive" | "link">("file");
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [removeCover, setRemoveCover] = useState(false);
  const [coverAsset, setCoverAsset] = useState<string | null>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [tags, setTags] = useState(tagOptions);
  const [newTagLabel, setNewTagLabel] = useState("");
  const [addingTag, setAddingTag] = useState(false);

  const current = editing !== "new" ? editing : null;

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
        toast.error(t("saveFailed"));
      }
    });
  }

  function openNew(catId: string) {
    setCategoryId(catId || liveCategories[0]?.id || "");
    setSource("file");
    setCoverPreview(null);
    setRemoveCover(false);
    setCoverAsset(null);
    setSelectedTagIds([]);
    setEditing("new");
  }

  function openEdit(r: LibraryItemRow) {
    setCategoryId(r.categoryId);
    setSource(r.source);
    setCoverPreview(null);
    setRemoveCover(false);
    setCoverAsset(null);
    setSelectedTagIds(tags.filter((tg) => r.tags.includes(tg.slug)).map((tg) => tg.id));
    setEditing(r);
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    form.set("categoryId", categoryId);
    form.set("source", source);
    if (editing && editing !== "new") form.set("id", editing.id);
    for (const tagId of selectedTagIds) form.append("tagIds", tagId);
    act(() => saveLibraryItemAction(form));
  }

  async function addTag() {
    const label = newTagLabel.trim();
    if (!label) return;
    setAddingTag(true);
    try {
      const result = await createLibraryTagAction({ label });
      if (result.ok) {
        setTags((prev) => [...prev, { id: result.id, slug: result.slug, labelEn: result.labelEn }]);
        setSelectedTagIds((prev) => [...prev, result.id]);
        setNewTagLabel("");
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error(t("saveFailed"));
    } finally {
      setAddingTag(false);
    }
  }

  function persistOrder(next: string[]) {
    setOrder(next);
    act(() => reorderLibraryItemsAction({ itemIds: next }));
  }

  function moveItem(index: number, by: -1 | 1) {
    if (!canReorder) return;
    const next = [...order];
    const target = index + by;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    persistOrder(next);
  }

  const [dragId, setDragId] = useState<string | null>(null);
  function dragOver(overId: string) {
    if (!dragId || dragId === overId || !canReorder) return;
    setOrder((prev) => {
      const from = prev.indexOf(dragId);
      const to = prev.indexOf(overId);
      if (from === -1 || to === -1) return prev;
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }
  function dragEnd() {
    if (!dragId) return;
    setDragId(null);
    if (!canReorder) return;
    act(() => reorderLibraryItemsAction({ itemIds: order }));
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" size="sm" variant={tab === "all" ? "default" : "outline"} onClick={() => setTab("all")}>
          {t("allCategories")}
        </Button>
        {liveCategories.map((cat) => (
          <Button
            key={cat.id}
            type="button"
            size="sm"
            variant={tab === cat.id ? "default" : "outline"}
            onClick={() => setTab(cat.id)}
          >
            {cat.labelEn}
          </Button>
        ))}
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("searchPlaceholder")}
          className="ms-auto max-w-[220px]"
        />
        <LibraryCategoriesManager categories={categories} />
        <Button
          type="button"
          size="sm"
          className="gap-1.5"
          disabled={liveCategories.length === 0}
          onClick={() => openNew(tab === "all" ? "" : tab)}
        >
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          {t("addItem")}
        </Button>
      </div>

      {liveCategories.length === 0 && (
        <p className="rounded-md border border-dashed border-border px-3 py-4 text-center text-sm text-muted-foreground">
          {t("noCategoriesYet")}
        </p>
      )}

      {ordered.length === 0 ? (
        <p className="rounded-md border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground">
          {t("emptyState")}
        </p>
      ) : (
        <ul className="space-y-2">
          {ordered.map((r, index) => (
            <li
              key={r.id}
              onDragOver={(e) => {
                if (dragId) {
                  e.preventDefault();
                  dragOver(r.id);
                }
              }}
              onDrop={(e) => {
                e.preventDefault();
                dragEnd();
              }}
              className={cn(
                "group rounded-lg transition-colors",
                dragId === r.id && "opacity-40",
                dragId && dragId !== r.id && "ring-1 ring-border",
              )}
            >
              <div className="flex items-center gap-1">
                <span
                  draggable={canReorder && !isPending}
                  onDragStart={() => canReorder && setDragId(r.id)}
                  onDragEnd={dragEnd}
                  className={cn(
                    "flex h-7 w-5 items-center justify-center text-muted-foreground/40 transition-colors",
                    canReorder ? "cursor-grab group-hover:text-muted-foreground active:cursor-grabbing" : "cursor-not-allowed opacity-30",
                  )}
                  aria-label={canReorder ? t("dragAria", { name: r.titleEn }) : t("dragDisabledAria")}
                  title={canReorder ? undefined : t("dragDisabledAria")}
                >
                  <GripVertical className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
                <div className="flex">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    disabled={isPending || !canReorder || index === 0}
                    aria-label={t("moveEarlierAria", { name: r.titleEn })}
                    onClick={() => moveItem(index, -1)}
                  >
                    <ArrowLeft className="h-3.5 w-3.5 rtl:-scale-x-100" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    disabled={isPending || !canReorder || index === ordered.length - 1}
                    aria-label={t("moveLaterAria", { name: r.titleEn })}
                    onClick={() => moveItem(index, 1)}
                  >
                    <ArrowRight className="h-3.5 w-3.5 rtl:-scale-x-100" />
                  </Button>
                </div>

                <motion.div
                  layout={!shouldReduceMotion}
                  initial={shouldReduceMotion ? undefined : { opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={shouldReduceMotion ? undefined : { opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.18 }}
                  className={cn(
                    "flex flex-1 items-center gap-3 rounded-lg border border-border bg-background p-3 transition-shadow hover:shadow-sm",
                    !r.isVisible && "opacity-50",
                  )}
                >
                  <div className="h-12 w-10 shrink-0 overflow-hidden rounded-md bg-paper">
                    {libraryCoverUrl(r.coverImagePath) ? (
                      <img src={libraryCoverUrl(r.coverImagePath)!} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <BookOpen className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate text-sm font-semibold">{r.titleEn}</p>
                      <span className="inline-flex shrink-0 items-center rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                        {categoryById.get(r.categoryId)?.labelEn ?? "—"}
                      </span>
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      {r.authorEn ? `${r.authorEn} — ` : ""}
                      {r.source === "file" ? (r.mimeType ?? "file") : r.externalUrl}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => act(() => setLibraryItemGatedAction({ itemId: r.id, isGated: !r.isGated }))}
                    disabled={isPending}
                    title={r.isGated ? t("gatedTitle") : t("freeTitle")}
                    className={cn(
                      "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold transition-colors",
                      r.isGated ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700",
                    )}
                  >
                    {r.isGated ? <Lock className="h-2.5 w-2.5" /> : <Unlock className="h-2.5 w-2.5" />}
                    {r.isGated ? t("gatedBadge") : t("freeBadge")}
                  </button>
                  <Switch
                    dir="ltr"
                    checked={r.isVisible}
                    aria-label={r.isVisible ? t("hideAria", { name: r.titleEn }) : t("showAria", { name: r.titleEn })}
                    onCheckedChange={(next) => act(() => setLibraryItemVisibleAction({ itemId: r.id, isVisible: next }))}
                  />
                  <Button type="button" variant="ghost" size="icon" className="h-7 w-7" aria-label={t("editAria", { name: r.titleEn })} onClick={() => openEdit(r)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-primary-press"
                    disabled={isPending}
                    aria-label={t("deleteAria", { name: r.titleEn })}
                    onClick={() => setDeleting(r)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </motion.div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {archived.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t("deletedSectionTitle")}</p>
          <ul className="mt-2 space-y-2">
            {archived.map((r) => (
              <li key={r.id} className="flex items-center gap-3 rounded-lg border border-border bg-background p-3 opacity-60">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{r.titleEn}</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  disabled={isPending}
                  aria-label={t("restoreAria", { name: r.titleEn })}
                  onClick={() => act(() => restoreFromTrashAction({ entity: "library_item", id: r.id }))}
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-primary-press"
                  disabled={isPending}
                  aria-label={t("deleteForeverAria", { name: r.titleEn })}
                  onClick={() => setPurging(r)}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Dialog
        open={editing !== null}
        onOpenChange={(open) => {
          if (open) return;
          setEditing(null);
          setCoverPreview(null);
          setRemoveCover(false);
          setCoverAsset(null);
        }}
      >
        <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{current ? t("editDialogTitle", { name: current.titleEn }) : t("newItemTitle")}</DialogTitle>
            <DialogDescription>{t("dialogDescription")}</DialogDescription>
          </DialogHeader>

          <form onSubmit={submit} className="space-y-4" encType="multipart/form-data">
            <div className="space-y-1.5">
              <Label htmlFor="li-category">{t("categoryLabel")}</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger id="li-category">
                  <SelectValue placeholder={t("categoryPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {/* The item's own current category stays selectable even if archived since the last edit, so saving doesn't silently move it. */}
                  {(current && !liveCategories.some((c) => c.id === current.categoryId)
                    ? [categoryById.get(current.categoryId), ...liveCategories].filter((c): c is LibraryCategoryRow => !!c)
                    : liveCategories
                  ).map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.labelEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <TriLingualField
              name="title"
              label={t("titleLabel")}
              values={{ En: current?.titleEn, Ar: current?.titleAr, Fr: current?.titleFr }}
            />

            <TriLingualField
              name="description"
              label={t("descriptionLabel")}
              multiline
              values={{ En: current?.descriptionEn, Ar: current?.descriptionAr, Fr: current?.descriptionFr }}
            />

            <div className="space-y-1.5">
              <Label htmlFor="li-author">{t("authorLabel")}</Label>
              <Input id="li-author" name="authorEn" defaultValue={current?.authorEn ?? ""} placeholder={t("authorPlaceholder")} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="li-source">{t("sourceLabel")}</Label>
              <Select value={source} onValueChange={(v) => setSource(v as typeof source)}>
                <SelectTrigger id="li-source">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="file">{t("sources.file")}</SelectItem>
                  <SelectItem value="youtube">{t("sources.youtube")}</SelectItem>
                  <SelectItem value="drive">{t("sources.drive")}</SelectItem>
                  <SelectItem value="link">{t("sources.link")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {source === "file" ? (
              <div className="space-y-1.5">
                <Label htmlFor="li-file">{t("fileLabel")}</Label>
                <input
                  ref={fileInputRef}
                  id="li-file"
                  name="file"
                  type="file"
                  className="block w-full text-sm file:me-3 file:rounded-md file:border-0 file:bg-paper file:px-3 file:py-1.5 file:text-xs file:font-semibold"
                />
                {current?.source === "file" && current.filePath && (
                  <p className="text-xs text-muted-foreground">{t("currentFileHint")}</p>
                )}
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label htmlFor="li-url">{t("externalUrlLabel")}</Label>
                <Input
                  id="li-url"
                  name="externalUrl"
                  type="url"
                  dir="ltr"
                  required
                  defaultValue={current?.source !== "file" ? (current?.externalUrl ?? "") : ""}
                  placeholder={source === "youtube" ? "https://www.youtube.com/watch?v=..." : "https://drive.google.com/..."}
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="li-cover">{t("coverLabel")}</Label>
              <div className="flex items-center gap-3">
                <div className="flex h-16 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-dashed border-border bg-paper">
                  {coverAsset ? (
                    <img src={libraryCoverUrl(`seed/${coverAsset}`)!} alt="" className="h-full w-full object-cover" />
                  ) : coverPreview ? (
                    <img src={coverPreview} alt="" className="h-full w-full object-cover" />
                  ) : current?.coverImagePath && !removeCover ? (
                    <img src={libraryCoverUrl(current.coverImagePath)!} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <BookOpen className="h-5 w-5 text-muted-foreground/60" aria-hidden="true" />
                  )}
                </div>
                <div className="flex-1 space-y-1.5">
                  <input
                    ref={coverInputRef}
                    id="li-cover"
                    name="cover"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      setRemoveCover(false);
                      setCoverAsset(null);
                      setCoverPreview(file ? URL.createObjectURL(file) : null);
                    }}
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => coverInputRef.current?.click()}>
                      <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                      {current?.coverImagePath || coverPreview ? t("replaceButton") : t("chooseFileButton")}
                    </Button>
                    <span className="text-xs text-muted-foreground">{t("orLabel")}</span>
                    <Select
                      value={coverAsset ?? undefined}
                      onValueChange={(value) => {
                        setCoverAsset(value);
                        setRemoveCover(false);
                        setCoverPreview(null);
                        if (coverInputRef.current) coverInputRef.current.value = "";
                      }}
                    >
                      <SelectTrigger className="h-8 w-[180px] text-xs">
                        <SelectValue placeholder={t("stockCoverPlaceholder")} />
                      </SelectTrigger>
                      <SelectContent>
                        {LIBRARY_COVER_FILES.map((f) => (
                          <SelectItem key={f.file} value={f.file}>
                            {f.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <input type="hidden" name="coverAsset" value={coverAsset ?? ""} />
                  </div>
                  {(current?.coverImagePath || coverPreview || coverAsset) && (
                    <>
                      <input type="hidden" name="removeCover" value={removeCover ? "on" : "off"} />
                      <button
                        type="button"
                        className="block text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
                        onClick={() => {
                          setRemoveCover(true);
                          setCoverPreview(null);
                          setCoverAsset(null);
                          if (coverInputRef.current) coverInputRef.current.value = "";
                        }}
                      >
                        {t("removeCoverButton")}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>{t("tagsLabel")}</Label>
              <div className="flex flex-wrap gap-x-4 gap-y-2 rounded-md border border-border p-3">
                {tags.length === 0 && <p className="text-xs text-muted-foreground">{t("noTagsYet")}</p>}
                {tags.map((tg) => (
                  <label key={tg.id} className="flex items-center gap-1.5 text-sm">
                    <Checkbox
                      checked={selectedTagIds.includes(tg.id)}
                      onCheckedChange={(checked) =>
                        setSelectedTagIds((prev) => (checked ? [...prev, tg.id] : prev.filter((id) => id !== tg.id)))
                      }
                    />
                    {tg.labelEn}
                  </label>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newTagLabel}
                  onChange={(e) => setNewTagLabel(e.target.value)}
                  placeholder={t("newTagPlaceholder")}
                  className="h-8 text-xs"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                />
                <Button type="button" size="sm" variant="outline" disabled={addingTag || !newTagLabel.trim()} onClick={addTag}>
                  {addingTag ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : t("addTagButton")}
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
              <Label htmlFor="li-gated" className="text-sm font-normal">
                {t("isGatedLabel")}
              </Label>
              <Switch id="li-gated" dir="ltr" name="isGated" defaultChecked={current?.isGated ?? true} />
            </div>

            <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
              <Label htmlFor="li-download" className="text-sm font-normal">
                {t("allowDownloadLabel")}
              </Label>
              <Switch id="li-download" dir="ltr" name="allowDownload" defaultChecked={current?.allowDownload ?? false} />
            </div>

            <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
              <Label htmlFor="li-visible" className="text-sm font-normal">
                {t("visibleLabel")}
              </Label>
              <Switch id="li-visible" dir="ltr" name="isVisible" defaultChecked={current?.isVisible ?? true} />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditing(null);
                  setCoverPreview(null);
                  setRemoveCover(false);
                  setCoverAsset(null);
                }}
              >
                {tc("cancel")}
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                {tc("save")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleting !== null} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteConfirmTitle", { name: deleting?.titleEn ?? "" })}</AlertDialogTitle>
            <AlertDialogDescription>{t("deleteConfirmDescription")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("keepIt")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!deleting) return;
                act(() => archiveLibraryItemAction({ itemId: deleting.id }));
                setDeleting(null);
              }}
            >
              {t("deleteButton")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={purging !== null} onOpenChange={(open) => !open && setPurging(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteForeverTitle", { name: purging?.titleEn ?? "" })}</AlertDialogTitle>
            <AlertDialogDescription>{t("deleteForeverDescription")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("keepIt")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!purging) return;
                act(() => purgeFromTrashAction({ entity: "library_item", id: purging.id }));
                setPurging(null);
              }}
            >
              {t("deleteForeverButton")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
