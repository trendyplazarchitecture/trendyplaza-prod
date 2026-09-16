import "server-only";

import type { Readable } from "node:stream";

/**
 * Converts a Node.js Readable stream (e.g. from fs.createReadStream) to a Web
 * ReadableStream safely.
 *
 * Node's standard `Readable.toWeb` can throw uncaught TypeErrors
 * ("Cannot write to a CLOSED writable stream" / "Cannot close a CLOSED writable stream")
 * when a client cancels or disconnects mid-stream in Next.js / Turbopack.
 *
 * This implementation cleans up immediately on cancel or error and handles
 * closed controllers gracefully.
 */
export function nodeToWebStream(nodeStream: Readable): ReadableStream<Uint8Array> {
  return new ReadableStream<Uint8Array>({
    start(controller) {
      let isClosed = false;

      nodeStream.on("data", (chunk: Buffer | Uint8Array | string) => {
        if (isClosed) return;
        try {
          const buffer = typeof chunk === "string" ? Buffer.from(chunk) : chunk;
          controller.enqueue(new Uint8Array(buffer));
        } catch {
          isClosed = true;
          nodeStream.destroy();
        }
      });

      nodeStream.on("end", () => {
        if (isClosed) return;
        isClosed = true;
        try {
          controller.close();
        } catch {
          // Stream was already closed by consumer
        }
      });

      nodeStream.on("error", (err) => {
        if (isClosed) return;
        isClosed = true;
        try {
          controller.error(err);
        } catch {
          // Stream was already closed by consumer
        }
      });
    },
    cancel() {
      nodeStream.destroy();
    },
  });
}
