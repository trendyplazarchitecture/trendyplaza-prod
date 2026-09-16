import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The notification is built in two places on purpose:
 *
 * `buildNotification` (server, tested here against a mocked `getWorkload`)
 * reads the live workload snapshot and the dashboard link, both of which
 * need the database — an unauthenticated customer or student cannot fetch
 * those themselves.
 *
 * `sendNotification` (client, in notify-client.test.ts) is the actual POST
 * to Web3Forms, and it has to run in the browser: Web3Forms' free plan
 * refuses server-to-server calls outright ("this method is not allowed...
 * Pro plan is required" to allowlist a server IP), confirmed by hand
 * against the real key. A server-side `notifyAdmin` that both built and
 * sent, which is what this file tested before, was silently failing every
 * time in production.
 */

vi.mock("@/server/admin", () => ({
  getWorkload: vi.fn(async () => ({
    pendingOrders: 3,
    readyToShip: 1,
    pendingRequests: 2,
    lowStock: 0,
    pendingMessages: 1,
  })),
}));

const { buildNotification } = await import("@/server/notify");
const { getWorkload } = await import("@/server/admin");

const originalAuthUrl = process.env.BETTER_AUTH_URL;

afterEach(() => {
  vi.mocked(getWorkload).mockClear();
  if (originalAuthUrl === undefined) delete process.env.BETTER_AUTH_URL;
  else process.env.BETTER_AUTH_URL = originalAuthUrl;
});

describe("buildNotification", () => {
  it("carries the subject, every field, and the reply-to address through untouched", async () => {
    const payload = await buildNotification({
      subject: "New order TP-2609-0001",
      dashboardPath: "/admin/orders",
      replyTo: "yasmine@example.dz",
      fields: { Customer: "Yasmine B.", Total: "12,500 DA" },
    });

    expect(payload).not.toBeNull();
    expect(payload!.subject).toBe("New order TP-2609-0001");
    expect(payload!.replyTo).toBe("yasmine@example.dz");
    expect(payload!.fields.Customer).toBe("Yasmine B.");
    expect(payload!.fields.Total).toBe("12,500 DA");
  });

  it("adds a live workload snapshot to every payload", async () => {
    const payload = await buildNotification({
      subject: "New message from Karim",
      dashboardPath: "/admin/messages",
      fields: { From: "Karim" },
    });

    // Counts come straight from the mocked getWorkload above.
    expect(payload!.fields["Right now"]).toBe(
      "3 pending orders · 2 receipts to review · 1 new message",
    );
  });

  it("adds a dashboard link built from BETTER_AUTH_URL and the given path", async () => {
    process.env.BETTER_AUTH_URL = "https://trendyplaza.tech";

    const payload = await buildNotification({
      subject: "New message from Karim",
      dashboardPath: "/admin/messages",
      fields: { From: "Karim" },
    });

    expect(payload!.fields.Dashboard).toBe("https://trendyplaza.tech/en/admin/messages");
  });

  it("omits replyTo entirely when none is given, rather than sending it as undefined", async () => {
    const payload = await buildNotification({
      subject: "New message from Karim",
      dashboardPath: "/admin/messages",
      fields: { From: "Karim" },
    });

    expect(payload!.replyTo).toBeUndefined();
  });

  it("returns null, never throws, when the workload read fails", async () => {
    vi.mocked(getWorkload).mockRejectedValueOnce(new Error("db down"));

    await expect(
      buildNotification({ subject: "x", dashboardPath: "/admin/orders", fields: {} }),
    ).resolves.toBeNull();
  });
});
