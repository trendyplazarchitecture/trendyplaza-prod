"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Gauge,
  GripVertical,
  Loader2,
  Plus,
  RotateCcw,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";

import {
  archiveCarouselLogoAction,
  purgeCarouselLogoAction,
  reorderCarouselLogosAction,
  restoreCarouselLogoAction,
  saveCarouselLogoAction,
  saveCarouselSpeedAction,
  setCarouselLogoVisibleAction,
  type ActionResult,
} from "@/server/actions/software-carousel";
import { CAROUSEL_LOGO_FILES } from "@/lib/carousel-logos";
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

export type CarouselLogoRow = {
  id: string;
  nameEn: string;
  logoPath: string;
  isVisible: boolean;
  position: number;
  archivedAt: Date | null;
};

/**
 * The "trusted by" logo strip's mini-CMS — homepage, about page, software
 * hub. Deliberately no upload here: `logoPath` is picked from
 * `CAROUSEL_LOGO_FILES`, the client's own vetted SVGs already copied into
 * `public/software-logos/`. See that constant's doc comment for why.
 */
export function CarouselManager({
  rows,
  speedSeconds,
}: {
  rows: CarouselLogoRow[];
  speedSeconds: number;
}) {
  const t = useTranslations("admin.softwareCarousel");
  const tc = useTranslations("admin.common");
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();
  const [isPending, startTransition] = useTransition();
  const live = useMemo(
    () => [...rows.filter((r) => !r.archivedAt)].sort((a, b) => a.position - b.position),
    [rows],
  );
  const archived = rows.filter((r) => r.archivedAt);

  // Held locally so a drag reorders the grid instantly; the server call on
  // drop is the actual save, and `rows` coming back from the refresh
  // re-syncs this. Same shape as `ProductsManager`'s drag, deliberately —
  // one reorder interaction in this admin, not two.
  const [order, setOrder] = useState(live);
  useEffect(() => setOrder(live), [live]);
  const [dragId, setDragId] = useState<string | null>(null);

  function dragOver(overId: string) {
    if (!dragId || dragId === overId) return;
    setOrder((prev) => {
      const from = prev.findIndex((r) => r.id === dragId);
      const to = prev.findIndex((r) => r.id === overId);
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
    act(() => reorderCarouselLogosAction({ logoIds: order.map((r) => r.id) }));
  }

  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState<CarouselLogoRow | null>(null);
  const [purging, setPurging] = useState<CarouselLogoRow | null>(null);
  const [speed, setSpeed] = useState(String(speedSeconds));

  const usedFiles = new Set(rows.filter((r) => !r.archivedAt).map((r) => r.logoPath));
  const availableFiles = CAROUSEL_LOGO_FILES.filter((f) => !usedFiles.has(f.file));

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
        toast.error(t("saveFailed"));
      }
    });
  }

  function submitAdd(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await saveCarouselLogoAction(form);
      if (result.ok) {
        toast.success(result.message);
        setAdding(false);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  /**
   * The keyboard and touch path to the same reorder. Kept alongside the drag
   * handle on purpose: native HTML5 drag events never fire on touch, and a
   * drag handle is not reachable by keyboard at all, so drag-only would make
   * ordering impossible on a phone and for anyone not using a mouse.
   */
  function move(index: number, by: -1 | 1) {
    const next = [...order];
    const target = index + by;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    act(() => reorderCarouselLogosAction({ logoIds: next.map((r) => r.id) }));
  }

  function saveSpeed() {
    act(() => saveCarouselSpeedAction({ seconds: Number(speed) }));
  }

  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-5">
      <div>
        <h2 className="text-base font-bold">{t("title")}</h2>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      <div className="flex flex-wrap items-end gap-2">
        <div className="space-y-1.5">
          <Label htmlFor="carousel-speed" className="text-xs">
            {t("loopDuration")}
          </Label>
          <div className="flex gap-2">
            <Input
              id="carousel-speed"
              type="number"
              min={5}
              max={120}
              value={speed}
              onChange={(e) => setSpeed(e.target.value)}
              className="w-24"
            />
            <Button type="button" size="sm" variant="outline" onClick={saveSpeed} disabled={isPending}>
              <Gauge className="h-3.5 w-3.5" aria-hidden="true" />
              {t("saveSpeed")}
            </Button>
          </div>
        </div>
        <Button
          type="button"
          size="sm"
          className="ms-auto gap-1.5"
          disabled={availableFiles.length === 0}
          onClick={() => setAdding(true)}
        >
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          {t("addLogo")}
        </Button>
      </div>

      {live.length === 0 ? (
        <p className="rounded-md border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground">
          {t("emptyState")}
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
          {order.map((r, index) => (
            <motion.li
              key={r.id}
              layout={!shouldReduceMotion}
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
                "group relative flex flex-col items-center gap-2 rounded-lg border border-border bg-background p-3 transition-shadow",
                !r.isVisible && "opacity-50",
                dragId === r.id
                  ? "opacity-40 ring-2 ring-primary"
                  : dragId && "ring-1 ring-border ring-offset-1 ring-offset-card",
              )}
            >
              <span
                draggable
                onDragStart={() => setDragId(r.id)}
                onDragEnd={dragEnd}
                /* The handle, not the whole card, starts the drag — the card
                   carries a switch and two buttons, and making all of it
                   draggable turns every mis-aimed click into a drag. */
                className="absolute start-1 top-1 cursor-grab text-muted-foreground/40 transition-colors group-hover:text-muted-foreground active:cursor-grabbing"
                aria-label={t("dragAria", { name: r.nameEn })}
              >
                <GripVertical className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
              <div className="flex h-10 w-10 items-center justify-center">
                <img src={`/software-logos/${r.logoPath}`} alt="" className="h-full w-full object-contain" />
              </div>
              <p className="truncate text-xs font-medium">{r.nameEn}</p>
              <div className="flex items-center gap-0.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  disabled={isPending || index === 0}
                  aria-label={t("moveEarlierAria", { name: r.nameEn })}
                  onClick={() => move(index, -1)}
                >
                  <ArrowLeft className="h-3 w-3 rtl:-scale-x-100" />
                </Button>
                <Switch
                  dir="ltr"
                  checked={r.isVisible}
                  aria-label={r.isVisible ? t("hideAria", { name: r.nameEn }) : t("showAria", { name: r.nameEn })}
                  onCheckedChange={(next) =>
                    act(() => setCarouselLogoVisibleAction({ logoId: r.id, isVisible: next }))
                  }
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  disabled={isPending || index === order.length - 1}
                  aria-label={t("moveLaterAria", { name: r.nameEn })}
                  onClick={() => move(index, 1)}
                >
                  <ArrowRight className="h-3 w-3 rtl:-scale-x-100" />
                </Button>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground hover:text-primary-press"
                disabled={isPending}
                aria-label={t("removeAria", { name: r.nameEn })}
                onClick={() => setDeleting(r)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </motion.li>
          ))}
        </ul>
      )}

      {archived.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            {t("removedSectionTitle")}
          </p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {archived.map((r) => (
              <li
                key={r.id}
                className="flex items-center gap-2 rounded-lg border border-border bg-background px-2 py-1 opacity-60"
              >
                <span className="text-xs">{r.nameEn}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  disabled={isPending}
                  aria-label={t("restoreAria", { name: r.nameEn })}
                  onClick={() => act(() => restoreCarouselLogoAction({ logoId: r.id }))}
                >
                  <RotateCcw className="h-3 w-3" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-primary-press"
                  disabled={isPending}
                  aria-label={t("deleteForeverAria", { name: r.nameEn })}
                  onClick={() => setPurging(r)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Dialog open={adding} onOpenChange={setAdding}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("addDialogTitle")}</DialogTitle>
            <DialogDescription>{t("addDialogDescription")}</DialogDescription>
          </DialogHeader>
          <form onSubmit={submitAdd} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="logo-file">{t("logoLabel")}</Label>
              <Select name="logoPath" required>
                <SelectTrigger id="logo-file">
                  <SelectValue placeholder={t("choosePlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {availableFiles.map((f) => (
                    <SelectItem key={f.file} value={f.file}>
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <input type="hidden" name="nameEn" id="logo-name-hidden" />
            <input type="hidden" name="isVisible" value="on" />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAdding(false)}>
                {tc("cancel")}
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                onClick={(e) => {
                  // The label is the name — filled in from the select just before submit,
                  // so the server never has to reverse-derive a display name from a filename.
                  const form = e.currentTarget.closest("form");
                  const select = form?.querySelector<HTMLSelectElement>('[name="logoPath"]');
                  const chosen = availableFiles.find((f) => f.file === select?.value);
                  const hidden = form?.querySelector<HTMLInputElement>("#logo-name-hidden");
                  if (hidden && chosen) hidden.value = chosen.label;
                }}
              >
                {isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                {t("addButton")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleting !== null} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("removeConfirmTitle", { name: deleting?.nameEn ?? "" })}</AlertDialogTitle>
            <AlertDialogDescription>{t("removeConfirmDescription")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("keepIt")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!deleting) return;
                act(() => archiveCarouselLogoAction({ logoId: deleting.id }));
                setDeleting(null);
              }}
            >
              {t("removeButton")}
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
                act(() => purgeCarouselLogoAction({ logoId: purging.id }));
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
