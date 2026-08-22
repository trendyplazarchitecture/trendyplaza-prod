"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Loader2,
  Maximize,
  Minimize,
  Pause,
  Play,
  Volume2,
  VolumeX,
} from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * A video player that does not look like YouTube.
 *
 * The file lives on YouTube because `07_INTEGRATIONS.md` says so: unlisted
 * videos, no hosting bill, Bunny.net as the later swap. What a student should
 * not get is YouTube's chrome, its title card linking away, its channel
 * avatar, its end-screen of somebody else's videos, and its share button.
 *
 * So the iframe is loaded chromeless and driven over `postMessage` instead.
 * That is the documented JS API, minus the 90 KB `iframe_api` script: with
 * `enablejsapi=1` the player accepts `{event:"command", func, args}` and, once
 * asked, posts `infoDelivery` messages back with the time and state. Every
 * control below is ours.
 *
 * What this cannot do is make the video un-YouTube. Someone who opens the
 * network tab sees googlevideo, and a long-press on mobile can still reach the
 * native menu. That is the same honesty as `allow_download`: it is friction,
 * not DRM, and the real controls are revocation and the session cap.
 */

type Props = { videoId: string; title: string };

export function VideoPlayer({ videoId, title }: Props) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [idle, setIdle] = useState(false);

  const command = useCallback((func: string, args: unknown[] = []) => {
    frameRef.current?.contentWindow?.postMessage(
      JSON.stringify({ event: "command", func, args }),
      "*",
    );
  }, []);

  /* The player only reports back once asked to. */
  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (!/youtube(-nocookie)?\.com$/.test(new URL(event.origin).hostname)) return;

      let data: { event?: string; info?: Record<string, unknown> };
      try {
        data = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
      } catch {
        return;
      }

      if (data.event === "onReady") {
        setReady(true);
        return;
      }

      if (data.event === "infoDelivery" && data.info) {
        const info = data.info as {
          currentTime?: number;
          duration?: number;
          playerState?: number;
          muted?: boolean;
        };
        if (typeof info.currentTime === "number") setCurrent(info.currentTime);
        if (typeof info.duration === "number" && info.duration > 0) {
          setDuration(info.duration);
        }
        // 1 playing, 2 paused, 0 ended.
        if (typeof info.playerState === "number") {
          setPlaying(info.playerState === 1);
          if (info.playerState === 0) setIdle(false);
        }
        if (typeof info.muted === "boolean") setMuted(info.muted);
      }
    }

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  /* Subscribing is what makes the player start posting `infoDelivery`. */
  const onLoad = useCallback(() => {
    const win = frameRef.current?.contentWindow;
    if (!win) return;
    for (const listener of ["onReady", "onStateChange"]) {
      win.postMessage(
        JSON.stringify({ event: "listening", id: videoId, channel: "widget", listener }),
        "*",
      );
    }
    setReady(true);
  }, [videoId]);

  useEffect(() => {
    const onChange = () => setFullscreen(document.fullscreenElement === wrapRef.current);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  /* Controls fade while the video plays and the mouse is still. */
  useEffect(() => {
    if (!playing) {
      setIdle(false);
      return;
    }
    const timer = setTimeout(() => setIdle(true), 2600);
    return () => clearTimeout(timer);
  }, [playing, current]);

  function toggle() {
    command(playing ? "pauseVideo" : "playVideo");
    setPlaying(!playing);
  }

  function seekTo(seconds: number) {
    command("seekTo", [seconds, true]);
    setCurrent(seconds);
  }

  function onKeyDown(event: React.KeyboardEvent) {
    // Space and the arrows, which is what anyone reaches for first.
    if (event.key === " " || event.key === "k") {
      event.preventDefault();
      toggle();
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      seekTo(Math.max(0, current - 5));
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      seekTo(Math.min(duration, current + 5));
    } else if (event.key === "m") {
      event.preventDefault();
      command(muted ? "unMute" : "mute");
      setMuted(!muted);
    }
  }

  const params = new URLSearchParams({
    enablejsapi: "1",
    // Everything YouTube would otherwise draw on top of the picture.
    controls: "0",
    modestbranding: "1",
    rel: "0",
    iv_load_policy: "3",
    disablekb: "1",
    fs: "0",
    playsinline: "1",
    origin: typeof window !== "undefined" ? window.location.origin : "",
  });

  return (
    <div
      ref={wrapRef}
      tabIndex={0}
      onKeyDown={onKeyDown}
      onMouseMove={() => setIdle(false)}
      className={cn(
        "group relative aspect-video w-full overflow-hidden rounded-lg bg-black outline-none",
        "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        idle && playing && "cursor-none",
      )}
    >
      <iframe
        ref={frameRef}
        onLoad={onLoad}
        src={`https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`}
        title={title}
        allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
        // No `allowFullScreen`: fullscreen is ours, on the wrapper, so the
        // native player chrome never appears.
        className="pointer-events-none absolute inset-0 h-full w-full"
      />

      {/*
        A transparent sheet over the whole picture. It swallows the clicks that
        would otherwise reach YouTube's own hit targets, the title bar and the
        watch-on-YouTube link included, and doubles as the play/pause target.
      */}
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? "Pause" : "Play"}
        className="absolute inset-0 h-full w-full cursor-pointer"
      >
        <span
          className={cn(
            "absolute inset-0 flex items-center justify-center transition-opacity",
            playing ? "opacity-0" : "opacity-100",
          )}
        >
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-black/55 backdrop-blur-sm">
            {ready ? (
              <Play className="h-7 w-7 translate-x-0.5 fill-white text-white" aria-hidden="true" />
            ) : (
              <Loader2 className="h-6 w-6 animate-spin text-white" aria-hidden="true" />
            )}
          </span>
        </span>
      </button>

      {/* Our controls. */}
      <div
        className={cn(
          "absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent px-3 pt-8 pb-2.5 transition-opacity duration-200",
          idle && playing ? "opacity-0" : "opacity-100",
        )}
      >
        <input
          type="range"
          min={0}
          max={duration || 100}
          step={0.1}
          value={current}
          aria-label="Seek"
          onChange={(e) => seekTo(Number(e.target.value))}
          className="h-1 w-full cursor-pointer appearance-none rounded-full bg-white/25 accent-[oklch(0.588_0.226_27.5)]"
          style={{
            background: `linear-gradient(to right, oklch(0.588 0.226 27.5) ${pct(current, duration)}%, rgba(255,255,255,0.25) ${pct(current, duration)}%)`,
          }}
        />

        <div className="mt-1.5 flex items-center gap-2 text-white">
          <button
            type="button"
            onClick={toggle}
            aria-label={playing ? "Pause" : "Play"}
            className="inline-flex h-8 w-8 items-center justify-center rounded transition-colors hover:bg-white/15"
          >
            {playing ? (
              <Pause className="h-4 w-4 fill-current" aria-hidden="true" />
            ) : (
              <Play className="h-4 w-4 fill-current" aria-hidden="true" />
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              command(muted ? "unMute" : "mute");
              setMuted(!muted);
            }}
            aria-label={muted ? "Unmute" : "Mute"}
            className="inline-flex h-8 w-8 items-center justify-center rounded transition-colors hover:bg-white/15"
          >
            {muted ? (
              <VolumeX className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Volume2 className="h-4 w-4" aria-hidden="true" />
            )}
          </button>

          <span className="figures ms-1 text-xs tabular-nums">
            {clock(current)} / {clock(duration)}
          </span>

          <button
            type="button"
            onClick={() => {
              if (document.fullscreenElement) document.exitFullscreen();
              else wrapRef.current?.requestFullscreen();
            }}
            aria-label={fullscreen ? "Leave full screen" : "Full screen"}
            className="ms-auto inline-flex h-8 w-8 items-center justify-center rounded transition-colors hover:bg-white/15"
          >
            {fullscreen ? (
              <Minimize className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Maximize className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function pct(current: number, duration: number) {
  return duration > 0 ? Math.min(100, (current / duration) * 100) : 0;
}

function clock(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const total = Math.floor(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return h > 0
    ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
    : `${m}:${String(s).padStart(2, "0")}`;
}
