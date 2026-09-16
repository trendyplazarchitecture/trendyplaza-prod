"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowLeft, ArrowRight, ImageOff, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  deleteProductImageAction,
  reorderProductImagesAction,
  type ActionResult,
} from "@/server/actions/products";
import { Button } from "@/components/ui/button";
import { productImageUrl } from "@/lib/media";
import { cn } from "@/lib/utils";

export type GalleryImage = { id: string; path: string; position: number; altEn: string | null };

/**
 * The gallery editor.
 *
 * Reorder is by arrow rather than by drag. Dragging is the nicer gesture and
 * it is also the one that does not work on a phone without a library and a
 * fight with the dialog's own scroll. The client reorders four images twice a
 * month; two buttons that always work beat a gesture that sometimes does.
 *
 * The first image is the one on the product card, and the badge says so,
 * because "position 0" means nothing to the person arranging them.
 */
export function ProductGallery({
  productId,
  images,
}: {
  productId: string;
  images: GalleryImage[];
}) {
  const t = useTranslations("admin.productGallery");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  // Ordered locally so the arrows respond immediately. The server is the
  // authority; this is only what the eye sees while it answers.
  const [order, setOrder] = useState(images);

  function act(fn: () => Promise<ActionResult>) {
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

  function move(index: number, by: -1 | 1) {
    const next = [...order];
    const target = index + by;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setOrder(next);
    act(() =>
      reorderProductImagesAction({ productId, imageIds: next.map((i) => i.id) }),
    );
  }

  if (order.length === 0) {
    return (
      <p className="flex items-center gap-2 rounded-md border border-dashed border-border px-3 py-6 text-sm text-muted-foreground">
        <ImageOff className="h-4 w-4" aria-hidden="true" />
        {t("emptyHint")}
      </p>
    );
  }

  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {order.map((image, index) => {
        const url = productImageUrl(image.path);
        return (
          <li
            key={image.id}
            className={cn(
              "group relative overflow-hidden rounded-md border border-border bg-paper transition-colors",
              index === 0 && "border-primary",
            )}
          >
            <div className="aspect-square">
              {url && (
                <img
                  src={url}
                  alt={image.altEn ?? ""}
                  className="h-full w-full object-cover"
                />
              )}
            </div>

            {index === 0 && (
              <span className="ui-dense absolute top-1.5 start-1.5 inline-flex items-center gap-1 rounded bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
                <Star className="h-2.5 w-2.5" aria-hidden="true" />
                {t("onTheCard")}
              </span>
            )}

            <div className="flex items-center justify-between border-t border-border bg-card px-1 py-1">
              <div className="flex">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  disabled={isPending || index === 0}
                  aria-label={t("moveEarlier", { number: index + 1 })}
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
                  aria-label={t("moveLater", { number: index + 1 })}
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
                aria-label={t("removeImage", { number: index + 1 })}
                onClick={() => {
                  setOrder(order.filter((i) => i.id !== image.id));
                  act(() => deleteProductImageAction({ imageId: image.id }));
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
