"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";

/**
 * The route-segment error boundary, complementing `StaleBuildRecovery`.
 *
 * That component catches stale-build failures at the `window` level —
 * script/chunk load errors that happen outside React's render cycle.
 * This catches the other half: an error thrown *during* a render (e.g. a
 * component that fails because a chunk it needed came back malformed
 * rather than outright failing to load). Same stale-build signature is
 * checked here too, since a render-time throw can carry it just as
 * easily as a script-load failure can.
 */
const STALE_BUILD_PATTERN =
  /ChunkLoadError|Loading chunk [\d]+ failed|Failed to fetch dynamically imported module|Importing a module script failed/i;

export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("errorBoundary");
  const staleBuild = STALE_BUILD_PATTERN.test(`${error.message} ${error.name}`);

  useEffect(() => {
    if (staleBuild) {
      const timer = setTimeout(() => window.location.reload(), 1200);
      return () => clearTimeout(timer);
    }
  }, [staleBuild]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      {staleBuild ? (
        <>
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-foreground" />
          <p className="text-sm text-muted-foreground">{t("staleBuildMessage")}</p>
        </>
      ) : (
        <>
          <h1 className="text-lg font-semibold">{t("title")}</h1>
          <p className="max-w-sm text-sm text-muted-foreground">{t("hint")}</p>
          <button
            type="button"
            onClick={reset}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            {t("retry")}
          </button>
        </>
      )}
    </div>
  );
}
