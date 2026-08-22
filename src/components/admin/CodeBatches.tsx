"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Download, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

import { createBatchAction, type ActionResult } from "@/server/actions/access";
import { Empty } from "./AdminChrome";
import { StatusPill } from "./StatusPill";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type BatchRow = {
  id: string;
  label: string;
  prefix: string;
  quantity: number;
  redeemedCount: number;
  durationDays: number | null;
  createdAt: Date;
  exportedAt: Date | null;
  packageTitle: string;
};

/**
 * Code batches.
 *
 * A batch is printed onto cards and sealed into boxes before any order
 * exists, so the flow here is: name it, choose the package, choose how many,
 * generate, export, send to the printer. Nothing on this screen touches an
 * order, and the primary action after generating is the export, because an
 * unexported batch is a batch nobody can print.
 */
export function CodeBatches({
  rows,
  packages,
}: {
  rows: BatchRow[];
  packages: { id: string; title: string; defaultDurationDays: number | null }[];
}) {
  const t = useTranslations("admin.codeBatches");
  const tc = useTranslations("admin.common");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [packageId, setPackageId] = useState(packages[0]?.id ?? "");

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const durationRaw = String(form.get("durationDays") ?? "").trim();

    startTransition(async () => {
      try {
        const result: ActionResult & { batchId?: string } = await createBatchAction({
          label: String(form.get("label") ?? ""),
          packageId,
          prefix: String(form.get("prefix") ?? ""),
          quantity: Number(form.get("quantity") ?? 0),
          durationDays: durationRaw ? Number(durationRaw) : null,
        });

        if (result.ok) {
          toast.success(result.message);
          setOpen(false);
          router.refresh();
        } else {
          toast.error(result.message);
        }
      } catch {
        toast.error(t("genericError"));
      }
    });
  }

  const selected = packages.find((p) => p.id === packageId);

  return (
    <>
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5" disabled={packages.length === 0}>
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              {t("newBatch")}
            </Button>
          </DialogTrigger>

          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("generateBatch")}</DialogTitle>
              <DialogDescription>{t("generateBatchDescription")}</DialogDescription>
            </DialogHeader>

            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="label">{t("batchNameLabel")}</Label>
                <Input
                  id="label"
                  name="label"
                  required
                  minLength={3}
                  placeholder={t("batchNamePlaceholder")}
                />
                <p className="text-xs text-muted-foreground">{t("batchNameHint")}</p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="package">{t("opensLabel")}</Label>
                <Select value={packageId} onValueChange={setPackageId}>
                  <SelectTrigger id="package">
                    <SelectValue placeholder={t("choosePackage")} />
                  </SelectTrigger>
                  <SelectContent>
                    {packages.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="prefix">{t("prefixLabel")}</Label>
                  <Input
                    id="prefix"
                    name="prefix"
                    required
                    maxLength={8}
                    defaultValue="TPS1"
                    className="figures uppercase"
                  />
                  <p className="text-xs text-muted-foreground">{t("prefixHint")}</p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="quantity">{t("quantityLabel")}</Label>
                  <Input
                    id="quantity"
                    name="quantity"
                    type="number"
                    required
                    min={1}
                    max={2000}
                    defaultValue={100}
                    className="figures"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="durationDays">{t("durationLabel")}</Label>
                <Input
                  id="durationDays"
                  name="durationDays"
                  type="number"
                  min={1}
                  max={3650}
                  defaultValue={selected?.defaultDurationDays ?? undefined}
                  placeholder={t("durationPlaceholder")}
                  className="figures"
                />
                <p className="text-xs text-muted-foreground">{t("durationHint")}</p>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  {tc("cancel")}
                </Button>
                <Button type="submit" disabled={isPending || !packageId}>
                  {isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                  {t("generate")}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {rows.length === 0 ? (
        <Empty title={t("emptyTitle")} hint={t("emptyHint")} />
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {rows.map((batch) => {
            const left = batch.quantity - batch.redeemedCount;
            const usedPct = Math.round((batch.redeemedCount / batch.quantity) * 100);

            return (
              <li key={batch.id} className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{batch.label}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {batch.packageTitle}
                      {" · "}
                      {batch.durationDays
                        ? t("durationDays", { count: batch.durationDays })
                        : t("unlimited")}
                    </p>
                  </div>
                  <span className="figures ui-dense shrink-0 rounded border border-border bg-paper px-1.5 py-0.5 text-xs font-semibold">
                    {batch.prefix}
                  </span>
                </div>

                <div className="mt-4 flex items-baseline gap-2">
                  <span className="figures text-2xl font-bold">{left}</span>
                  <span className="text-xs text-muted-foreground">
                    {t("stillUnredeemed", { total: batch.quantity })}
                  </span>
                </div>

                {/* A plain proportion bar. It is the one number that matters
                    on this card: how many cards are still out there. */}
                <div
                  className="mt-2 h-1.5 w-full overflow-hidden rounded-sm bg-paper"
                  role="img"
                  aria-label={t("redeemedOf", {
                    redeemed: batch.redeemedCount,
                    total: batch.quantity,
                  })}
                >
                  <div
                    className="h-full bg-primary transition-[width] duration-500"
                    style={{ width: `${usedPct}%` }}
                  />
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <Button asChild size="sm" variant="outline" className="gap-1.5">
                    <a href={`/api/admin/codes/${batch.id}/export`}>
                      <Download className="h-3.5 w-3.5" aria-hidden="true" />
                      {t("exportForPrint")}
                    </a>
                  </Button>
                  {batch.exportedAt ? (
                    <span className="text-xs text-muted-foreground">
                      {t("exportedOn", {
                        date: batch.exportedAt.toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                        }),
                      })}
                    </span>
                  ) : (
                    <StatusPill tone="pending">{t("notExported")}</StatusPill>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
