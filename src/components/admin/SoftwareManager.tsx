"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Flame,
  GripVertical,
  Link2,
  Loader2,
  MonitorCog,
  MousePointerClick,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";

import {
  archiveSoftwareToolAction,
  checkSoftwareLinksAction,
  reorderSoftwareToolsAction,
  saveSoftwareToolAction,
  setSoftwareToolVisibleAction,
  type ActionResult,
} from "@/server/actions/software";
import { restoreFromTrashAction, purgeFromTrashAction } from "@/server/actions/trash";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { softwareLogoUrl } from "@/lib/media";
import { CAROUSEL_LOGO_FILES } from "@/lib/carousel-logos";
import { cn } from "@/lib/utils";

export type SoftwareRow = {
  id: string;
  kind: "application" | "plugin";
  slug: string;
  nameEn: string;
  descriptionEn: string;
  descriptionAr: string | null;
  descriptionFr: string | null;
  logoPath: string | null;
  officialUrl: string;
  studentLicenseUrl: string | null;
  parentToolId: string | null;
  clickCount: number;
  isVisible: boolean;
  position: number;
  archivedAt: Date | null;
};

/**
 * NextPhase/02-software-hub. Template: `RosterManager.tsx` — one dialog for
 * add and edit, archive/restore/purge through the unified trash system
 * (`software_tool`) rather than a bespoke pair, since that system shipped
 * after this plan was written.
 */
export function SoftwareManager({ rows }: { rows: SoftwareRow[] }) {
  const t = useTranslations("admin.software");
  const tc = useTranslations("admin.common");
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();
  const [isPending, startTransition] = useTransition();
  const live = rows.filter((r) => !r.archivedAt);
  const archived = rows.filter((r) => r.archivedAt);
  const applicationsByPosition = useMemo(
    () => live.filter((r) => r.kind === "application").sort((a, b) => a.position - b.position),
    [live],
  );
  const [sortByPopularity, setSortByPopularity] = useState(false);
  // Admin-only view toggle -- the public order is always `position`, per the
  // doc comment on `clickCount`. This never writes anything.
  const applications = useMemo(
    () =>
      sortByPopularity
        ? [...applicationsByPosition].sort((a, b) => b.clickCount - a.clickCount)
        : applicationsByPosition,
    [applicationsByPosition, sortByPopularity],
  );
  const popularThreshold = Math.max(
    10,
    Math.ceil((live.reduce((sum, r) => sum + r.clickCount, 0) / Math.max(live.length, 1)) * 2),
  );
  const [order, setOrder] = useState(applications.map((a) => a.id));
  // `applications` is a fresh array from `rows` on every render (a new save,
  // archive, or restore calls `router.refresh()`), but `order` is only ever
  // reordered locally by `moveApp` -- without this, a save that changes which
  // ids exist would leave `order` pointing at stale or missing ones, and the
  // list would keep rendering whatever was there when the component first
  // mounted, empty included.
  const applicationIds = applications.map((a) => a.id).join(",");
  useEffect(() => {
    setOrder(applicationIds.split(",").filter(Boolean));
  }, [applicationIds]);
  const orderedApps = order.map((id) => applications.find((a) => a.id === id)!).filter(Boolean);
  const pluginsOf = (appId: string) =>
    live.filter((r) => r.kind === "plugin" && r.parentToolId === appId);
  const orphanPlugins = live.filter(
    (r) => r.kind === "plugin" && !applications.some((a) => a.id === r.parentToolId),
  );

  const [editing, setEditing] = useState<SoftwareRow | "new" | null>(null);
  const [deleting, setDeleting] = useState<SoftwareRow | null>(null);
  const [purging, setPurging] = useState<SoftwareRow | null>(null);
  const [kind, setKind] = useState<"application" | "plugin">("application");
  const [checking, setChecking] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [removeLogo, setRemoveLogo] = useState(false);
  // A pick from the vetted vendor list (`CAROUSEL_LOGO_FILES`), mutually
  // exclusive with a raster upload — see the "Logo (optional)" field below.
  const [vendorLogo, setVendorLogo] = useState<string | null>(null);
  const [logoDragOver, setLogoDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * The one path for a logo file, whether it arrived via the file picker or
   * a drop — same validation, same state updates, either way.
   *
   * An SVG can't go through `storeUpload` at all (see its own doc comment),
   * but the client's own vetted vendor files are exactly the SVGs someone
   * would naturally try here — so a dropped or picked SVG whose filename
   * matches one of `CAROUSEL_LOGO_FILES` is treated as that vendor pick
   * automatically, rather than bounced with an error the admin then has to
   * resolve by hand from the same list one field over.
   */
  function handleLogoFile(file: File | undefined) {
    if (!file) {
      setLogoPreview(null);
      return;
    }

    const isSvg = file.type === "image/svg+xml" || /\.svg$/i.test(file.name);
    if (isSvg) {
      const match = CAROUSEL_LOGO_FILES.find(
        (f) => f.file.toLowerCase() === file.name.toLowerCase(),
      );
      if (fileInputRef.current) fileInputRef.current.value = "";
      setLogoPreview(null);
      if (match) {
        setRemoveLogo(false);
        setVendorLogo(match.file);
        toast.success(t("svgMatched", { name: match.label }));
      } else {
        toast.error(t("svgNotRecognized"));
      }
      return;
    }

    setRemoveLogo(false);
    setVendorLogo(null);
    setLogoPreview(URL.createObjectURL(file));
    // A dropped file never populates the real `<input type="file">` on its
    // own — assign it via DataTransfer so the eventual form submission
    // actually carries it, exactly as if it had been picked by hand.
    if (fileInputRef.current) {
      const transfer = new DataTransfer();
      transfer.items.add(file);
      fileInputRef.current.files = transfer.files;
    }
  }

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

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    form.set("kind", kind);
    if (editing && editing !== "new") form.set("id", editing.id);
    act(() => saveSoftwareToolAction(form));
  }

  /**
   * Reordering is only meaningful while the list is showing `position`
   * order. Under "Sort by clicks" the rows are in popularity order, so
   * saving that arrangement would write the click ranking into `position`
   * and silently replace the admin-chosen public order — the exact thing
   * the doc comment on that toggle says it never does. So the controls go
   * inert instead.
   */
  const canReorder = !sortByPopularity;

  function persistOrder(next: string[]) {
    setOrder(next);
    act(() => reorderSoftwareToolsAction({ toolIds: next }));
  }

  /**
   * Keyboard and touch path to the same reorder as the drag handle. Kept
   * because native HTML5 drag events never fire on touch, and a drag handle
   * is not reachable by keyboard — drag alone would make ordering
   * impossible on a phone and for anyone not using a mouse.
   */
  function moveApp(index: number, by: -1 | 1) {
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
    act(() => reorderSoftwareToolsAction({ toolIds: order }));
  }

  async function checkLinks() {
    setChecking(true);
    try {
      const result = await checkSoftwareLinksAction();
      if (result.broken.length === 0) {
        toast.success(t("everyLinkAnswered"));
      } else {
        toast.error(
          t("linksDidNotAnswer", {
            count: result.broken.length,
            details: result.broken
              .map((b) => `${b.nameEn} (${b.status ?? "no response"})`)
              .join(", "),
          }),
        );
      }
    } catch {
      toast.error(t("checkLinksFailed"));
    } finally {
      setChecking(false);
    }
  }

  const current = editing !== "new" ? editing : null;
  const applicationOptions = applications.filter((a) => a.id !== current?.id);

  function openEdit(r: SoftwareRow) {
    setLogoPreview(null);
    setRemoveLogo(false);
    setVendorLogo(null);
    setKind(r.kind);
    setEditing(r);
  }

  function row(r: SoftwareRow, indent: boolean) {
    const url = softwareLogoUrl(r.logoPath);
    const isPopular = r.clickCount >= popularThreshold && r.clickCount > 0;
    return (
      <motion.div
        key={r.id}
        layout={!shouldReduceMotion}
        initial={shouldReduceMotion ? undefined : { opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={shouldReduceMotion ? undefined : { opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.18 }}
        className={cn(
          "flex items-center gap-3 rounded-lg border border-border bg-background p-3 transition-shadow hover:shadow-sm",
          indent && "ms-8",
          !r.isVisible && "opacity-50",
        )}
      >
        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md bg-paper">
          {url ? (
            <img src={url} alt="" className="h-full w-full object-contain" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <MonitorCog className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="truncate text-sm font-semibold">{r.nameEn}</p>
            {isPopular && (
              <span
                className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700"
                title={t("popularTitle", { count: r.clickCount })}
              >
                <Flame className="h-2.5 w-2.5" aria-hidden="true" />
                {t("popularBadge")}
              </span>
            )}
          </div>
          <p className="truncate text-xs text-muted-foreground">{r.officialUrl}</p>
        </div>
        <span
          className="inline-flex shrink-0 items-center gap-1 text-xs text-muted-foreground"
          title={t("clicksTitle")}
        >
          <MousePointerClick className="h-3 w-3" aria-hidden="true" />
          {r.clickCount}
        </span>
        <Switch
          dir="ltr"
          checked={r.isVisible}
          aria-label={r.isVisible ? t("hideAria", { name: r.nameEn }) : t("showAria", { name: r.nameEn })}
          onCheckedChange={(next) =>
            act(() => setSoftwareToolVisibleAction({ toolId: r.id, isVisible: next }))
          }
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          aria-label={t("editAria", { name: r.nameEn })}
          onClick={() => openEdit(r)}
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-primary-press"
          disabled={isPending}
          aria-label={t("deleteAria", { name: r.nameEn })}
          onClick={() => setDeleting(r)}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          className="gap-1.5"
          onClick={() => {
            setKind("application");
            setLogoPreview(null);
            setRemoveLogo(false);
            setVendorLogo(null);
            setEditing("new");
          }}
        >
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          {t("addApplication")}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="gap-1.5"
          onClick={() => {
            setKind("plugin");
            setLogoPreview(null);
            setRemoveLogo(false);
            setVendorLogo(null);
            setEditing("new");
          }}
        >
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          {t("addPlugin")}
        </Button>
        <Button
          type="button"
          size="sm"
          variant={sortByPopularity ? "default" : "outline"}
          className="ms-auto gap-1.5"
          onClick={() => setSortByPopularity((v) => !v)}
          aria-pressed={sortByPopularity}
        >
          <Flame className="h-3.5 w-3.5" aria-hidden="true" />
          {sortByPopularity ? t("sortedByClicks") : t("sortByClicks")}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="gap-1.5"
          disabled={checking}
          onClick={checkLinks}
        >
          {checking ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
          ) : (
            <Link2 className="h-3.5 w-3.5" aria-hidden="true" />
          )}
          {t("checkLinks")}
        </Button>
      </div>

      {orderedApps.length === 0 && orphanPlugins.length === 0 ? (
        <p className="rounded-md border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground">
          {t("emptyState")}
        </p>
      ) : (
        <ul className="space-y-2">
          {orderedApps.map((app, index) => (
            <li
              key={app.id}
              onDragOver={(e) => {
                if (dragId) {
                  e.preventDefault();
                  dragOver(app.id);
                }
              }}
              onDrop={(e) => {
                e.preventDefault();
                dragEnd();
              }}
              className={cn(
                "group space-y-2 rounded-lg transition-colors",
                dragId === app.id && "opacity-40",
                dragId && dragId !== app.id && "ring-1 ring-border",
              )}
            >
              <div className="flex items-center gap-1">
                <span
                  draggable={canReorder && !isPending}
                  onDragStart={() => canReorder && setDragId(app.id)}
                  onDragEnd={dragEnd}
                  /* The handle starts the drag, never the whole row — the
                     row carries links, a switch and an edit button. */
                  className={cn(
                    "flex h-7 w-5 items-center justify-center text-muted-foreground/40 transition-colors",
                    canReorder
                      ? "cursor-grab group-hover:text-muted-foreground active:cursor-grabbing"
                      : "cursor-not-allowed opacity-30",
                  )}
                  aria-label={canReorder ? t("dragAria", { name: app.nameEn }) : t("dragDisabledAria")}
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
                    aria-label={t("moveEarlierAria", { name: app.nameEn })}
                    onClick={() => moveApp(index, -1)}
                  >
                    <ArrowLeft className="h-3.5 w-3.5 rtl:-scale-x-100" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    disabled={isPending || !canReorder || index === orderedApps.length - 1}
                    aria-label={t("moveLaterAria", { name: app.nameEn })}
                    onClick={() => moveApp(index, 1)}
                  >
                    <ArrowRight className="h-3.5 w-3.5 rtl:-scale-x-100" />
                  </Button>
                </div>
                <div className="flex-1">{row(app, false)}</div>
              </div>
              {pluginsOf(app.id).map((p) => row(p, true))}
            </li>
          ))}
          {orphanPlugins.length > 0 && (
            <li className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                {t("pluginsWithoutApp")}
              </p>
              {orphanPlugins.map((p) => row(p, false))}
            </li>
          )}
        </ul>
      )}

      {archived.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            {t("deletedSectionTitle")}
          </p>
          <ul className="mt-2 space-y-2">
            {archived.map((r) => (
              <li
                key={r.id}
                className="flex items-center gap-3 rounded-lg border border-border bg-background p-3 opacity-60"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{r.nameEn}</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  disabled={isPending}
                  aria-label={t("restoreAria", { name: r.nameEn })}
                  onClick={() =>
                    act(() => restoreFromTrashAction({ entity: "software_tool", id: r.id }))
                  }
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-primary-press"
                  disabled={isPending}
                  aria-label={t("deleteForeverAria", { name: r.nameEn })}
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
          setLogoPreview(null);
          setRemoveLogo(false);
          setVendorLogo(null);
        }}
      >
        <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {current
                ? t("editDialogTitle", { name: current.nameEn })
                : kind === "plugin"
                  ? t("newPluginTitle")
                  : t("newApplicationTitle")}
            </DialogTitle>
            <DialogDescription>{t("dialogDescription")}</DialogDescription>
          </DialogHeader>

          <form onSubmit={submit} className="space-y-4" encType="multipart/form-data">
            <div className="space-y-1.5">
              <Label htmlFor="sw-name">{t("nameLabel")}</Label>
              <Input
                id="sw-name"
                name="nameEn"
                required
                minLength={1}
                defaultValue={current?.nameEn ?? ""}
                placeholder="AutoCAD"
              />
              <p className="text-xs text-muted-foreground">{t("nameHint")}</p>
            </div>

            {(kind === "plugin" || current?.kind === "plugin") && (
              <div className="space-y-1.5">
                <Label htmlFor="sw-parent">{t("belongsToLabel")}</Label>
                <Select name="parentToolId" defaultValue={current?.parentToolId ?? undefined}>
                  <SelectTrigger id="sw-parent">
                    <SelectValue placeholder={t("belongsToPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    {applicationOptions.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.nameEn}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <TriLingualField
              name="description"
              label={t("descriptionLabel")}
              multiline
              values={{
                En: current?.descriptionEn,
                Ar: current?.descriptionAr,
                Fr: current?.descriptionFr,
              }}
            />

            <div className="space-y-1.5">
              <Label htmlFor="sw-official">{t("officialSiteLabel")}</Label>
              <Input
                id="sw-official"
                name="officialUrl"
                type="url"
                required
                dir="ltr"
                defaultValue={current?.officialUrl ?? ""}
                placeholder="https://www.autodesk.com/products/autocad"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="sw-license">{t("studentLicenseLabel")}</Label>
              <Input
                id="sw-license"
                name="studentLicenseUrl"
                type="url"
                dir="ltr"
                defaultValue={current?.studentLicenseUrl ?? ""}
                placeholder="https://www.autodesk.com/education/edu-software"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="sw-logo">{t("logoLabel")}</Label>
              <div
                className="flex items-center gap-3"
                onDragOver={(e) => {
                  e.preventDefault();
                  setLogoDragOver(true);
                }}
                onDragLeave={() => setLogoDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setLogoDragOver(false);
                  handleLogoFile(e.dataTransfer.files?.[0]);
                }}
              >
                <div
                  className={cn(
                    "flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-dashed bg-paper transition-colors",
                    logoDragOver ? "border-primary bg-primary/5" : "border-border",
                  )}
                >
                  {vendorLogo ? (
                    <img
                      src={softwareLogoUrl(`seed/${vendorLogo}`) ?? ""}
                      alt=""
                      className="h-full w-full object-contain"
                    />
                  ) : logoPreview ? (
                    <img src={logoPreview} alt="" className="h-full w-full object-contain" />
                  ) : current?.logoPath && !removeLogo ? (
                    <img
                      src={softwareLogoUrl(current.logoPath) ?? ""}
                      alt=""
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <MonitorCog className="h-6 w-6 text-muted-foreground/60" aria-hidden="true" />
                  )}
                </div>
                <div className="flex-1 space-y-1.5">
                  <input
                    ref={fileInputRef}
                    id="sw-logo"
                    name="logo"
                    type="file"
                    accept="image/*,.svg"
                    className="hidden"
                    onChange={(e) => handleLogoFile(e.target.files?.[0])}
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                      {current?.logoPath || logoPreview ? t("replaceButton") : t("chooseFileButton")}
                    </Button>
                    <span className="text-xs text-muted-foreground">{t("dropHint")}</span>
                    <span className="text-xs text-muted-foreground">{t("orLabel")}</span>
                    <Select
                      value={vendorLogo ?? undefined}
                      onValueChange={(value) => {
                        setVendorLogo(value);
                        setRemoveLogo(false);
                        setLogoPreview(null);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                    >
                      <SelectTrigger className="h-8 w-[190px] text-xs">
                        <SelectValue placeholder={t("vendorLogoPlaceholder")} />
                      </SelectTrigger>
                      <SelectContent>
                        {CAROUSEL_LOGO_FILES.map((f) => (
                          <SelectItem key={f.file} value={f.file}>
                            {f.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <input type="hidden" name="logoAsset" value={vendorLogo ?? ""} />
                  </div>
                  {(current?.logoPath || logoPreview || vendorLogo) && (
                    <>
                      <input type="hidden" name="removeLogo" value={removeLogo ? "on" : "off"} />
                      <button
                        type="button"
                        className="block text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
                        onClick={() => {
                          setRemoveLogo(true);
                          setLogoPreview(null);
                          setVendorLogo(null);
                          if (fileInputRef.current) fileInputRef.current.value = "";
                        }}
                      >
                        {t("removeLogoButton")}
                      </button>
                    </>
                  )}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">{t("logoHint")}</p>
            </div>

            <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
              <Label htmlFor="sw-visible" className="text-sm font-normal">
                {t("visibleOnHub")}
              </Label>
              <Switch
                id="sw-visible"
                dir="ltr"
                name="isVisible"
                defaultChecked={current?.isVisible ?? true}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditing(null);
                  setLogoPreview(null);
                  setRemoveLogo(false);
                  setVendorLogo(null);
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
            <AlertDialogTitle>{t("deleteConfirmTitle", { name: deleting?.nameEn ?? "" })}</AlertDialogTitle>
            <AlertDialogDescription>{t("deleteConfirmDescription")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("keepIt")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!deleting) return;
                act(() => archiveSoftwareToolAction({ toolId: deleting.id }));
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
            <AlertDialogTitle>{t("deleteForeverTitle", { name: purging?.nameEn ?? "" })}</AlertDialogTitle>
            <AlertDialogDescription>{t("deleteForeverDescription")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("keepIt")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!purging) return;
                act(() => purgeFromTrashAction({ entity: "software_tool", id: purging.id }));
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
