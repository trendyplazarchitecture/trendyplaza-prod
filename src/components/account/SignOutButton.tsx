"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LogOut } from "lucide-react";
import { useTranslations } from "next-intl";

import { authClient } from "@/lib/auth-client";

export function SignOutButton() {
  const t = useTranslations("account");
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        start(async () => {
          await authClient.signOut();
          // `replace`, not `push`: the account page behind us is gone now, and
          // the back button should not take a signed-out person to it.
          router.replace("/");
          router.refresh();
        })
      }
      className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground disabled:opacity-60"
    >
      {pending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
      ) : (
        <LogOut className="h-3.5 w-3.5 rtl:-scale-x-100" aria-hidden="true" />
      )}
      {t("signOut")}
    </button>
  );
}
