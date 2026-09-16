"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * A small icon that copies a customer's own detail — a phone number, an
 * email, an order reference — without the operator selecting the text by
 * hand and hoping they got the boundaries right on a table cell.
 *
 * A checkmark for a second and a half, not a toast: this is meant to sit
 * inline in a dense row, and a toast is a full-width interruption for a
 * confirmation that only needs to be visible right where the click happened.
 */
export function CopyButton({
  value,
  label,
  className,
}: {
  value: string;
  /** Read to screen readers and shown as the title: "Copy phone number". */
  label: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy(event: React.MouseEvent) {
    // Rows this sits in are often themselves clickable (a link to the order,
    // a row that opens a sheet); the copy action must not also trigger that.
    event.preventDefault();
    event.stopPropagation();

    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      // Clipboard access refused (an insecure context, a locked-down
      // browser). Silent: there is nothing more useful to tell the operator
      // than the icon simply not changing, and no toast is worth interrupting
      // a dense table for.
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      title={label}
      aria-label={label}
      className={cn(
        "inline-flex h-5 w-5 shrink-0 items-center justify-center rounded text-muted-foreground/60 transition-colors hover:bg-paper hover:text-foreground",
        copied && "text-emerald-600",
        className,
      )}
    >
      {copied ? (
        <Check className="h-3 w-3" aria-hidden="true" />
      ) : (
        <Copy className="h-3 w-3" aria-hidden="true" />
      )}
    </button>
  );
}
