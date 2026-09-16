/**
 * The shape a server action hands back to the browser so the browser can
 * send it. Nothing here is server-only — it has to be importable from a
 * client component — but nothing here is sensitive either: it is exactly the
 * table of fields a client-side `sendNotification` call posts to Web3Forms.
 *
 * See `src/lib/notify-client.ts` for why the send itself has to happen here,
 * in the browser, rather than in the server action that builds this.
 */
export type NotificationPayload = {
  subject: string;
  fields: Record<string, string>;
  /** Set to the customer's or student's address so a reply in the client's inbox reaches them directly. */
  replyTo?: string | null;
};
