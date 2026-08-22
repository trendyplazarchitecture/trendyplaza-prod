"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "../../../i18n/navigation";
import { authClient } from "@/lib/auth-client";
import { landingRouteAction } from "@/server/actions/orders";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Sign in and sign up, one component, because they differ by two fields and a
 * verb and keeping them apart guarantees they drift.
 *
 * Errors name the problem and the recovery. Better Auth returns a generic
 * message for bad credentials on purpose, so we do not leak which half was
 * wrong, but the copy still tells the person what to try.
 */
export function AuthForm({ mode }: { mode: "signin" | "signup" }) {
  const t = useTranslations("auth");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const next = searchParams.get("next");

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const name = String(form.get("name") ?? "").trim();

    startTransition(async () => {
      const result =
        mode === "signup"
          ? await authClient.signUp.email({ email, password, name })
          : await authClient.signIn.email({ email, password });

      if (result.error) {
        setError(
          mode === "signup"
            ? t("errors.signupFailed")
            : t("errors.badCredentials"),
        );
        return;
      }

      // Staff land on the admin, students on their account.
      if (next && next.startsWith("/")) {
        window.location.href = next;
      } else {
        try {
          const { href } = await landingRouteAction();
          window.location.href = href && href !== "/login" ? href : "/admin";
        } catch {
          window.location.href = "/admin";
        }
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {mode === "signup" && (
        <div className="space-y-1.5">
          <Label htmlFor="name">{t("name")}</Label>
          <Input id="name" name="name" required autoComplete="name" className="h-11" />
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="email">{t("email")}</Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          className="h-11"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password">{t("password")}</Label>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            required
            minLength={8}
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            className="h-11 pe-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute end-0 top-0 flex h-11 w-11 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Eye className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </div>
        {mode === "signup" && (
          <p className="text-xs text-muted-foreground">{t("passwordHint")}</p>
        )}
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-md border border-primary/25 bg-primary/5 px-3 py-2.5 text-sm text-primary-press"
        >
          {error}
        </p>
      )}

      <Button type="submit" disabled={isPending} size="lg" className="h-11 w-full font-semibold">
        {isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
        {mode === "signup" ? t("createAccount") : t("signIn")}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        {mode === "signup" ? t("haveAccount") : t("noAccount")}{" "}
        <Link
          href={mode === "signup" ? "/login" : "/signup"}
          className="font-semibold text-primary-press underline-offset-4 hover:underline"
        >
          {mode === "signup" ? t("signIn") : t("createAccount")}
        </Link>
      </p>
    </form>
  );
}
