import type { ReactNode } from "react";

import { Link } from "../../../i18n/navigation";
import { LanguageSwitcher } from "@/components/site/LanguageSwitcher";

/**
 * The account group: signing up, signing in, waiting on hold, redeeming a
 * code. A signed-up student with no entitlement is a real and common state
 * under the receipt path, and this group is where that person lives.
 *
 * Deliberately without the shop header. Someone entering a code off a printed
 * card has one job, and a navigation bar full of other jobs is noise.
 */
export default function AccountLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative isolate flex min-h-screen flex-col bg-paper">
      {/* The drafting grid, held to the top of the page where the eye starts. */}
      <div
        aria-hidden="true"
        className="sheet-grid sheet-grid-fade pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px]"
      />

      <header className="flex h-16 items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5" aria-label="Trendy Plaza Architecture">
          <img
            src="/favicon/favicon-96x96.png"
            alt=""
            width={32}
            height={32}
            className="h-8 w-8 object-contain"
            aria-hidden="true"
          />
          <span className="text-sm leading-tight font-bold tracking-tight" dir="ltr">
            Trendy Plaza
            <span className="block text-[10px] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
              Architecture
            </span>
          </span>
        </Link>
        <LanguageSwitcher />
      </header>

      <main className="flex flex-1 items-start justify-center px-4 pt-8 pb-16 sm:pt-14">
        {children}
      </main>
    </div>
  );
}
