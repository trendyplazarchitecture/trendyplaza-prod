import type { NextRequest } from "next/server";
import { z } from "zod";

import { getCurrentUser } from "@/server/session";
import { resolveLibraryItemAccess } from "@/server/library-items";
import { openRange, statStored } from "@/server/storage";
import { nodeToWebStream } from "@/server/streams";

/**
 * The only path from the web to a library item's file.
 *
 * A fork of `/api/resource/[id]/route.ts`, not a generalisation of it — see
 * `03-library/PLAN.md` §4's own reasoning: two parallel, near-identical
 * routes are easier to audit than one route branching on a "kind" param,
 * for code this security-sensitive. Everything about this route is the
 * check in front of the bytes:
 *
 *   - not signed in                         401, no body
 *   - signed in, gated item, not entitled    403
 *   - no such item, or nothing to stream     404
 *   - entitled, or the item is ungated       the file, inline, never as an
 *                                            attachment unless allowed
 *
 * `allow_download` is the only thing that sets an attachment disposition,
 * off by default and set per item by an admin — friction against casual
 * sharing, not real protection (05_SECURITY.md says this plainly). Never
 * 200 with a file to anyone outside the case above.
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
  // routing and is not a gate — see CLAUDE.md's invariant 1 / CVE-2025-29927.
  const user = await getCurrentUser();
  if (!user) return new Response(null, { status: 401 });
  if (user.state === "suspended") return new Response(null, { status: 403 });

  const access = await resolveLibraryItemAccess(user.id, parsed.data.id);
  if (access.status === "not_found") return new Response(null, { status: 404 });
  if (access.status === "forbidden") return new Response(null, { status: 403 });
  const { item } = access;

  // A YouTube, Drive or plain-link item has no file. Nothing to stream, and
  // the id must not be usable to probe the filesystem.
  if (item.source !== "file" || !item.filePath) {
    return new Response(null, { status: 404 });
  }

  const file = await statStored(item.filePath);
  if (!file) return new Response(null, { status: 404 });

  const mime = item.mimeType ?? "application/octet-stream";
  const isInline =
    mime === "application/pdf" ||
    mime === "image/jpeg" ||
    mime === "image/png" ||
    mime === "image/webp";
  const forceDownload = new URL(request.url).searchParams.get("download") === "1";
  const disposition = item.allowDownload || forceDownload || !isInline ? "attachment" : "inline";

  const headers = new Headers({
    "content-type": mime,
    "content-disposition": disposition,
    "accept-ranges": "bytes",
    // Private, never cached by a shared proxy. An `isGated` item's access
    // can be revoked (the student's entitlement can lapse), and a cached
    // copy on a CDN would outlive that.
    "cache-control": "private, no-store",
    "x-content-type-options": "nosniff",
  });

  const range = request.headers.get("range");

  if (range) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(range.trim());
    if (!match) {
      return new Response(null, { status: 416, headers: { "content-range": `bytes */${file.size}` } });
    }

    const [, rawStart, rawEnd] = match;
    let start = rawStart === "" ? null : Number(rawStart);
    let end = rawEnd === "" ? null : Number(rawEnd);

    if (start === null && end === null) {
      return new Response(null, { status: 416, headers: { "content-range": `bytes */${file.size}` } });
    }

    if (start === null) {
      start = Math.max(0, file.size - (end as number));
      end = file.size - 1;
    } else if (end === null) {
      end = file.size - 1;
    }

    if (!Number.isInteger(start) || !Number.isInteger(end) || start < 0 || start > end || start >= file.size) {
      return new Response(null, { status: 416, headers: { "content-range": `bytes */${file.size}` } });
    }

    end = Math.min(end, file.size - 1);

    headers.set("content-range", `bytes ${start}-${end}/${file.size}`);
    headers.set("content-length", String(end - start + 1));

    return new Response(nodeToWebStream(openRange(file.absolute, start, end)), { status: 206, headers });
  }

  headers.set("content-length", String(file.size));
  return new Response(nodeToWebStream(openRange(file.absolute, 0, file.size - 1)), { status: 200, headers });
}
