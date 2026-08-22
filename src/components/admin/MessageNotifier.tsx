"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";

import { usePathname, useRouter } from "../../../i18n/navigation";
import { getPendingMessageCountAction } from "@/server/actions/messages";

const POLL_MS = 30_000;

/**
 * Polls the pending contact-message count while an admin tab is open and
 * toasts when it goes up. No WebSockets, no push — this project has no mail
 * or push infrastructure anywhere else, and a contact form getting a handful
 * of submissions a day doesn't need it. See NextPhase/13 for the reasoning.
 */
export function MessageNotifier() {
  const router = useRouter();
  const pathname = usePathname();
  const lastSeen = useRef<number | null>(null);
  const baseTitle = useRef<string | null>(null);
  const unreadRef = useRef(0);

  // Visiting the messages screen counts as reading them, same as refocusing the tab.
  useEffect(() => {
    if (pathname.endsWith("/admin/messages") && baseTitle.current !== null) {
      unreadRef.current = 0;
      document.title = baseTitle.current;
    }
  }, [pathname]);

  useEffect(() => {
    baseTitle.current = document.title;

    function restoreTitle() {
      if (baseTitle.current !== null) document.title = baseTitle.current;
    }

    function setUnreadTitle(n: number) {
      if (document.hidden && n > 0 && baseTitle.current !== null) {
        document.title = `(${n}) ${baseTitle.current}`;
      }
    }

    async function poll() {
      let count: number;
      try {
        count = await getPendingMessageCountAction();
      } catch {
        return;
      }

      if (lastSeen.current !== null && count > lastSeen.current) {
        const delta = count - lastSeen.current;
        unreadRef.current += delta;
        toast(delta === 1 ? "1 new message" : `${delta} new messages`, {
          action: {
            label: "View",
            onClick: () => router.push("/admin/messages"),
          },
        });
        setUnreadTitle(unreadRef.current);
      }
      lastSeen.current = count;
    }

    function onVisibilityChange() {
      if (!document.hidden) {
        unreadRef.current = 0;
        restoreTitle();
      }
    }

    poll();
    const interval = setInterval(poll, POLL_MS);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      restoreTitle();
    };
  }, [router]);

  return null;
}
