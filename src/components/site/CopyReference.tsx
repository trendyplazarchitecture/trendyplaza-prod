"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { useTranslations } from "next-intl";

/**
 * The order reference, and a button that copies it.
 *
 * `dir="ltr"` on the value: `TP-2608-0001` is a code, not a sentence, and in
 * Arabic an unisolated string of Latin and digits puts the hyphens in the
 * wrong places.
 */
export function CopyReference({ reference }: { reference: string }) {
  const t = useTranslations("actions");
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(reference);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can be refused, and an unreadable failure is worse
      // than none: the reference is on screen and can be read off it.
    }
  }

  return (
    <div className="mt-2 flex items-center gap-3">
      <bdi dir="ltr" className="figures text-2xl font-extrabold tracking-tight sm:text-3xl">
        {reference}
      </bdi>

      <button
        type="button"
        onClick={copy}
        aria-label={copied ? t("copied") : t("copy")}
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-foreground/30 hover:bg-paper hover:text-foreground"
      >
        {copied ? (
          <Check className="h-4 w-4 text-primary" aria-hidden="true" />
        ) : (
          <Copy className="h-4 w-4" aria-hidden="true" />
        )}
      </button>

      <span aria-live="polite" className="sr-only">
        {copied ? t("copied") : ""}
      </span>
    </div>
  );
}
