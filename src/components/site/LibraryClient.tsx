"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { BookOpen, Download, ExternalLink, Lock, PlayCircle } from "lucide-react";

import { Link } from "../../../i18n/navigation";
import { ResourceViewerPanel, type ViewableResource } from "@/components/lms/ResourceViewer";
import { libraryCoverUrl, mediaSrcSet } from "@/lib/media";
import { cn } from "@/lib/utils";

export type LibraryCategoryTab = { id: string; key: string; label: string };

export type LibraryCardItem = {
  id: string;
  category: LibraryCategoryTab;
  title: string;
  description: string;
  author: string | null;
  coverImagePath: string | null;
  isGated: boolean;
  allowDownload: boolean;
  source: "file" | "youtube" | "drive" | "link";
  tags: { slug: string; label: string }[];
  /** Precomputed server-side: `!isGated || hasAnyAccess(user)`. Never re-derived on the client — an entitlement check belongs on the server, per CLAUDE.md invariant 1. */
  canOpen: boolean;
  mimeType: string | null;
  sizeBytes: number | null;
  externalUrl: string | null;
};

/**
 * NextPhase/03-library — the public reader. Signed-in gate happens in the
 * server page (`app/[locale]/(store)/digital-library/page.tsx`); everything
 * below assumes the visitor is already signed in, unless `preview` is set —
 * a signed-out visitor sees the same shelves blurred behind a join CTA,
 * matching the software hub's own "reachable, but closed" posture rather
 * than a hard redirect. Per-item access (`canOpen`) is computed
 * server-side and only ever narrows what a click can do here.
 *
 * Categories are admin-editable rows (`library_categories`), passed in as
 * `categories` rather than a fixed list — see `LibraryCategoriesManager.tsx`.
 */
export function LibraryClient({
  items,
  categories,
  allTags,
  preview = false,
}: {
  items: LibraryCardItem[];
  categories: LibraryCategoryTab[];
  allTags: { slug: string; label: string }[];
  preview?: boolean;
}) {
  const t = useTranslations("resourcesPage");
  const [tab, setTab] = useState<string>("all");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  const filtered = useMemo(
    () =>
      items
        .filter((i) => tab === "all" || i.category.id === tab)
        .filter((i) => !activeTag || i.tags.some((tg) => tg.slug === activeTag)),
    [items, tab, activeTag],
  );

  const byCategory = useMemo(() => {
    const groups: { category: LibraryCategoryTab; items: LibraryCardItem[] }[] = [];
    for (const cat of categories) {
      const list = filtered.filter((i) => i.category.id === cat.id);
      if (list.length > 0) groups.push({ category: cat, items: list });
    }
    return groups;
  }, [filtered, categories]);

  const flat = useMemo(() => filtered, [filtered]);
  const viewables: ViewableResource[] = useMemo(
    () =>
      flat.map((i) => ({
        id: i.id,
        title: i.title,
        description: i.description,
        madeBy: i.author ?? "",
        source: i.source,
        externalUrl: i.externalUrl,
        mimeType: i.mimeType,
        sizeBytes: i.sizeBytes,
        allowDownload: i.allowDownload,
      })),
    [flat],
  );
  const index = flat.findIndex((i) => i.id === openId);

  function openItem(item: LibraryCardItem) {
    if (preview || !item.canOpen) return;
    setOpenId(item.id);
  }

  return (
    <div className="relative space-y-10">
      <header className="space-y-1.5">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t("heroTitle")}</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">{t("heroLede")}</p>
      </header>

      <div className={cn("space-y-10", preview && "pointer-events-none select-none blur-sm")} aria-hidden={preview}>
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <TabButton active={tab === "all"} onClick={() => setTab("all")}>
              {t("allCategories")}
            </TabButton>
            {categories.map((cat) => (
              <TabButton key={cat.id} active={tab === cat.id} onClick={() => setTab(cat.id)}>
                {cat.label}
              </TabButton>
            ))}
          </div>

          {allTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              <TagChip active={activeTag === null} onClick={() => setActiveTag(null)}>
                {t("allTags")}
              </TagChip>
              {allTags.map((tg) => (
                <TagChip key={tg.slug} active={activeTag === tg.slug} onClick={() => setActiveTag(tg.slug)}>
                  {tg.label}
                </TagChip>
              ))}
            </div>
          )}
        </div>

        {byCategory.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border px-4 py-16 text-center text-sm text-muted-foreground">
            {t("emptyState")}
          </p>
        ) : (
          byCategory.map((group) => (
            <section key={group.category.id}>
              <div className="mb-3 flex items-baseline gap-2">
                <h2 className="text-sm font-bold tracking-[0.16em] uppercase">{group.category.label}</h2>
                <span className="figures text-xs text-muted-foreground">{group.items.length}</span>
              </div>
              <Grid items={group.items} onOpen={openItem} lockedHint={t("lockedHint")} />
            </section>
          ))
        )}
      </div>

      {preview && (
        <div className="absolute inset-x-0 top-24 flex justify-center px-4">
          <div className="w-full max-w-sm rounded-2xl border border-rule bg-card p-6 text-center shadow-xl">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Lock className="h-5 w-5" aria-hidden="true" />
            </div>
            <h2 className="mt-3 text-base font-bold">{t("previewTitle")}</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">{t("previewLede")}</p>
            <div className="mt-5 flex flex-col gap-2">
              <Link
                href="/signup"
                className="inline-flex h-11 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground transition-colors hover:bg-primary-press"
              >
                {t("previewCreateAccount")}
              </Link>
              <Link
                href="/login"
                className="inline-flex h-11 items-center justify-center rounded-lg border border-border text-sm font-semibold text-foreground transition-colors hover:border-foreground/30 hover:bg-paper"
              >
                {t("previewSignIn")}
              </Link>
            </div>
          </div>
        </div>
      )}

      {!preview && (
        <ResourceViewerPanel
          items={viewables}
          index={index}
          baseUrl="/api/library-item"
          onIndex={(next) => setOpenId(flat[next]?.id ?? null)}
          onClose={() => setOpenId(null)}
        />
      )}
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors",
        active ? "border-primary bg-primary/10 text-foreground" : "border-border text-muted-foreground hover:border-primary/40",
      )}
    >
      {children}
    </button>
  );
}

function TagChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors",
        active ? "bg-primary text-primary-foreground" : "bg-paper text-muted-foreground hover:bg-border/60",
      )}
    >
      {children}
    </button>
  );
}

/**
 * A plain wrapping grid — covers reflow onto as many rows as the viewport
 * needs. Not a horizontal-scroll carousel: a shelf that requires a drag or
 * an arrow click to see the sixth book reads as a slideshow, not a library,
 * and hides how much is actually here.
 */
function Grid({
  items,
  onOpen,
  lockedHint,
}: {
  items: LibraryCardItem[];
  onOpen: (item: LibraryCardItem) => void;
  lockedHint: string;
}) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-5 sm:grid-cols-[repeat(auto-fill,minmax(160px,1fr))]">
      {items.map((item) => (
        <LibraryCard key={item.id} item={item} onOpen={onOpen} lockedHint={lockedHint} />
      ))}
    </div>
  );
}

function SourceBadge({ source }: { source: LibraryCardItem["source"] }) {
  if (source === "youtube") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-black/55 px-1.5 py-0.5 text-[9px] font-bold text-white backdrop-blur-sm">
        <PlayCircle className="h-2.5 w-2.5" aria-hidden="true" />
        VIDEO
      </span>
    );
  }
  if (source === "drive" || source === "link") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-black/55 px-1.5 py-0.5 text-[9px] font-bold text-white backdrop-blur-sm">
        <ExternalLink className="h-2.5 w-2.5" aria-hidden="true" />
        LINK
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-black/55 px-1.5 py-0.5 text-[9px] font-bold text-white backdrop-blur-sm">
      PDF
    </span>
  );
}

function LibraryCard({
  item,
  onOpen,
  lockedHint,
}: {
  item: LibraryCardItem;
  onOpen: (item: LibraryCardItem) => void;
  lockedHint: string;
}) {
  const cover = libraryCoverUrl(item.coverImagePath);
  const locked = item.isGated && !item.canOpen;

  const card = (
    <div className={cn("relative flex flex-col gap-2 transition-transform", !locked && "hover:-translate-y-1")}>
      {/* A 2:3 ratio reads as a real book spine, not a generic thumbnail. */}
      <div
        className={cn(
          "relative aspect-[2/3] overflow-hidden rounded-lg border border-border bg-paper shadow-sm ring-1 ring-black/5 transition-shadow group-hover:shadow-lg",
          locked && "opacity-70 grayscale-[35%]",
        )}
      >
        {cover ? (
          <img
            src={cover}
            srcSet={mediaSrcSet(cover, [240, 320])}
            sizes="(min-width: 640px) 160px, 140px"
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-paper to-border/40">
            <BookOpen className="h-8 w-8 text-muted-foreground/40" aria-hidden="true" />
          </div>
        )}

        <div className="absolute start-1.5 top-1.5">
          <SourceBadge source={item.source} />
        </div>

        {locked ? (
          <div className="absolute end-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/55 backdrop-blur-sm">
            <Lock className="h-2.5 w-2.5 text-white" aria-hidden="true" />
          </div>
        ) : (
          item.allowDownload && (
            <div className="absolute end-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/55 backdrop-blur-sm">
              <Download className="h-2.5 w-2.5 text-white" aria-hidden="true" />
            </div>
          )
        )}
      </div>

      <div className="space-y-0.5 px-0.5">
        <p className="line-clamp-2 text-xs leading-snug font-semibold">{item.title}</p>
        {item.author && <p className="truncate text-[10px] text-muted-foreground">{item.author}</p>}
      </div>
    </div>
  );

  if (locked) {
    return (
      <Link href="/account" className="group outline-none" title={lockedHint}>
        {card}
      </Link>
    );
  }

  return (
    <button type="button" onClick={() => onOpen(item)} className="group text-start outline-none">
      {card}
    </button>
  );
}
