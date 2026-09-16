import { cn } from "@/lib/utils";

/**
 * The TP mark, from public/LogoForHeader.svg.
 *
 * Inlined rather than loaded through an `img` for three reasons: it costs no
 * request, it takes its colour from `currentColor` so the same mark works on
 * the paper header and the ink footer, and it can be marked decorative when a
 * visible wordmark already carries the name.
 *
 * The source file paints `#f00`. Brand red is `#ED1F24`, so the fill is
 * inherited here rather than hard-coded.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 250 150"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      className={cn("h-8 w-auto text-primary", className)}
    >
      <path d="m163.9 3.2c1.5 0 2.9 0 4.4 0 5.5 0.1 11.1 0.4 16.5 1.4 9.1 1.8 16.3 6.7 21.8 14.1 4.5 6.1 6.7 13 7.4 20.5 0.6 6.3 0.5 12.6-1.2 18.7-2.7 10-8.2 17.9-17.3 23.3-3.4 2.1-6.9 3.7-10.8 4.6-2.9 0.6-5.8 1.1-8.7 1.3-7.4 0.4-14.8 0.6-22.2 0.9-3.6 0.1-7.1 0.5-10.3 2.2-2.4 1.3-3.9 3.4-4.8 5.9-1.2 3.4-1.5 6.9-1.5 10.4 0 12.5 0 25 0 37.6 0 0.7 0 1.4 0 2.2-0.5 0-0.9 0-1.3 0q-12.6 0-25.2 0c-0.8 0-1-0.2-1-1 0-13.5-0.1-27.1 0.1-40.6 0.1-6.7 1.2-13.3 3.7-19.6 3-7.1 7.9-12.5 14.8-15.8 5-2.4 10.3-3.7 15.7-4 5.7-0.3 11.4-0.3 17.1-0.7 3.7-0.2 7.5-0.5 11.2-1.4 6.8-1.7 11.4-6.1 13-13.2 1.3-5.7 0.7-11.3-3-16-3.6-4.6-8.4-7-14.2-7.4q-1.7-0.1-3.4-0.2c-0.6 0-0.9-0.2-0.9-1 0.1-7.3 0.1-14.7 0.1-22.2z" />
      <path d="m109.5 81.1q0-13.1 0-26.2 0-13.6 0-27.2c0-1.7 0-1.7-1.7-1.7q-9.7 0-19.4 0c-0.4 0-0.8 0-1.2 0 0-7.7 0-15.3 0-23 24 0 47.9 0 72 0 0 7.7 0 15.4 0 23.1-0.4 0-0.6 0-0.9 0q-9.6 0-19.1-0.1c-0.3 0-0.7 0-1 0-0.9-0.2-1.3 0.2-1.3 1.2 0.1 2.7 0.1 5.4 0.1 8 0 8.3-0.1 16.7 0 25 0 1-0.3 1.3-1.3 1.5-7.8 1.7-14.9 4.9-20.3 11.1-2 2.4-3.5 5.1-5.3 7.6q-0.2 0.4-0.4 0.8-0.1 0-0.2-0.1z" />
      <path d="m87.2 3v23h-29.2v-23z" />
      <path d="m103.9 30.6v23h-23v-23z" />
      <path d="m80.9 30.6v23h-22.9v-23z" />
      <path d="m58 3v23h-23v-23z" />
      <path d="m103.9 58.2v23h-23v-23z" />
      <path d="m177.8 110.2h-0.1c-2.1-0.9-5.2-0.7-8.3 0.6-2.9 1.2-5 3.2-5.9 5.2l-1.2-17.4z" />
    </svg>
  );
}

/**
 * The mark plus the wordmark. The name is a proper noun and stays Latin in
 * every locale, so it carries `dir="ltr"` even inside an Arabic page.
 */
export function Logo({
  className,
  markClassName,
  tone = "ink",
}: {
  className?: string;
  markClassName?: string;
  tone?: "ink" | "inverse";
}) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <LogoMark className={cn("h-8 w-auto", markClassName)} />
      <span
        dir="ltr"
        className={cn(
          "text-sm leading-tight font-bold tracking-tight",
          tone === "inverse" ? "text-background" : "text-foreground",
        )}
      >
        Trendy Plaza
        <span
          className={cn(
            "block text-[10px] font-semibold tracking-[0.2em] uppercase",
            tone === "inverse" ? "text-background/60" : "text-muted-foreground",
          )}
        >
          Architecture
        </span>
      </span>
    </span>
  );
}
