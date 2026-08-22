"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Archive, FolderCog, Loader2, Pencil, Plus, RotateCcw, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import {
  archiveCategoryAction,
  deleteCategoryAction,
  restoreCategoryAction,
  saveCategoryAction,
  type ActionResult,
} from "@/server/actions/products";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { TriLingualField } from "./TriLingual";
import { cn } from "@/lib/utils";

export type CategoryRow = {
  id: string;
  key: string;
  labelEn: string;
  labelAr: string | null;
  labelFr: string | null;
  archivedAt: Date | null;
};

/**
 * The rayons the shop is organised into, editable from here instead of a
 * developer changing an enum. `products.category_id` is `RESTRICT`, so a
 * category still in use cannot be deleted — archive it instead, which keeps
 * existing products correctly labelled but stops it being offered again.
 */
export function ProductCategoriesManager({ categories }: { categories: CategoryRow[] }) {
  const t = useTranslations("admin.productCategories");
  const tc = useTranslations("admin.common");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CategoryRow | "new" | null>(null);
  const [isPending, startTransition] = useTransition();

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
        toast.error(t("genericError"));
      }
    });
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    if (editing && editing !== "new") form.set("id", editing.id);
    act(() => saveCategoryAction(form));
  }

  const current = editing !== "new" ? editing : null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1.5">
          <FolderCog className="h-3.5 w-3.5" aria-hidden="true" />
          {t("trigger")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("dialogTitle")}</DialogTitle>
          <DialogDescription>{t("dialogDescription")}</DialogDescription>
        </DialogHeader>

        <ul className="divide-y divide-border rounded-lg border border-border">
          {categories.map((c) =>
            editing !== "new" && current?.id === c.id ? (
              <li key={c.id} className="p-3">
                <form onSubmit={submit} className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label htmlFor={`key-${c.id}`} className="text-xs">
                        {t("keyLabel")}
                      </Label>
                      <Input
                        id={`key-${c.id}`}
                        name="key"
                        required
                        defaultValue={c.key}
                        className="ui-dense h-8 text-sm"
                      />
                    </div>
                  </div>
                  <TriLingualField
                    name="label"
                    label={t("labelFieldLabel")}
                    values={{ En: c.labelEn, Ar: c.labelAr, Fr: c.labelFr }}
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setEditing(null)}
                    >
                      {tc("cancel")}
                    </Button>
                    <Button type="submit" size="sm" disabled={isPending}>
                      {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />}
                      {tc("save")}
                    </Button>
                  </div>
                </form>
              </li>
            ) : (
              <li
                key={c.id}
                className={cn(
                  "flex items-center justify-between gap-3 px-3 py-2.5",
                  c.archivedAt && "opacity-60",
                )}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{c.labelEn}</p>
                  <p className="figures truncate text-xs text-muted-foreground">
                    {c.key}
                    {!c.labelAr && <span className="ms-2 text-amber-700">{t("noArabic")}</span>}
                    {c.archivedAt && <span className="ms-2">· {t("archivedSuffix")}</span>}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {c.archivedAt ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      aria-label={t("restore", { name: c.labelEn })}
                      disabled={isPending}
                      onClick={() => act(() => restoreCategoryAction({ categoryId: c.id }))}
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        aria-label={t("edit", { name: c.labelEn })}
                        onClick={() => setEditing(c)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        aria-label={t("archive", { name: c.labelEn })}
                        disabled={isPending}
                        onClick={() => act(() => archiveCategoryAction({ categoryId: c.id }))}
                      >
                        <Archive className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-primary-press"
                    aria-label={t("delete", { name: c.labelEn })}
                    disabled={isPending}
                    onClick={() => {
                      if (confirm(t("deleteConfirm", { name: c.labelEn }))) {
                        act(() => deleteCategoryAction({ categoryId: c.id }));
                      }
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </li>
            ),
          )}
        </ul>

        {editing === "new" ? (
          <form onSubmit={submit} className="space-y-3 rounded-lg border border-border p-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">{t("newHeading")}</p>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setEditing(null)}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="space-y-1">
              <Label htmlFor="new-key" className="text-xs">
                {t("keyLabel")}
              </Label>
              <Input
                id="new-key"
                name="key"
                required
                placeholder={t("newKeyPlaceholder")}
                className="ui-dense h-8 text-sm"
              />
              <p className="text-xs text-muted-foreground">{t("newKeyHint")}</p>
            </div>
            <TriLingualField name="label" label={t("labelFieldLabel")} />
            <div className="flex justify-end">
              <Button type="submit" size="sm" disabled={isPending}>
                {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />}
                {t("add")}
              </Button>
            </div>
          </form>
        ) : (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="gap-1.5"
            onClick={() => setEditing("new")}
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            {t("newButton")}
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}
