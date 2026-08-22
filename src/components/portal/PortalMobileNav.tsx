"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { useTranslations } from "next-intl";

import { PortalNav } from "./PortalNav";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

/**
 * The same nav, in a drawer, under `lg`.
 *
 * `side="start"` rather than `"left"`: the drawer has to come from the same
 * edge the sidebar occupies, and in Arabic that edge is the right one.
 *
 * Radix portals the sheet to the body. Everything in this project that is
 * `position: fixed` must be, or an ancestor with a scroll transform traps it.
 */
export function PortalMobileNav({ hasAccess }: { hasAccess: boolean }) {
  const t = useTranslations("portal");
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-rule text-muted-foreground transition-colors hover:text-foreground lg:hidden"
        aria-label={t("navLabel")}
      >
        <Menu className="h-4 w-4" aria-hidden="true" />
      </SheetTrigger>

      <SheetContent side="start" className="w-72 overflow-y-auto bg-background p-0">
        <SheetTitle className="border-b border-rule px-5 py-4 text-sm font-bold tracking-tight">
          {t("title")}
        </SheetTitle>
        <SheetDescription className="sr-only">{t("lede")}</SheetDescription>

        <div className="px-3 py-5">
          <PortalNav hasAccess={hasAccess} onNavigate={() => setOpen(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
