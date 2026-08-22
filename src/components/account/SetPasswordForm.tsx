"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Eye, EyeOff, Loader2 } from "lucide-react";

import { setPasswordAction } from "@/server/actions/set-password";
import { Link } from "../../../i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Where an invited person sets their own password.
 *
 * Deliberately plain. Whoever lands here was sent a link by someone at the
 * school and has no account yet, so there is nothing to navigate and nothing
 * to decide: one field, one button.
 *
 * The error is inline rather than a toast. `<Toaster />` is mounted in the
 * admin layout only, so a toast raised from this page would do nothing at all,
 * silently.
 */
export function SetPasswordForm({ token }: { token: string }) {
  const [isPending, startTransition] = useTransition();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <div className="sheet-ticks rounded-xl border border-rule bg-card p-6 text-center">
        <CheckCircle2 className="mx-auto h-8 w-8 text-primary" aria-hidden="true" />
        <h1 className="mt-4 text-lg font-bold">Password set</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          You can sign in with your email address now.
        </p>
        <Link
          href="/login"
          className="mt-5 inline-flex h-11 items-center justify-center rounded-lg bg-primary px-6 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary-press"
        >
          Sign in
        </Link>
      </div>
    );
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    // Checked here as well as on the server, because mistyping a password you
    // cannot see is the normal case, not an attack.
    if (password !== confirm) {
      setError("The two passwords do not match.");
      return;
    }

    startTransition(async () => {
      const result = await setPasswordAction({ token, password });
      if (result.ok) setDone(true);
      else setError(result.message);
    });
  }

  return (
    <form onSubmit={submit} className="sheet-ticks rounded-xl border border-rule bg-card p-6">
      <h1 className="text-lg font-bold">Choose a password</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Ten characters or more. Nobody at the school can see it.
      </p>

      <div className="mt-5 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              minLength={10}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pe-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute end-0 top-0 flex h-9 w-9 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Eye className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirm">Type it again</Label>
          <div className="relative">
            <Input
              id="confirm"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="pe-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute end-0 top-0 flex h-9 w-9 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Eye className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <p role="alert" className="mt-4 text-sm text-primary-press">
          {error}
        </p>
      )}

      <Button type="submit" className="mt-5 h-11 w-full" disabled={isPending}>
        {isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
        Set my password
      </Button>
    </form>
  );
}
