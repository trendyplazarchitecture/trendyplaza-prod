/**
 * YouTube links arrive in four shapes from whoever pasted them: `watch?v=`,
 * `youtu.be/`, `/embed/`, and `/shorts/`. The admin pastes what their browser
 * gave them, so the id is pulled out here rather than asked for.
 *
 * Videos are unlisted, not private. That is a decided, recorded trade: one
 * link in a class group reaches the whole cohort. Bunny.net is the later swap
 * and it does not change the schema.
 */
const YOUTUBE_ID = /^[\w-]{11}$/;

export function youtubeId(url: string | null | undefined): string | null {
  if (!url) return null;

  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      const id = parsed.pathname.slice(1);
      return YOUTUBE_ID.test(id) ? id : null;
    }

    if (host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com") {
      const v = parsed.searchParams.get("v");
      if (v && YOUTUBE_ID.test(v)) return v;

      const match = /^\/(?:embed|shorts|v)\/([\w-]{11})/.exec(parsed.pathname);
      if (match) return match[1];
    }

    return null;
  } catch {
    return null;
  }
}

/** `nocookie`, and no related videos at the end, which would be someone else's. */
export function youtubeEmbedUrl(id: string): string {
  return `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1`;
}
