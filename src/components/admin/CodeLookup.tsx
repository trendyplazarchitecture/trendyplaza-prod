"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Ban, Loader2, Search, User } from "lucide-react";
import { toast } from "sonner";

import { lookupCodeAction, voidCodeAction } from "@/server/actions/access";
import type { CodeLookup as Result } from "@/server/codes";
import { StatusPill, type Tone } from "./StatusPill";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function when(date: Date | null | undefined) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/**
 * The support desk tool.
 *
 * A student rings and reads a code off a card. The operator pastes whatever
 * they heard, in whatever shape, and gets one answer: does it work, and if
 * not, who used it. Input is normalised exactly the way redemption normalises
 * it, so this screen can never disagree with what the student sees.
 */
export function CodeLookup() {
  const t = useTranslations("admin.codeLookup");
  const router = useRouter();
  const [raw, setRaw] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [voidOpen, setVoidOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [isPending, startTransition] = useTransition();

  const STATE: Record<string, { label: string; tone: Tone; blurb: string }> = {
    unused: { label: t("stateUnused"), tone: "done", blurb: t("stateUnusedBlurb") },
    redeemed: { label: t("stateRedeemed"), tone: "alert", blurb: t("stateRedeemedBlurb") },
    void: { label: t("stateVoid"), tone: "halted", blurb: t("stateVoidBlurb") },
  };

  function search(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!raw.trim()) return;

    startTransition(async () => {
      try {
        setResult(await lookupCodeAction({ code: raw }));
      } catch {
        toast.error(t("lookupFailed"));
      }
    });
  }

  const state = result?.state ? STATE[result.state] : null;

  return (
    <div className="space-y-4">
      <form onSubmit={search} className="space-y-1.5">
        <label htmlFor="code-lookup" className="text-sm font-medium">
          {t("pasteACode")}
        </label>

        {/*
          The input and the button are one row, not two flex items aligned
          "end" against a taller label+hint stack — that pushed the button
          down to float beside the hint text, disconnected from the field it
          belongs to. The hint now sits below the whole row instead.
        */}
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative min-w-0 flex-1">
            <Search
              className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              id="code-lookup"
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
              placeholder="TPS1-7K4M-9QXR or tps1 7k4m 9qxr"
              className="figures h-11 ps-9 text-base tracking-wide uppercase"
              autoComplete="off"
              spellCheck={false}
            />
          </div>
          <Button
            type="submit"
            size="lg"
            disabled={isPending || !raw.trim()}
            className="h-11 shrink-0 gap-1.5"
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            {t("lookItUp")}
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">{t("caseHint")}</p>
      </form>

      {result && !result.found && (
        <div className="rounded-lg border border-border bg-card p-5">
          <p className="text-sm font-semibold">{t("noCodeMatches")}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {t.rich("readBack", {
              value: result.normalised || t("nothing"),
              strong: (chunks) => (
                <span className="figures font-semibold text-foreground">{chunks}</span>
              ),
            })}
          </p>
        </div>
      )}

      {result?.found && state && (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
            <div>
              <p className="figures text-lg font-bold tracking-wide">{result.printed}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{state.blurb}</p>
            </div>
            <StatusPill tone={state.tone}>{state.label}</StatusPill>
          </div>

          <dl className="grid gap-x-6 gap-y-3 px-5 py-4 text-sm sm:grid-cols-2">
            <div className="flex gap-2">
              <dt className="w-28 shrink-0 text-muted-foreground">{t("opens")}</dt>
              <dd className="font-medium">{result.packageTitleEn ?? "—"}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-28 shrink-0 text-muted-foreground">{t("batch")}</dt>
              <dd className="font-medium">{result.batchLabel ?? t("singleCode")}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-28 shrink-0 text-muted-foreground">{t("lasts")}</dt>
              <dd className="figures font-medium">
                {result.durationDays
                  ? t("durationDays", { count: result.durationDays })
                  : t("unlimited")}
              </dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-28 shrink-0 text-muted-foreground">{t("created")}</dt>
              <dd className="figures">{when(result.createdAt)}</dd>
            </div>
            {result.orderReference && (
              <div className="flex gap-2">
                <dt className="w-28 shrink-0 text-muted-foreground">{t("order")}</dt>
                <dd className="figures font-medium">{result.orderReference}</dd>
              </div>
            )}
            {result.voidedAt && (
              <div className="flex gap-2 sm:col-span-2">
                <dt className="w-28 shrink-0 text-muted-foreground">{t("voided")}</dt>
                <dd>
                  <span className="figures">{when(result.voidedAt)}</span>
                  {result.voidReason && (
                    <span className="block text-muted-foreground">{result.voidReason}</span>
                  )}
                </dd>
              </div>
            )}
          </dl>

          {/* The answer to "who used it". */}
          {result.holder ? (
            <div className="border-t border-border bg-paper/60 px-5 py-4">
              <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">
                <User className="h-3.5 w-3.5" aria-hidden="true" />
                {t("usedBy")}
              </p>
              <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="font-semibold">{result.holder.name}</span>
                <span className="text-sm text-muted-foreground">{result.holder.email}</span>
                {result.holder.phone && (
                  <span className="figures text-sm text-muted-foreground">
                    <bdi dir="ltr">{result.holder.phone}</bdi>
                  </span>
                )}
              </div>
              <p className="mt-1.5 text-sm text-muted-foreground">
                {t("redeemedOn", { date: when(result.redeemedAt) })}
                {result.holder.entitlementStatus && (
                  <>
                    {" · "}
                    {t("accessIs")}{" "}
                    <span className="font-medium text-foreground">
                      {result.holder.entitlementStatus}
                    </span>
                  </>
                )}
                {result.holder.expiresAt && (
                  <> {t("untilDate", { date: when(result.holder.expiresAt) })}</>
                )}
              </p>
            </div>
          ) : result.state === "redeemed" ? (
            <div className="border-t border-border bg-paper/60 px-5 py-4">
              <p className="text-sm text-muted-foreground">
                {t("redeemedButRemoved", { date: when(result.redeemedAt) })}
              </p>
            </div>
          ) : null}

          {result.state === "unused" && (
            <div className="flex items-center gap-2 border-t border-border px-5 py-3">
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5"
                onClick={() => {
                  setReason("");
                  setVoidOpen(true);
                }}
              >
                <Ban className="h-3.5 w-3.5" aria-hidden="true" />
                {t("voidThisCode")}
              </Button>
              <p className="text-xs text-muted-foreground">{t("voidHint")}</p>
            </div>
          )}
        </div>
      )}

      <Dialog open={voidOpen} onOpenChange={setVoidOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("voidConfirmTitle", { code: result?.printed ?? "" })}</DialogTitle>
            <DialogDescription>{t("voidConfirmDescription")}</DialogDescription>
          </DialogHeader>

          <div className="space-y-1.5">
            <label htmlFor="void-reason" className="text-sm font-medium">
              {t("reasonLabel")}
            </label>
            <Textarea
              id="void-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t("reasonPlaceholder")}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setVoidOpen(false)}>
              {t("keepItUsable")}
            </Button>
            <Button
              disabled={reason.trim().length < 3 || !result?.codeId}
              onClick={() => {
                const codeId = result?.codeId;
                if (!codeId) return;
                setVoidOpen(false);
                startTransition(async () => {
                  const out = await voidCodeAction({ codeId, reason: reason.trim() });
                  if (out.ok) {
                    toast.success(out.message);
                    setResult(await lookupCodeAction({ code: raw }));
                    router.refresh();
                  } else {
                    toast.error(out.message);
                  }
                });
              }}
            >
              {t("voidIt")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
