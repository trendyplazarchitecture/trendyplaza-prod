"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCheck, Loader2, Mail, MailOpen, Phone, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { archiveMessageAction, setMessageStatusAction } from "@/server/actions/messages";
import {
  purgeManyFromTrashAction,
  restoreFromTrashAction,
  restoreManyFromTrashAction,
  type ActionResult,
} from "@/server/actions/trash";
import { BulkBar } from "./BulkBar";
import { Empty } from "./AdminChrome";
import { StatusPill, type Tone } from "./StatusPill";
import { CopyButton } from "./CopyButton";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

export type MessageRow = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  subject: string | null;
  body: string;
  status: "new" | "read" | "answered";
  createdAt: Date;
};

const TONE: Record<MessageRow["status"], Tone> = {
  new: "pending",
  read: "active",
  answered: "done",
};

function when(date: Date) {
  return new Date(date).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export type TrashedMessageRow = {
  id: string;
  /** "Name: subject", as `src/server/trash.ts` formats it. */
  title: string;
  archivedAt: string;
  daysRemaining: number;
};

function whenTrashed(iso: string) {
  return new Date(iso).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

/**
 * The contact form's other end.
 *
 * "Answered" is not sent from here — there is no outbound email in this
 * project. It records that the admin has actually messaged the person back
 * on WhatsApp or Instagram, using the phone or email the message itself
 * carries, which is why both are links rather than plain text.
 */
export function MessagesTable({
  messages,
  canReply,
  trashRows,
}: {
  messages: MessageRow[];
  canReply: boolean;
  trashRows: TrashedMessageRow[];
}) {
  const router = useRouter();
  const [filter, setFilter] = useState<"all" | MessageRow["status"] | "trashed">("all");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkPurging, setBulkPurging] = useState(false);
  const [bulkConfirmText, setBulkConfirmText] = useState("");

  const filtered = filter === "all" || filter === "trashed" ? messages : messages.filter((m) => m.status === filter);
  const counts = {
    all: messages.length,
    new: messages.filter((m) => m.status === "new").length,
    read: messages.filter((m) => m.status === "read").length,
    answered: messages.filter((m) => m.status === "answered").length,
  };

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function setStatus(id: string, status: MessageRow["status"]) {
    setBusyId(id);
    startTransition(async () => {
      const result = await setMessageStatusAction({ id, status });
      if (result.ok) {
        router.refresh();
      } else {
        toast.error(result.message);
      }
      setBusyId(null);
    });
  }

  function archive(id: string) {
    setBusyId(id);
    startTransition(async () => {
      const result = await archiveMessageAction({ id });
      if (result.ok) {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.message);
      }
      setBusyId(null);
    });
  }

  function bulkArchive() {
    const ids = filtered.filter((m) => selected.has(m.id)).map((m) => m.id);
    startTransition(async () => {
      const results = await Promise.all(ids.map((id) => archiveMessageAction({ id })));
      const failed = results.filter((r) => !r.ok).length;
      if (failed === 0) toast.success("Moved to trash.");
      else toast.error(`${failed} of ${ids.length} did not go through.`);
      setSelected(new Set());
      router.refresh();
    });
  }

  function bulkRestore() {
    startTransition(async () => {
      const result: ActionResult = await restoreManyFromTrashAction({
        entity: "contact_message",
        ids: Array.from(selected),
      });
      if (result.ok) toast.success(result.message);
      else toast.error(result.message);
      setSelected(new Set());
      router.refresh();
    });
  }

  function bulkPurge() {
    setBulkPurging(false);
    startTransition(async () => {
      const result: ActionResult = await purgeManyFromTrashAction({
        entity: "contact_message",
        ids: Array.from(selected),
      });
      if (result.ok) toast.success(result.message);
      else toast.error(result.message);
      setBulkConfirmText("");
      setSelected(new Set());
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1.5">
        {(["all", "new", "read", "answered"] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => {
              setFilter(key);
              setSelected(new Set());
            }}
            className={`ui-dense inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
              filter === key
                ? "border-foreground/30 bg-paper text-foreground"
                : "border-border text-muted-foreground hover:border-foreground/20"
            }`}
          >
            {key === "all" ? "All" : key[0].toUpperCase() + key.slice(1)}
            <span className="figures">{counts[key]}</span>
          </button>
        ))}
        {canReply && (
          <button
            type="button"
            onClick={() => {
              setFilter("trashed");
              setSelected(new Set());
            }}
            className={`ui-dense inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
              filter === "trashed"
                ? "border-foreground/30 bg-paper text-foreground"
                : "border-border text-muted-foreground hover:border-foreground/20"
            }`}
          >
            Trashed
            <span className="figures">{trashRows.length}</span>
          </button>
        )}
      </div>

      {filter === "trashed" ? (
        trashRows.length === 0 ? (
          <Empty title="Nothing in the trash" hint="Deleted messages end up here for 30 days." />
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={selected.size === trashRows.length}
                onCheckedChange={() =>
                  setSelected((prev) =>
                    prev.size === trashRows.length ? new Set() : new Set(trashRows.map((r) => r.id)),
                  )
                }
                aria-label="Select all trashed messages"
              />
              <span className="text-xs text-muted-foreground">Select all</span>
            </div>

            <BulkBar count={selected.size} onClear={() => setSelected(new Set())}>
              <Button
                variant="outline"
                size="sm"
                className="h-7 gap-1 px-2 text-xs"
                disabled={isPending}
                onClick={bulkRestore}
              >
                <RotateCcw className="h-3 w-3" />
                Restore
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1 px-2 text-xs text-primary-press hover:text-primary-press"
                disabled={isPending}
                onClick={() => {
                  setBulkConfirmText("");
                  setBulkPurging(true);
                }}
              >
                <Trash2 className="h-3 w-3" />
                Delete forever
              </Button>
            </BulkBar>

            <ul className="space-y-2">
              {trashRows.map((row) => (
                <li
                  key={row.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card p-3"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-2.5">
                    <Checkbox
                      checked={selected.has(row.id)}
                      onCheckedChange={() => toggleOne(row.id)}
                      aria-label={`Select ${row.title}`}
                    />
                    <div className="min-w-0">
                      <span className="block truncate text-sm font-medium">{row.title}</span>
                      <span className="text-xs text-muted-foreground">
                        Trashed {whenTrashed(row.archivedAt)} — {row.daysRemaining} day
                        {row.daysRemaining === 1 ? "" : "s"} left
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 gap-1 px-2 text-xs"
                    disabled={isPending}
                    onClick={() =>
                      startTransition(async () => {
                        const result = await restoreFromTrashAction({ entity: "contact_message", id: row.id });
                        if (result.ok) toast.success(result.message);
                        else toast.error(result.message);
                        router.refresh();
                      })
                    }
                  >
                    <RotateCcw className="h-3 w-3" />
                    Restore
                  </Button>
                </li>
              ))}
            </ul>

            <AlertDialog
              open={bulkPurging}
              onOpenChange={(open) => {
                setBulkPurging(open);
                if (!open) setBulkConfirmText("");
              }}
            >
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Delete {selected.size} message{selected.size === 1 ? "" : "s"} forever?
                  </AlertDialogTitle>
                  <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
                </AlertDialogHeader>
                <div className="space-y-1.5">
                  <Label htmlFor="messages-bulk-confirm" className="text-xs">
                    Type <span className="font-mono font-semibold">DELETE</span> to confirm
                  </Label>
                  <Input
                    id="messages-bulk-confirm"
                    value={bulkConfirmText}
                    onChange={(e) => setBulkConfirmText(e.target.value)}
                    autoComplete="off"
                  />
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep them</AlertDialogCancel>
                  <AlertDialogAction disabled={bulkConfirmText.trim() !== "DELETE"} onClick={bulkPurge}>
                    Delete forever
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )
      ) : filtered.length === 0 ? (
        <Empty
          title={filter === "all" ? "No messages yet" : `No ${filter} messages`}
          hint="The contact page writes here the moment someone sends one."
        />
      ) : (
        <>
          {canReply && (
            <BulkBar count={selected.size} onClear={() => setSelected(new Set())}>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1 px-2 text-xs text-primary-press hover:text-primary-press"
                disabled={isPending}
                onClick={bulkArchive}
              >
                <Trash2 className="h-3 w-3" />
                Delete {selected.size}
              </Button>
            </BulkBar>
          )}
          <ul className="space-y-2">
          {filtered.map((m) => (
            <li key={m.id} className="rounded-lg border border-border bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1">
                    {canReply && (
                      <Checkbox
                        checked={selected.has(m.id)}
                        onCheckedChange={() => toggleOne(m.id)}
                        aria-label={`Select message from ${m.name}`}
                        className="me-1"
                      />
                    )}
                    <span className="text-sm font-semibold">{m.name}</span>
                    <CopyButton value={m.name} label="Copy the sender's name" />
                    <StatusPill tone={TONE[m.status]} className="ms-1">
                      {m.status}
                    </StatusPill>
                    <span className="text-xs text-muted-foreground">{when(m.createdAt)}</span>
                  </div>
                  {m.subject && <p className="mt-1 text-sm font-medium">{m.subject}</p>}
                  <p className="mt-1.5 max-w-2xl text-sm whitespace-pre-wrap text-muted-foreground">
                    {m.body}
                  </p>
                  <div className="mt-2.5 flex flex-wrap items-center gap-3 text-xs">
                    {m.email && (
                      <span className="inline-flex items-center gap-1">
                        <a
                          href={`mailto:${m.email}`}
                          className="inline-flex items-center gap-1.5 text-primary hover:text-primary-press"
                        >
                          <Mail className="h-3.5 w-3.5" aria-hidden="true" />
                          <bdi dir="ltr">{m.email}</bdi>
                        </a>
                        <CopyButton value={m.email} label="Copy the email address" />
                      </span>
                    )}
                    {m.phone && (
                      <span className="inline-flex items-center gap-1">
                        <a
                          href={`tel:${m.phone}`}
                          className="inline-flex items-center gap-1.5 text-primary hover:text-primary-press"
                        >
                          <Phone className="h-3.5 w-3.5" aria-hidden="true" />
                          <bdi dir="ltr">{m.phone}</bdi>
                        </a>
                        <CopyButton value={m.phone} label="Copy the phone number" />
                      </span>
                    )}
                  </div>
                </div>

                {canReply && (
                  <div className="flex shrink-0 items-center gap-1.5">
                    {m.status === "new" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 gap-1 px-2 text-xs"
                        disabled={isPending && busyId === m.id}
                        onClick={() => setStatus(m.id, "read")}
                      >
                        {isPending && busyId === m.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <MailOpen className="h-3 w-3" />
                        )}
                        Mark read
                      </Button>
                    )}
                    {m.status !== "answered" && (
                      <Button
                        size="sm"
                        className="h-7 gap-1 px-2 text-xs"
                        disabled={isPending && busyId === m.id}
                        onClick={() => setStatus(m.id, "answered")}
                      >
                        {isPending && busyId === m.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <CheckCheck className="h-3 w-3" />
                        )}
                        Mark answered
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 gap-1 px-2 text-xs text-primary-press hover:text-primary-press"
                      disabled={isPending && busyId === m.id}
                      onClick={() => archive(m.id)}
                    >
                      {isPending && busyId === m.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Trash2 className="h-3 w-3" />
                      )}
                      Delete
                    </Button>
                  </div>
                )}
              </div>
            </li>
          ))}
          </ul>
        </>
      )}
    </div>
  );
}
