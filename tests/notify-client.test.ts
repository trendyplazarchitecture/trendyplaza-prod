import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { sendNotification } from "@/lib/notify-client";

/**
 * The actual POST to Web3Forms, which has to run in the browser -- see the
 * doc comment on `sendNotification` for why. `NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY`
 * is inlined at build time in a real bundle; stubbed on `process.env` here
 * since Vitest runs this file through Node, not a Next build.
 */

const originalKey = process.env.NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY;
const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
  fetchMock.mockResolvedValue(new Response(JSON.stringify({ success: true }), { status: 200 }));
});

afterEach(() => {
  vi.unstubAllGlobals();
  if (originalKey === undefined) delete process.env.NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY;
  else process.env.NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY = originalKey;
});

describe("sendNotification", () => {
  it("makes no network call at all when no access key is configured", () => {
    delete process.env.NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY;

    sendNotification({ subject: "New order TP-2609-0001", fields: { Customer: "Yasmine B." } });

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("posts the access key, subject, and every field as its own row", async () => {
    process.env.NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY = "test-key-123";

    sendNotification({
      subject: "New order TP-2609-0001",
      fields: { Customer: "Yasmine B.", Total: "12,500 DA" },
    });
    await Promise.resolve(); // let the fire-and-forget fetch() call happen

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.web3forms.com/submit");
    expect(init.method).toBe("POST");

    const body = JSON.parse(init.body);
    expect(body.access_key).toBe("test-key-123");
    expect(body.subject).toBe("New order TP-2609-0001");
    expect(body.Customer).toBe("Yasmine B.");
    expect(body.Total).toBe("12,500 DA");
  });

  it("sets the reply-to address from replyTo, and omits it when there is none", async () => {
    process.env.NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY = "test-key-123";

    sendNotification({
      subject: "New receipt to review — Amine K.",
      replyTo: "amine@example.dz",
      fields: { Student: "Amine K." },
    });
    await Promise.resolve();
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).email).toBe("amine@example.dz");

    fetchMock.mockClear();
    sendNotification({ subject: "New message from Karim", fields: { From: "Karim" } });
    await Promise.resolve();
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).email).toBeUndefined();
  });

  it("never throws when Web3Forms is unreachable", async () => {
    process.env.NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY = "test-key-123";
    fetchMock.mockRejectedValue(new Error("network down"));

    expect(() => sendNotification({ subject: "x", fields: {} })).not.toThrow();
    await Promise.resolve();
  });
});
