"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

/**
 * Recovers from a stale build automatically, site-wide.
 *
 * This project redeploys often — a browser tab left open across any
 * redeploy is running JavaScript that references chunk files and server
 * action IDs the new build no longer has. Next.js rotates both on every
 * build. The result is `ChunkLoadError` (a chunk 404s) or a failed
 * dynamic import, and it looks like the site "just breaks" rather than
 * showing a clear error — worse on mobile, where a browser tab can sit
 * backgrounded for days without ever reloading on its own.
 *
 * `CommanderClient.tsx` already handles this for the one checkout call
 * specifically (treats any exception from `placeOrderAction` as a stale
 * build and reloads). This component is the same recovery, mounted once
 * in the root layout, for everywhere else: it does not touch every call
 * site, it catches the actual browser-level symptom — a failed chunk or
 * module load — wherever it happens, and reloads automatically.
 *
 * Deliberately narrow in what it matches: only chunk/module load
 * failures, not "failed to fetch" in general, which is indistinguishable
 * from the visitor simply being offline and would otherwise reload people
 * who have no connectivity at all into the same failure, repeatedly.
 */
const STALE_BUILD_PATTERN =
  /ChunkLoadError|Loading chunk [\d]+ failed|Failed to fetch dynamically imported module|Importing a module script failed/i;

const RELOAD_GUARD_KEY = "tp-stale-build-reload-at";
const RELOAD_GUARD_WINDOW_MS = 15_000;

function alreadyReloadedRecently(): boolean {
  try {
    const last = sessionStorage.getItem(RELOAD_GUARD_KEY);
    return last !== null && Date.now() - Number(last) < RELOAD_GUARD_WINDOW_MS;
  } catch {
    // Private browsing can throw on sessionStorage access. Fail open —
    // worst case this reloads once more than strictly necessary.
    return false;
  }
}

function markReloaded() {
  try {
    sessionStorage.setItem(RELOAD_GUARD_KEY, String(Date.now()));
  } catch {
    // Same as above — not fatal if this can't be recorded.
  }
}

export function StaleBuildRecovery() {
  const t = useTranslations("staleBuild");
  const [recovering, setRecovering] = useState(false);

  useEffect(() => {
    function recover() {
      if (alreadyReloadedRecently()) return;
      markReloaded();
      setRecovering(true);
      setTimeout(() => window.location.reload(), 1200);
    }

    function onError(event: ErrorEvent) {
      const text = `${event.message ?? ""} ${event.error?.name ?? ""}`;
      if (STALE_BUILD_PATTERN.test(text)) recover();
    }

    function onRejection(event: PromiseRejectionEvent) {
      const reason = event.reason;
      const text =
        typeof reason === "string"
          ? reason
          : `${reason?.message ?? ""} ${reason?.name ?? ""}`;
      if (STALE_BUILD_PATTERN.test(text)) recover();
    }

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  if (!recovering) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-0 top-0 z-[999] flex items-center justify-center gap-2 bg-foreground px-4 py-2.5 text-center text-sm font-medium text-background"
    >
      <span className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-background/40 border-t-background" />
      {t("message")}
    </div>
  );
}
