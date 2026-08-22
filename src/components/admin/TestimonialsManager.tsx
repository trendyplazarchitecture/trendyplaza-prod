"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Eye, EyeOff, ImagePlus, Loader2, RotateCcw, Trash2, UploadCloud, X } from "lucide-react";
import { toast } from "sonner";

import {
  archiveTestimonialAction,
  createTestimonialAction,
  purgeTestimonialAction,
  reorderTestimonialsAction,
  restoreTestimonialAction,
  setTestimonialVisibleAction,
  type ActionResult,
} from "@/server/actions/testimonials";
import { BulkBar } from "./BulkBar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { testimonialImageUrl } from "@/lib/media";
import { cn } from "@/lib/utils";

export type TestimonialRow = {
  id: string;
  imagePath: string;
  isVisible: boolean;
  position: number;
  archivedAt: Date | null;
};

/**
 * The home page marquee, as a grid of screenshots. There is no edit: the
 * image is the whole content, so replacing one means deleting it and adding
 * the new one. Reorder is by arrow for the same reason `ProductGallery` uses
 * arrows over drag: it always works, on a phone included.
 */
export function TestimonialsManager({ rows }: { rows: TestimonialRow[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [order, setOrder] = useState(rows.filter((r) => !r.archivedAt));
  const archived = rows.filter((r) => r.archivedAt);
  const [deleting, setDeleting] = useState<TestimonialRow | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkPurging, setBulkPurging] = useState(false);
  const [bulkConfirmText, setBulkConfirmText] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const selectedArchived = archived.filter((r) => selected.has(r.id));

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function bulkRestore() {
    const ids = selectedArchived.map((r) => r.id);
    startTransition(async () => {
      const results = await Promise.all(ids.map((id) => restoreTestimonialAction({ testimonialId: id })));
      const failed = results.filter((r) => !r.ok).length;
      if (failed === 0) toast.success("Restored.");
      else toast.error(`${failed} of ${ids.length} did not go through.`);
      setSelected(new Set());
      router.refresh();
    });
  }

  async function bulkPurge() {
    const ids = selectedArchived.map((r) => r.id);
    setBulkPurging(false);
    startTransition(async () => {
      const results = await Promise.all(ids.map((id) => purgeTestimonialAction({ testimonialId: id })));
      const failed = results.filter((r) => !r.ok).length;
      if (failed === 0) toast.success("Deleted for good.");
      else toast.error(`${failed} of ${ids.length} did not go through.`);
      setSelected(new Set());
      router.refresh();
    });
  }

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
        toast.error("That did not go through. Try again.");
      }
    });
  }

  function move(index: number, by: -1 | 1) {
    const next = [...order];
    const target = index + by;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setOrder(next);
    act(() => reorderTestimonialsAction({ testimonialIds: next.map((r) => r.id) }));
  }

  async function uploadFiles(files: FileList | File[]) {
    const images = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (images.length === 0) {
      toast.error("Drop an image file (JPEG, PNG or WebP).");
      return;
    }

    setUploading(true);
    let failed = 0;
    // Sequential, not Promise.all: each create reads the current highest
    // position and inserts one past it, and running that in parallel is how
    // a five-image drop lands five rows at the same position.
    for (const file of images) {
      const form = new FormData();
      form.set("image", file);
      const result = await createTestimonialAction(form);
      if (!result.ok) failed++;
    }
    setUploading(false);

    if (failed === 0) {
      toast.success(images.length === 1 ? "Added." : `${images.length} screenshots added.`);
    } else {
      toast.error(`${failed} of ${images.length} could not be added.`);
    }
    router.refresh();
  }

  function onFileInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (files && files.length > 0) uploadFiles(files);
    event.target.value = "";
  }

  const busy = isPending || uploading;

  return (
    <div className="space-y-6">
      <div>
        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          onChange={onFileInputChange}
          disabled={busy}
        />
        <button
          type="button"
          disabled={busy}
          onClick={() => fileInput.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            if (e.dataTransfer.files.length > 0) uploadFiles(e.dataTransfer.files);
          }}
          className={cn(
            "flex w-full flex-col items-center gap-2 rounded-lg border-2 border-dashed px-6 py-8 text-center transition-colors",
            dragOver
              ? "border-primary bg-primary/[0.04]"
              : "border-border hover:border-foreground/30 hover:bg-paper",
            busy && "pointer-events-none opacity-70",
          )}
        >
          {busy ? (
            <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden="true" />
          ) : (
            <UploadCloud className="h-6 w-6 text-primary" aria-hidden="true" />
          )}
          <span className="flex items-center gap-1.5 text-sm font-medium">
            <ImagePlus className="h-3.5 w-3.5" aria-hidden="true" />
            Drag screenshots here, or click to browse
          </span>
          <span className="text-xs text-muted-foreground">
            A review screenshot, a WhatsApp message, anything that reads as proof. Drop
            several at once. Converted to WebP and capped at 2000px on the way in.
          </span>
        </button>
      </div>

      {order.length === 0 ? (
        <p className="rounded-md border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground">
          Nothing yet. Add a screenshot above and it appears on the home page.
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {order.map((row, index) => {
            const url = testimonialImageUrl(row.imagePath);
            return (
              <li
                key={row.id}
                className={cn(
                  "group relative overflow-hidden rounded-md border border-border bg-paper transition-colors",
                  !row.isVisible && "opacity-50",
                )}
              >
                <div className="aspect-[3/4]">
                  {url && (
                    <img src={url} alt="" className="h-full w-full object-cover" />
                  )}
                </div>

                <div className="flex items-center justify-between border-t border-border bg-card px-1 py-1">
                  <div className="flex">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      disabled={isPending || index === 0}
                      aria-label={`Move screenshot ${index + 1} earlier`}
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
                      aria-label={`Move screenshot ${index + 1} later`}
                      onClick={() => move(index, 1)}
                    >
                      <ArrowRight className="h-3.5 w-3.5 rtl:-scale-x-100" />
                    </Button>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-primary-press"
                    disabled={isPending}
                    aria-label={row.isVisible ? "Hide from the home page" : "Show on the home page"}
                    onClick={() =>
                      act(() =>
                        setTestimonialVisibleAction({
                          testimonialId: row.id,
                          isVisible: !row.isVisible,
                        }),
                      )
                    }
                  >
                    {row.isVisible ? (
                      <Eye className="h-3.5 w-3.5" />
                    ) : (
                      <EyeOff className="h-3.5 w-3.5" />
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-primary-press"
                    disabled={isPending}
                    aria-label={`Delete screenshot ${index + 1}`}
                    onClick={() => setDeleting(row)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {archived.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Deleted
            </p>
            <button
              type="button"
              className="text-xs font-medium text-primary hover:text-primary-press"
              onClick={() =>
                setSelected((prev) =>
                  prev.size === archived.length ? new Set() : new Set(archived.map((r) => r.id)),
                )
              }
            >
              {selected.size === archived.length ? "Clear selection" : "Select all"}
            </button>
          </div>

          <BulkBar count={selectedArchived.length} onClear={() => setSelected(new Set())}>
            <Button
              variant="outline"
              size="sm"
              className="h-7 gap-1 px-2 text-xs"
              disabled={isPending}
              onClick={bulkRestore}
            >
              <RotateCcw className="h-3 w-3" />
              Restore
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 px-2 text-xs text-primary-press hover:text-primary-press"
              disabled={isPending}
              onClick={() => {
                setBulkConfirmText("");
                setBulkPurging(true);
              }}
            >
              <Trash2 className="h-3 w-3" />
              Delete forever
            </Button>
          </BulkBar>

          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {archived.map((row) => {
              const url = testimonialImageUrl(row.imagePath);
              return (
                <li
                  key={row.id}
                  className="relative overflow-hidden rounded-md border border-border bg-paper opacity-60"
                >
                  <div className="absolute start-1.5 top-1.5 z-10 rounded bg-card/90 p-0.5">
                    <Checkbox
                      checked={selected.has(row.id)}
                      onCheckedChange={() => toggleOne(row.id)}
                      aria-label="Select this screenshot"
                    />
                  </div>
                  <div className="aspect-[3/4]">
                    {url && <img src={url} alt="" className="h-full w-full object-cover" />}
                  </div>
                  <div className="flex items-center justify-center gap-1 border-t border-border bg-card px-1 py-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      disabled={isPending}
                      aria-label="Restore"
                      onClick={() => act(() => restoreTestimonialAction({ testimonialId: row.id }))}
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-primary-press"
                      disabled={isPending}
                      aria-label="Delete forever"
                      onClick={() => {
                        setSelected(new Set([row.id]));
                        setBulkConfirmText("");
                        setBulkPurging(true);
                      }}
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

      <AlertDialog open={deleting !== null} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this screenshot?</AlertDialogTitle>
            <AlertDialogDescription>
              It comes off the home page immediately. Nothing is removed from disk, so
              this can still be undone from the deleted list below.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!deleting) return;
                setOrder(order.filter((r) => r.id !== deleting.id));
                act(() => archiveTestimonialAction({ testimonialId: deleting.id }));
                setDeleting(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={bulkPurging}
        onOpenChange={(open) => {
          setBulkPurging(open);
          if (!open) setBulkConfirmText("");
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {selectedArchived.length} screenshot{selectedArchived.length === 1 ? "" : "s"}{" "}
              forever?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This cannot be undone — it is a real deletion, not another archive.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="testimonials-bulk-confirm" className="text-xs">
              Type <span className="font-mono font-semibold">DELETE</span> to confirm
            </Label>
            <Input
              id="testimonials-bulk-confirm"
              value={bulkConfirmText}
              onChange={(e) => setBulkConfirmText(e.target.value)}
              autoComplete="off"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep them</AlertDialogCancel>
            <AlertDialogAction disabled={bulkConfirmText.trim() !== "DELETE"} onClick={bulkPurge}>
              Delete forever
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
