"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  Maximize2,
  Minus,
  PlayCircle,
  Plus,
  RotateCcw,
  Settings2,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { VideoPlayer } from "./VideoPlayer";
import { youtubeId } from "@/lib/embed";
import { cn } from "@/lib/utils";

export type ViewableResource = {
  id: string;
  title: string;
  description: string;
  source: "file" | "youtube" | "drive" | "link";
  externalUrl: string | null;
  mimeType: string | null;
  sizeBytes: number | null;
  allowDownload: boolean;
};

export type ResourceGroup = {
  key: string;
  label: string;
  items: ViewableResource[];
};

/* -------------------------------------------------------------------------
 * Reading settings.
 *
 * Three controls, no more. A student reading a scanned course pack for two
 * hours on a laptop wants the page wider or the surround darker; they do not
 * want a preferences panel. Kept in localStorage rather than on the account,
 * because it is a property of the screen they are sitting at, not of them:
 * the same student on a phone wants a different answer.
 * ---------------------------------------------------------------------- */

type Surface = "paper" | "sepia" | "dark";
type Width = "comfortable" | "full";

const SETTINGS_KEY = "tp.reader";

const SURFACES: Record<Surface, string> = {
  paper: "bg-paper",
  // Not a filter over the document: tinting the surround is legible, and
  // tinting the page itself makes a scan look damaged.
  sepia: "bg-[oklch(0.94_0.025_85)]",
  dark: "bg-[oklch(0.22_0.006_285)]",
};

function useReaderSettings() {
  const [surface, setSurface] = useState<Surface>("paper");
  const [width, setWidth] = useState<Width>("comfortable");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as { surface?: Surface; width?: Width };
        if (saved.surface && saved.surface in SURFACES) setSurface(saved.surface);
        if (saved.width === "full" || saved.width === "comfortable") setWidth(saved.width);
      }
    } catch {
      // A corrupt or blocked localStorage is not worth failing a read over.
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify({ surface, width }));
    } catch {
      /* private mode */
    }
  }, [surface, width, loaded]);

  return { surface, setSurface, width, setWidth };
}

/**
 * The resource list, and the viewer it opens.
 *
 * Resources render in the browser and are not offered as downloads. The
 * download control appears only when an admin has turned `allow_download` on
 * for that specific resource, which is off by default. This is friction
 * against casual sharing, not protection: anyone who opens developer tools
 * still has the file, and that is said plainly to the client rather than
 * dressed up. Revocation and the session cap are the real controls.
 *
 * The viewer is a full-screen panel rather than a route, so closing it returns
 * the student to the exact place in the list they left.
 */
export function ResourceList({ groups }: { groups: ResourceGroup[] }) {
  const t = useTranslations("library");
  const [openId, setOpenId] = useState<string | null>(null);

  // Flattened once, so the viewer can walk the whole module with the arrow
  // keys instead of closing and reopening for every item.
  const flat = useMemo(() => groups.flatMap((g) => g.items), [groups]);
  const index = flat.findIndex((r) => r.id === openId);

  return (
    <>
      <div className="space-y-12">
        {groups.map((group) => (
          <section key={group.key}>
            <h2 className="text-sm font-bold tracking-[0.16em] uppercase">{group.label}</h2>
            <hr className="mt-3 border-0 border-t border-rule" />

            <ul className="mt-5 space-y-2">
              {group.items.map((resource) => (
                <li key={resource.id}>
                  <button
                    type="button"
                    onClick={() => setOpenId(resource.id)}
                    className="flex w-full items-start gap-3 rounded-lg border border-border bg-card p-4 text-start transition-colors hover:border-primary/40 hover:bg-paper"
                  >
                    <ResourceIcon resource={resource} />

                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium">{resource.title}</span>
                      {resource.description && (
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          {resource.description}
                        </span>
                      )}
                    </span>

                    <span className="shrink-0 text-xs font-semibold text-primary-press">
                      {t("read")}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <Viewer
        items={flat}
        index={index}
        onIndex={(next) => setOpenId(flat[next]?.id ?? null)}
        onClose={() => setOpenId(null)}
      />
    </>
  );
}

function ResourceIcon({ resource }: { resource: ViewableResource }) {
  const className = "mt-0.5 h-4 w-4 shrink-0 text-primary";

  if (resource.source === "youtube") return <PlayCircle className={className} aria-hidden="true" />;
  if (resource.source !== "file") return <ExternalLink className={className} aria-hidden="true" />;
  if (resource.mimeType?.startsWith("image/")) return <ImageIcon className={className} aria-hidden="true" />;
  return <FileText className={className} aria-hidden="true" />;
}

function Viewer({
  items,
  index,
  onIndex,
  onClose,
}: {
  items: ViewableResource[];
  index: number;
  onIndex: (next: number) => void;
  onClose: () => void;
}) {
  const t = useTranslations("library");
  const shouldReduceMotion = useReducedMotion();
  const { surface, setSurface, width, setWidth } = useReaderSettings();
  const [showSettings, setShowSettings] = useState(false);
  const [mounted, setMounted] = useState(false);

  const resource = index >= 0 ? items[index] : null;
  const isOpen = resource !== null;

  useEffect(() => setMounted(true), []);

  const go = useCallback(
    (by: -1 | 1) => {
      const next = index + by;
      if (next >= 0 && next < items.length) onIndex(next);
    },
    [index, items.length, onIndex],
  );

  useEffect(() => {
    if (!isOpen) return;

    const onKey = (event: KeyboardEvent) => {
      // Arrows walk the module. A video swallows them itself, since it is
      // focused and seeking is the more useful meaning there.
      if (event.key === "Escape") onClose();
      else if (event.key === "ArrowLeft" && resource?.source !== "youtube") go(-1);
      else if (event.key === "ArrowRight" && resource?.source !== "youtube") go(1);
    };

    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, resource?.source, onClose, go]);

  if (!mounted) return null;

  /*
   * Portalled to the body, and this is not decoration.
   *
   * The viewer used to render where it sat in the page, inside the module
   * layout. A `position: fixed` element is laid out against the viewport only
   * while no ancestor has a transform, filter or containing-block property,
   * and this page is full of scroll-reveal motion: the moment one of those
   * animated, the "full screen" viewer was trapped inside the content column,
   * showing the site header and footer around a half-height panel with the
   * page bleeding through. Rendering at the body makes that structurally
   * impossible rather than accidentally fixed.
   *
   * The overlay animates opacity only, for the same reason: a transform on the
   * overlay itself would recreate the containing block it just escaped.
   */
  return createPortal(
    <AnimatePresence>
      {resource && (
        <motion.div
          key="viewer"
          role="dialog"
          aria-modal="true"
          aria-label={resource.title}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.18 }}
          className="fixed inset-0 z-[100] flex flex-col bg-background"
        >
          <header className="flex h-14 shrink-0 items-center gap-2 border-b border-rule px-3 sm:px-4">
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-sm font-bold">{resource.title}</h2>
              {items.length > 1 && (
                <p className="figures text-[11px] text-muted-foreground">
                  {index + 1} / {items.length}
                </p>
              )}
            </div>

            {/* Reading settings, for anything that is a document. */}
            {resource.source === "file" && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowSettings((v) => !v)}
                  aria-label={t("settings")}
                  aria-expanded={showSettings}
                  className={cn(
                    "inline-flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
                    showSettings
                      ? "bg-paper text-foreground"
                      : "text-muted-foreground hover:bg-paper hover:text-foreground",
                  )}
                >
                  <Settings2 className="h-4 w-4" aria-hidden="true" />
                </button>

                {showSettings && (
                  <div className="absolute end-0 top-11 z-10 w-60 rounded-xl border border-rule bg-card p-3 shadow-lg">
                    <p className="ui-dense mb-2 text-[11px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
                      {t("surface")}
                    </p>
                    <div className="flex gap-1.5">
                      {(["paper", "sepia", "dark"] as const).map((key) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setSurface(key)}
                          aria-pressed={surface === key}
                          className={cn(
                            "flex-1 rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors",
                            surface === key
                              ? "border-primary bg-primary/10 text-foreground"
                              : "border-border text-muted-foreground hover:border-primary/40",
                          )}
                        >
                          {t(`surfaces.${key}`)}
                        </button>
                      ))}
                    </div>

                    <p className="ui-dense mt-4 mb-2 text-[11px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
                      {t("pageWidth")}
                    </p>
                    <div className="flex gap-1.5">
                      {(["comfortable", "full"] as const).map((key) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setWidth(key)}
                          aria-pressed={width === key}
                          className={cn(
                            "flex-1 rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors",
                            width === key
                              ? "border-primary bg-primary/10 text-foreground"
                              : "border-border text-muted-foreground hover:border-primary/40",
                          )}
                        >
                          {t(`widths.${key}`)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {resource.source === "file" && resource.allowDownload && (
              <a
                href={`/api/resource/${resource.id}`}
                download
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-xs font-semibold transition-colors hover:border-foreground/30 hover:bg-paper"
              >
                <Download className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="hidden sm:inline">{t("download")}</span>
              </a>
            )}

            <button
              type="button"
              onClick={onClose}
              aria-label={t("close")}
              autoFocus
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-paper hover:text-foreground"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </header>

          <div
            className={cn(
              "relative flex min-h-0 flex-1 items-stretch justify-center",
              SURFACES[surface],
            )}
            onClick={() => setShowSettings(false)}
          >
            <Embed resource={resource} width={width} />

            {/* Walking the module without going back to the list. */}
            {items.length > 1 && (
              <>
                <NavButton
                  side="start"
                  disabled={index === 0}
                  label={t("previous")}
                  onClick={() => go(-1)}
                />
                <NavButton
                  side="end"
                  disabled={index === items.length - 1}
                  label={t("next")}
                  onClick={() => go(1)}
                />
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

function NavButton({
  side,
  disabled,
  label,
  onClick,
}: {
  side: "start" | "end";
  disabled: boolean;
  label: string;
  onClick: () => void;
}) {
  const Icon = side === "start" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={cn(
        "absolute top-1/2 hidden -translate-y-1/2 items-center justify-center rounded-full border border-rule bg-card/90 text-foreground shadow-sm backdrop-blur transition-opacity sm:inline-flex",
        "h-10 w-10 disabled:pointer-events-none disabled:opacity-0 hover:bg-card",
        side === "start" ? "start-3" : "end-3",
      )}
    >
      {/* The chevrons are direction, not decoration, so they mirror in Arabic. */}
      <Icon className="h-5 w-5 rtl:-scale-x-100" aria-hidden="true" />
    </button>
  );
}

function Embed({ resource, width }: { resource: ViewableResource; width: Width }) {
  const t = useTranslations("library");

  if (resource.source === "youtube") {
    const id = youtubeId(resource.externalUrl);
    if (!id) return <Unavailable />;

    return (
      <div className="flex w-full items-center justify-center p-3 sm:p-6">
        <div className="w-full max-w-5xl">
          <VideoPlayer videoId={id} title={resource.title} />
        </div>
      </div>
    );
  }

  if (resource.source !== "file") {
    // Drive and plain links leave the site. Said out loud rather than opening
    // a new tab from under the student.
    return (
      <div className="flex w-full flex-col items-center justify-center gap-4 p-8 text-center">
        <p className="max-w-sm text-sm text-muted-foreground">{t("externalNotice")}</p>
        <a
          href={resource.externalUrl ?? "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-12 items-center gap-2 rounded-lg bg-primary px-6 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary-press"
        >
          <ExternalLink className="h-4 w-4" aria-hidden="true" />
          {t("openExternal")}
        </a>
      </div>
    );
  }

  const src = `/api/resource/${resource.id}`;

  if (resource.mimeType?.startsWith("image/")) {
    return <ImageStage src={src} alt={resource.title} />;
  }

  // The browser's own PDF viewer. It supports ranged reads, which is why the
  // route serves 206s: a 100 MB course pack pages instead of blocking.
  return (
    <div
      className={cn(
        "h-full w-full",
        width === "comfortable" && "mx-auto max-w-5xl px-0 sm:px-4 sm:py-3",
      )}
    >
      <object
        data={src}
        type={resource.mimeType ?? "application/pdf"}
        className="h-full w-full sm:rounded-lg"
      >
        <Unavailable />
      </object>
    </div>
  );
}

/**
 * An image resource: a scanned plate, a photographed board.
 *
 * Zoom and drag, because the reason a student opens one is to read something
 * small in the corner of it. Fit is the default and the reset returns to it,
 * so it is never possible to get lost at 4x with no way back.
 */
function ImageStage({ src, alt }: { src: string; alt: string }) {
  const t = useTranslations("library");
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);

  const fit = zoom === 1;

  function reset() {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  }

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden">
      <img
        src={src}
        alt={alt}
        draggable={false}
        onDoubleClick={() => (fit ? setZoom(2) : reset())}
        onPointerDown={(e) => {
          if (fit) return;
          setDragging(true);
          (e.target as HTMLElement).setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (!dragging) return;
          setOffset((o) => ({ x: o.x + e.movementX, y: o.y + e.movementY }));
        }}
        onPointerUp={() => setDragging(false)}
        className={cn(
          "max-h-full max-w-full object-contain select-none",
          fit ? "cursor-zoom-in" : dragging ? "cursor-grabbing" : "cursor-grab",
        )}
        style={{
          transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
          transition: dragging ? "none" : "transform 160ms ease-out",
        }}
      />

      <div className="absolute bottom-4 start-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full border border-rule bg-card/95 p-1 shadow-sm backdrop-blur rtl:translate-x-1/2">
        <ZoomButton
          label={t("zoomOut")}
          disabled={zoom <= 1}
          onClick={() => setZoom((z) => Math.max(1, Number((z - 0.5).toFixed(1))))}
        >
          <Minus className="h-4 w-4" aria-hidden="true" />
        </ZoomButton>

        <span className="figures w-12 text-center text-xs font-semibold tabular-nums">
          {Math.round(zoom * 100)}%
        </span>

        <ZoomButton
          label={t("zoomIn")}
          disabled={zoom >= 4}
          onClick={() => setZoom((z) => Math.min(4, Number((z + 0.5).toFixed(1))))}
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
        </ZoomButton>

        <span className="mx-0.5 h-5 w-px bg-border" aria-hidden="true" />

        <ZoomButton label={t("resetZoom")} disabled={fit && offset.x === 0} onClick={reset}>
          {fit ? (
            <Maximize2 className="h-4 w-4" aria-hidden="true" />
          ) : (
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
          )}
        </ZoomButton>
      </div>
    </div>
  );
}

function ZoomButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-paper hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
    >
      {children}
    </button>
  );
}

function Unavailable() {
  const t = useTranslations("library");
  return (
    <div className="flex h-full w-full items-center justify-center p-8">
      <p className="max-w-sm text-center text-sm text-muted-foreground">{t("unavailable")}</p>
    </div>
  );
}
