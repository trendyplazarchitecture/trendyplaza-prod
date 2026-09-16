import type { ReactNode } from "react";
import type { Metadata } from "next";

import { AdminShell } from "@/components/admin/AdminShell";
import { Toaster } from "@/components/ui/sonner";
import { requireStaffOrNotFound } from "@/server/session";
import { getWorkload } from "@/server/admin";

export const metadata: Metadata = {
  title: "Admin",
  // The admin should never appear in a search result, and the shell rendering
  // 404 for signed-out visitors is the other half of the same idea.
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: ReactNode }) {
  // The shell requires any staff permission. It is not the gate:
  // every page and every action re-checks the permission it actually needs,
  // because a server action is reachable without this layout ever rendering.
  const user = await requireStaffOrNotFound();
  const workload = await getWorkload().catch(() => ({
    pendingOrders: 0,
    readyToShip: 0,
    pendingRequests: 0,
    lowStock: 0,
    pendingMessages: 0,
  }));

  return (
    <div className="min-h-screen bg-paper text-foreground lg:h-screen lg:overflow-hidden">
      <AdminShell
        user={{ name: user.name, email: user.email, permissions: [...user.permissions] }}
        workload={{
          pendingOrders: workload.pendingOrders,
          pendingRequests: workload.pendingRequests,
          pendingMessages: workload.pendingMessages,
        }}
      >
        {children}
      </AdminShell>

      {/* Every action reports back here. An action that silently succeeds is
          an action the operator repeats. */}
      <Toaster position="bottom-right" closeButton richColors />
    </div>
  );
}
