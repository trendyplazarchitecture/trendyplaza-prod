"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Package, RotateCcw, Truck, X } from "lucide-react";
import { toast } from "sonner";

import {
  cancelOrderAction,
  confirmOrderAction,
  setOrderStatusAction,
} from "@/server/actions/orders";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";

/**
 * The actions for one order, on its own page.
 *
 * Only the step that is actually next is offered. A queue where every button
 * is always available is a queue where somebody marks an unconfirmed order
 * shipped, and stock moves at confirmation, so that ordering matters.
 *
 * Each action names its own permission on the server. The flags here only
 * decide what to draw.
 */
export function OrderActions({
  orderId,
  reference,
  status,
  canConfirm,
  canEdit,
}: {
  orderId: string;
  reference: string;
  status: string;
  canConfirm: boolean;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [cancelling, setCancelling] = useState(false);
  const [reason, setReason] = useState("");

  function run(fn: () => Promise<{ ok: boolean; message: string }>) {
    start(async () => {
      const result = await fn();
      toast[result.ok ? "success" : "error"](result.message);
      if (result.ok) router.refresh();
    });
  }

  const done = status === "delivered" || status === "cancelled" || status === "returned";

  const next: { label: string; Icon: typeof Truck; run: () => void } | null =
    status === "pending" && canConfirm
      ? {
          label: "Confirm by phone",
          Icon: Check,
          run: () => run(() => confirmOrderAction({ orderId })),
        }
      : status === "confirmed" && canEdit
        ? {
            label: "Mark packed",
            Icon: Package,
            run: () => run(() => setOrderStatusAction({ orderId, status: "packed" })),
          }
        : status === "packed" && canEdit
          ? {
              label: "Hand to courier",
              Icon: Truck,
              run: () => run(() => setOrderStatusAction({ orderId, status: "shipped" })),
            }
          : status === "shipped" && canEdit
            ? {
                label: "Mark delivered",
                Icon: Check,
                run: () => run(() => setOrderStatusAction({ orderId, status: "delivered" })),
              }
            : null;

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {next && (
          <Button size="sm" onClick={next.run} disabled={pending} className="gap-1.5">
            {pending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <next.Icon className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            {next.label}
          </Button>
        )}

        {canEdit && status === "shipped" && (
          <Button
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() => run(() => setOrderStatusAction({ orderId, status: "returned" }))}
            className="gap-1.5"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            Returned
          </Button>
        )}

        {canEdit && !done && (
          <Button
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() => setCancelling(true)}
            className="gap-1.5 text-primary-press hover:text-primary-press"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
            Cancel
          </Button>
        )}
      </div>

      {/* Destructive, so it confirms and names what it affects. */}
      <AlertDialog open={cancelling} onOpenChange={setCancelling}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel {reference}?</AlertDialogTitle>
            <AlertDialogDescription>
              The customer can read this reason when they track the order. If the order was
              already confirmed, the stock goes back.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Why it was cancelled"
            rows={3}
          />

          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction
              disabled={reason.trim().length < 3 || pending}
              onClick={() => {
                run(() => cancelOrderAction({ orderId, reasonEn: reason.trim() }));
                setCancelling(false);
                setReason("");
              }}
            >
              Cancel the order
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
