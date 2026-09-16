import "server-only";

import { getWorkload } from "./admin";
import type { NotificationPayload } from "@/lib/notify-payload";

/**
 * Builds the notification a server action hands back to the browser to send.
 *
 * The send itself lives in `@/lib/notify-client` and runs from the browser —
 * Web3Forms' free plan refuses server-to-server calls outright, confirmed
 * against the real key. What has to stay server-side is everything here:
 * the live workload snapshot and the dashboard link, both of which need a
 * database read an unauthenticated customer or student cannot do themselves.
 *
 * Never throws. A failure building this must never fail the order, message,
 * or receipt submission it was attached to — callers get `null` back and
 * simply don't have a notification to send that time.
 */

function dashboardUrl(path: string): string {
  const base =
    process.env.BETTER_AUTH_URL ||
    (process.env.NODE_ENV === "production"
      ? "https://trendyplaza.tech"
      : "http://localhost:3000");
  return `${base}/en${path}`;
}

/**
 * The three numbers the client already checks by hand every time one of
 * these emails would land — pending orders, receipts awaiting review, unread
 * messages. Read fresh per notification rather than cached, so the count is
 * honest about the moment the triggering write happened even when two of
 * these fire a few seconds apart.
 */
async function workloadLine(): Promise<string> {
  const w = await getWorkload();
  const part = (n: number, singular: string, plural: string) =>
    `${n} ${n === 1 ? singular : plural}`;
  return [
    part(w.pendingOrders, "pending order", "pending orders"),
    part(w.pendingRequests, "receipt to review", "receipts to review"),
    part(w.pendingMessages, "new message", "new messages"),
  ].join(" · ");
}

export async function buildNotification(input: {
  subject: string;
  fields: Record<string, string>;
  dashboardPath: string;
  replyTo?: string | null;
}): Promise<NotificationPayload | null> {
  try {
    const snapshot = await workloadLine();
    return {
      subject: input.subject,
      replyTo: input.replyTo,
      fields: {
        ...input.fields,
        "Right now": snapshot,
        Dashboard: dashboardUrl(input.dashboardPath),
      },
    };
  } catch (error) {
    console.error(`notify: failed to build "${input.subject}"`, error);
    return null;
  }
}
