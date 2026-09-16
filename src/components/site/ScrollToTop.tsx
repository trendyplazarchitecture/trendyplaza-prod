"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Puts a new page at the top.
 *
 * The App Router restores scroll position on client navigation, which is right
 * for a back button and wrong for a forward one: tapping "Shop" from halfway
 * down the landing page drops you halfway down the shop. Anchor links are left
 * alone, since jumping to `#faq` is the whole point of the link.
 */
export function ScrollToTop() {
  const pathname = usePathname();

  useEffect(() => {
    if (window.location.hash) return;
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [pathname]);

  return null;
}
