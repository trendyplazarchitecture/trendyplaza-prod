"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, FileUp, Loader2, Upload } from "lucide-react";
import { useTranslations } from "next-intl";

import {
  submitAccessRequestAction,
  type AccessRequestResult,
} from "@/server/actions/student";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDzd } from "@/lib/money";
import { cn } from "@/lib/utils";

type Failure = Extract<AccessRequestResult, { ok: false }>["reason"];

export type PackageOption = {
  id: string;
  title: string;
  priceDzd: number;
  defaultDurationDays: number | null;
};

/**
 * Path B, for a student with no card: copy the RIP, send the transfer from
 * Baridimob, photograph the receipt, upload it.
 *
 * The RIP sits at the top with a copy button because it is the step that
 * happens outside this page, in another app, and a number retyped by hand from
 * a phone screen is a transfer that arrives at the wrong account.
 */
export function ReceiptForm({
  packages,
  rip,
  locale,
}: {
  packages: PackageOption[];
  rip: string;
  locale: "en" | "ar" | "fr";
}) {
  const t = useTranslations("account.receipt");
  const tActions = useTranslations("actions");
  const router = useRouter();
  const priceLocale = locale === "en" ? "fr" : locale;

  const [pending, start] = useTransition();
  const [failure, setFailure] = useState<Failure | null>(null);
  const [copied, setCopied] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const reason: Record<Failure, string> = {
    too_large: t("errors.tooLarge"),
    unsupported_type: t("errors.unsupportedType"),
    duplicate_pending: t("errors.duplicatePending"),
    no_file: t("errors.noFile"),
    invalid: t("errors.invalid"),
    rate_limited: t("errors.rateLimited"),
  };

  async function copyRip() {
    try {
      await navigator.clipboard.writeText(rip);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // The number is on screen and readable. A failed copy is not an error
      // worth interrupting the flow for.
    }
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    setFailure(null);
    start(async () => {
      const result = await submitAccessRequestAction(form);
      if (result.ok) {
        router.refresh();
        return;
      }
      setFailure(result.reason);
    });
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-rule bg-paper p-4">
        <p className="text-xs font-bold tracking-[0.14em] text-muted-foreground uppercase">
          {t("ripLabel")}
        </p>
        <div className="mt-2 flex items-center gap-3">
          <bdi dir="ltr" className="figures text-lg font-extrabold tracking-wide sm:text-xl">
            {rip}
          </bdi>
          <button
            type="button"
            onClick={copyRip}
            aria-label={copied ? tActions("copied") : tActions("copy")}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-card text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
          >
            {copied ? (
              <Check className="h-4 w-4 text-primary" aria-hidden="true" />
            ) : (
              <Copy className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">{t("ripHint")}</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <fieldset className="space-y-2">
          <legend className="mb-2 text-sm font-medium">{t("choosePackage")}</legend>
          <div className="space-y-2">
            {packages.map((pkg, i) => (
              <label
                key={pkg.id}
                className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-4 transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/[0.03]"
              >
                <input
                  type="radio"
                  name="packageId"
                  value={pkg.id}
                  defaultChecked={i === 0}
                  required
                  className="mt-0.5 h-4 w-4 accent-[oklch(0.588_0.226_27.5)]"
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">{pkg.title}</span>
                  <span className="figures mt-0.5 block text-sm">
                    {formatDzd(pkg.priceDzd, priceLocale)}
                    {pkg.defaultDurationDays !== null && (
                      <span className="ms-2 text-xs text-muted-foreground">
                        {t("forDays", { days: pkg.defaultDurationDays })}
                      </span>
                    )}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="space-y-1.5">
          <Label htmlFor="amountClaimedDzd">{t("amount")}</Label>
          <Input
            id="amountClaimedDzd"
            name="amountClaimedDzd"
            type="number"
            inputMode="numeric"
            min={0}
            dir="ltr"
            className="figures h-11 max-w-44"
          />
          <p className="text-xs text-muted-foreground">{t("amountHint")}</p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="receipt">{t("file")}</Label>

          {/* The real input is kept in the layout but visually replaced: the
              native control cannot be styled, and its default label is the
              browser's own wording in the browser's own language. */}
          <input
            ref={fileInput}
            id="receipt"
            name="receipt"
            type="file"
            required
            accept="image/jpeg,image/png,image/webp,application/pdf"
            onChange={(e) => setFileName(e.currentTarget.files?.[0]?.name ?? null)}
            className="sr-only"
          />
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg border border-dashed px-4 py-5 text-start transition-colors",
              fileName
                ? "border-primary bg-primary/[0.03]"
                : "border-border hover:border-foreground/30 hover:bg-paper",
            )}
          >
            <FileUp className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">
                {fileName ?? t("filePrompt")}
              </span>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                {t("fileHint")}
              </span>
            </span>
          </button>
        </div>

        {failure && (
          <p
            role="alert"
            className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm"
          >
            {reason[failure]}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary-press disabled:opacity-60"
        >
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Upload className="h-4 w-4" aria-hidden="true" />
          )}
          {pending ? t("submitting") : t("submit")}
        </button>

        <p className="text-xs text-muted-foreground">{t("reviewWindow")}</p>
      </form>
    </div>
  );
}
