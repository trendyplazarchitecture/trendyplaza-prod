"use client";

import { useEffect, useState } from "react";
import { BookOpen, FileText, Search } from "lucide-react";
import { useTranslations } from "next-intl";

import { useRouter } from "../../../i18n/navigation";
import type { SearchEntry } from "@/server/portal";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

/**
 * Search over what this student holds.
 *
 * The whole list arrives with the page and is filtered here. A student holds a
 * package, not the catalogue: that is tens of modules and low hundreds of
 * resources, a few kilobytes of JSON, and the result is instant on a bus with
 * one bar of signal. A round trip per keystroke would need a rate limiter to
 * stop it being used to enumerate content, and would still feel worse.
 *
 * Radix portals the dialog to the body, which is not incidental here: this app
 * puts scroll motion on nearly everything, and a fixed overlay rendered inside
 * a transformed ancestor is trapped by it. That was the white-overlay bug.
 */
export function PortalSearch({ entries }: { entries: SearchEntry[] }) {
  const t = useTranslations("portal.search");
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((value) => !value);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const modules = entries.filter((e) => e.kind === "module");
  const resources = entries.filter((e) => e.kind === "resource");

  function go(href: string) {
    setOpen(false);
    router.push(href);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        // `min-w-0`: this button is a flex item of the header row, and a flex
        // item's default `min-width: auto` refuses to shrink below its own
        // content's natural width. Without it, the button — and the header
        // around it — could only ever get as narrow as the placeholder text
        // allowed, which is wider than a 360px phone screen: the search bar
        // forcing the whole page to scroll sideways, not just its own text.
        className="flex h-10 w-full min-w-0 max-w-xl items-center gap-2.5 rounded-lg border border-rule bg-card px-3.5 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
      >
        <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span className="min-w-0 flex-1 truncate text-start">{t("placeholder")}</span>
        {/* LTR always: it is two key names, not prose. Hidden on touch, where
            there is no shortcut to press. */}
        <kbd
          dir="ltr"
          className="ui-dense hidden rounded border border-border px-1.5 py-0.5 text-[10px] font-semibold sm:inline"
        >
          Ctrl K
        </kbd>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="overflow-hidden p-0">
          <DialogTitle className="sr-only">{t("title")}</DialogTitle>
          <DialogDescription className="sr-only">{t("hint")}</DialogDescription>

          <Command>
            <CommandInput placeholder={t("placeholder")} />
            <CommandList>
              <CommandEmpty>{t("empty")}</CommandEmpty>

              {modules.length > 0 && (
                <CommandGroup heading={t("modules")}>
                  {modules.map((entry) => (
                    <CommandItem
                      key={`m-${entry.id}`}
                      value={`${entry.title} ${entry.context}`}
                      onSelect={() => go(entry.href)}
                      className="gap-2.5"
                    >
                      <BookOpen className="h-4 w-4 text-primary" aria-hidden="true" />
                      <span className="min-w-0 flex-1 truncate">{entry.title}</span>
                      <span className="truncate text-xs text-muted-foreground">
                        {entry.context}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {resources.length > 0 && (
                <CommandGroup heading={t("resources")}>
                  {resources.map((entry) => (
                    <CommandItem
                      key={`r-${entry.id}`}
                      value={`${entry.title} ${entry.context}`}
                      onSelect={() => go(entry.href)}
                      className="gap-2.5"
                    >
                      <FileText
                        className="h-4 w-4 text-muted-foreground"
                        aria-hidden="true"
                      />
                      <span className="min-w-0 flex-1 truncate">{entry.title}</span>
                      <span className="truncate text-xs text-muted-foreground">
                        {entry.context}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>
    </>
  );
}
