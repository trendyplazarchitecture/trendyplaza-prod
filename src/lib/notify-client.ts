import type { NotificationPayload } from "./notify-payload";

/**
 * Sends one notification to the client's inbox, from the browser, via
 * Web3Forms.
 *
 * This has to run client-side, not server-side: Web3Forms' free plan
 * rejects every server-to-server call outright ("this method is not
 * allowed... Pro plan is required" to allowlist a server IP) — confirmed by
 * hand against the real key before this file existed. Web3Forms is built to
 * be called from a browser in the first place, which is also why exposing
 * the access key here is not a real exposure: it can only ever trigger one
 * fixed email to one fixed inbox this app never even learns the address of,
 * nothing else.
 *
 * Fire-and-forget, matching the server-side pattern it replaced: nobody
 * awaits this, and it never throws — a Web3Forms outage or an ad blocker
 * eating the request must never surface as an error to someone who just
 * placed an order, sent a message, or submitted a receipt.
 */
export function sendNotification(payload: NotificationPayload): void {
  const accessKey = process.env.NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY;
  if (!accessKey) return; // Not configured — every environment until it's set in Coolify.

  fetch("https://api.web3forms.com/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      access_key: accessKey,
      subject: payload.subject,
      from_name: "Trendy Plaza Architecture",
      ...(payload.replyTo ? { email: payload.replyTo } : {}),
      ...payload.fields,
    }),
  }).catch((error) => {
    console.error(`notify: failed to send "${payload.subject}"`, error);
  });
}
