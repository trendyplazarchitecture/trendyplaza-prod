"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

/**
 * The bar that appears above a list once at least one row is checked.
 * One shape, reused everywhere a list gets multi-select — Products,
 * Testimonials, Packages, Students, the trash sections on Orders and
 * Messages — rather than a bespoke toolbar per page.
 */
export function BulkBar({
  count,
  onClear,
  children,
}: {
  count: number;
  onClear: () => void;
  children: ReactNode;
}) {
  if (count === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-paper px-3 py-2 text-sm">
      <span className="font-medium">
        {count} selected
      </span>
      <div className="ms-auto flex flex-wrap items-center gap-1.5">
        {children}
        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={onClear}>
          Clear
        </Button>
      </div>
    </div>
  );
}
