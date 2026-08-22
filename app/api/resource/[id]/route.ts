import { Readable } from "node:stream";
import type { NextRequest } from "next/server";
import { z } from "zod";

import { getCurrentUser } from "@/server/session";
import { resolveResourceAccess } from "@/server/entitlements";
import { openRange, statStored } from "@/server/storage";
import { recordView } from "@/server/progress";

/**
 * The only path from the web to a resource file.
 *
 * Files live outside the web root, under `STORAGE_ROOT`, so there is no URL
 * that reaches one directly and no guessable path to walk. Everything about
 * this route is the check in front of the bytes:
 *
 *   - not signed in            401, no body
 *   - signed in, not entitled  403
 *   - no such resource         404
 *   - entitled                 the file, inline, never as an attachment
 *
 * Never 200 with a file to anyone outside that last case.
 *
 * `allow_download` is the only thing that sets an attachment disposition, and
 * it is off by default and set per resource by an admin. This is friction
 * against casual sharing and nothing more: anyone who opens developer tools
 * still has the bytes. That is stated plainly in `05_SECURITY.md` and to the
 * client. Revocation and the session cap are the real controls.
 */

const paramsSchema = z.object({ id: z.string().uuid() });

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const raw = await context.params;
  const parsed = paramsSchema.safeParse(raw);
  if (!parsed.success) return new Response(null, { status: 404 });

  // The check lives here, in the route handler. `proxy.ts` does locale
  // routing and is not a gate.
  const user = await getCurrentUser();
  if (!user) return new Response(null, { status: 401 });
  if (user.state === "suspended") return new Response(null, { status: 403 });

  const access = await resolveResourceAccess(user.id, parsed.data.id);
  if (access.status === "not_found") return new Response(null, { status: 404 });
  if (access.status === "forbidden") return new Response(null, { status: 403 });
  const { resource } = access;

  // A YouTube or Drive resource has no file. Nothing to stream, and the id
  // must not be usable to probe the filesystem.
  if (resource.source !== "file" || !resource.filePath) {
    return new Response(null, { status: 404 });
  }

  const file = await statStored(resource.filePath);
  if (!file) return new Response(null, { status: 404 });

  /*
   * Progress, recorded after the entitlement check and before the bytes move.
   *
   * Not awaited, and the rejection is swallowed here rather than left to
   * bubble: a student opening a PDF must not wait on a write they did not ask
   * for, and a progress table that is down must lose a view rather than take
   * the library with it. Only on a full read, never on a range request, or a
   * PDF viewer paging through a hundred pages logs a hundred opens.
   */
  if (!request.headers.get("range")) {
    void recordView(user.id, resource.id, resource.moduleId).catch((error) => {
      console.error("progress: failed to record a view", error);
    });
  }

  const mime = resource.mimeType ?? "application/octet-stream";
  const disposition = resource.allowDownload ? "attachment" : "inline";

  const headers = new Headers({
    "content-type": mime,
    // No filename parameter on the inline path: the stored name is a UUID and
    // the title belongs on the page, not in a header.
    "content-disposition": disposition,
    "accept-ranges": "bytes",
    // Private, and never stored by a shared proxy. An entitlement can be
    // revoked, and a cached copy on a CDN would outlive the revocation.
    "cache-control": "private, no-store",
    "x-content-type-options": "nosniff",
  });

  const range = request.headers.get("range");

  // Without ranged reads a 100 MB PDF arrives as one blocking request and the
  // viewer cannot page through it. With them the browser asks for what it is
  // about to draw.
  if (range) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(range.trim());
    if (!match) {
      return new Response(null, {
        status: 416,
        headers: { "content-range": `bytes */${file.size}` },
      });
    }

    const [, rawStart, rawEnd] = match;
    let start = rawStart === "" ? null : Number(rawStart);
    let end = rawEnd === "" ? null : Number(rawEnd);

    if (start === null && end === null) {
      return new Response(null, {
        status: 416,
        headers: { "content-range": `bytes */${file.size}` },
      });
    }

    // A suffix range, `bytes=-500`, means the last 500 bytes.
    if (start === null) {
      start = Math.max(0, file.size - (end as number));
      end = file.size - 1;
    } else if (end === null) {
      end = file.size - 1;
    }

    if (
      !Number.isInteger(start) ||
      !Number.isInteger(end) ||
      start < 0 ||
      start > end ||
      start >= file.size
    ) {
      return new Response(null, {
        status: 416,
        headers: { "content-range": `bytes */${file.size}` },
      });
    }

    end = Math.min(end, file.size - 1);

    headers.set("content-range", `bytes ${start}-${end}/${file.size}`);
    headers.set("content-length", String(end - start + 1));

    return new Response(toWebStream(openRange(file.absolute, start, end)), {
      status: 206,
      headers,
    });
  }

  headers.set("content-length", String(file.size));
  return new Response(toWebStream(openRange(file.absolute, 0, file.size - 1)), {
    status: 200,
    headers,
  });
}

/**
 * Node's `createReadStream` is not a web `ReadableStream`, and the Response
 * constructor wants the latter. The conversion and its cast live here rather
 * than at every call site.
 */
function toWebStream(stream: ReturnType<typeof openRange>): ReadableStream {
  return Readable.toWeb(stream) as unknown as ReadableStream;
}
