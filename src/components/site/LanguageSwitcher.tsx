"use client";

import { useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Check, Languages, Loader2 } from "lucide-react";

import { usePathname, useRouter } from "../../../i18n/navigation";
import { type Locale, localeNames, locales } from "../../../i18n/routing";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

/**
 * Switching locale is a server round trip: the whole tree re-renders in the
 * new language, and Arabic also flips direction. `useTransition` keeps the
 * current page on screen and interactive while that happens, so the switch
 * reads as a change rather than a blank flash.
 *
 * The path is preserved, so a student on a product page stays on that product.
 */
export function LanguageSwitcher({ className }: { className?: string }) {
  const t = useTranslations("language");
  const active = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  function switchTo(next: Locale) {
    if (next === active) return;
    startTransition(() => {
      // `pathname` here is already locale-stripped by next-intl's navigation,
      // so this lands on the same page in the new language.
      router.replace(pathname, { locale: next });
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t("change")}
        disabled={isPending}
        className={cn(
          "inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-background px-2.5",
          "text-xs font-semibold uppercase tracking-wide text-muted-foreground",
          "transition-colors duration-150 hover:border-primary/40 hover:text-foreground",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
          "disabled:opacity-60",
          className,
        )}
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin text-primary" aria-hidden="true" />
        ) : (
          <Languages className="h-4 w-4 text-primary" aria-hidden="true" />
        )}
        <span>{active.toUpperCase()}</span>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="min-w-[10rem]">
        {locales.map((locale) => (
          <DropdownMenuItem
            key={locale}
            onSelect={() => switchTo(locale)}
            className="flex items-center justify-between gap-3 text-sm"
            // Each name is written in its own language and script, so the
            // isolate keeps Arabic from dragging the tick to the wrong side.
            dir={locale === "ar" ? "rtl" : "ltr"}
          >
            <span>{localeNames[locale]}</span>
            {locale === active && (
              <Check className="h-4 w-4 text-primary" aria-hidden="true" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
