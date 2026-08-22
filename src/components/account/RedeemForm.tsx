"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { redeemCodeAction, type RedeemFailure } from "@/server/actions/student";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * The primary way into the LMS: the code printed on the card inside a pack.
 *
 * The input is `dir="ltr"` and uppercase because a code is a code, not a
 * sentence, and it is being copied off paper by someone on a phone. Spaces and
 * dashes are stripped server-side by `normaliseCode`, so a student typing the
 * card exactly as printed always works.
 */
export function RedeemForm() {
  const t = useTranslations("account.redeem");
  const router = useRouter();
  const [pending, start] = useTransition();
  const [failure, setFailure] = useState<RedeemFailure | null>(null);

  const reason: Record<RedeemFailure, string> = {
    not_found: t("errors.notFound"),
    already_redeemed: t("errors.alreadyRedeemed"),
    voided: t("errors.voided"),
    expired: t("errors.expired"),
    already_entitled: t("errors.alreadyEntitled"),
    rate_limited: t("errors.rateLimited"),
    invalid: t("errors.notFound"),
  };

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const code = String(form.get("code") ?? "").trim();
    if (!code) return;

    setFailure(null);
    start(async () => {
      const result = await redeemCodeAction({ code });
      if (result.ok) {
        // A successful redemption changes what every page is allowed to show,
        // so the server components are re-run rather than patched in place.
        router.refresh();
        return;
      }
      setFailure(result.reason);
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="code">{t("label")}</Label>
        <Input
          id="code"
          name="code"
          dir="ltr"
          required
          autoCapitalize="characters"
          autoComplete="off"
          spellCheck={false}
          placeholder="TP-XXXX-XXXX"
          aria-invalid={!!failure}
          aria-describedby={failure ? "code-error" : "code-hint"}
          className="h-12 text-center font-mono text-base tracking-[0.18em] uppercase"
        />
        {failure ? (
          <p id="code-error" role="alert" className="text-xs text-primary-press">
            {reason[failure]}
          </p>
        ) : (
          <p id="code-hint" className="text-xs text-muted-foreground">
            {t("hint")}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary-press disabled:opacity-60"
      >
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <KeyRound className="h-4 w-4" aria-hidden="true" />
        )}
        {t("submit")}
      </button>
    </form>
  );
}
