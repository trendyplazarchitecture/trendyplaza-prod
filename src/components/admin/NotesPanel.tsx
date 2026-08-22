"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, StickyNote, X } from "lucide-react";
import { toast } from "sonner";

import { addNoteAction, archiveNoteAction } from "@/server/actions/notes";
import { Panel } from "./AdminChrome";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export type NoteRow = {
  id: string;
  body: string;
  createdAt: Date;
  authorName: string | null;
};

/**
 * The notes panel, used on an order sheet and on a student.
 *
 * One component for both, because it is one thing in the client's head: what
 * happened with this person. The whole point is that whoever rings tomorrow
 * can read what happened today, so the author and the time are always shown
 * and never optional.
 *
 * Removing a note archives it. It is a record of what someone was told, and
 * the day it matters is the day of a dispute.
 */
export function NotesPanel({
  subjectType,
  subjectId,
  notes,
}: {
  subjectType: "student" | "order";
  subjectId: string;
  notes: NoteRow[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [body, setBody] = useState("");

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!body.trim()) return;

    startTransition(async () => {
      const result = await addNoteAction({ subjectType, subjectId, body });
      if (result.ok) {
        setBody("");
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <Panel
      title="Notes"
      action={
        <span className="figures text-xs text-muted-foreground">{notes.length}</span>
      }
    >
      <form onSubmit={submit} className="space-y-2">
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={2}
          maxLength={2000}
          placeholder="Doesn't pick up. Try after 6pm."
          aria-label="Add a note"
          onKeyDown={(e) => {
            // Enter sends, because this is a one-line habit. Shift+Enter for a
            // second line, the way every chat box works.
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit(e);
            }
          }}
        />
        <div className="flex justify-end">
          <Button type="submit" size="sm" disabled={isPending || !body.trim()}>
            {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />}
            Add note
          </Button>
        </div>
      </form>

      {notes.length === 0 ? (
        <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <StickyNote className="h-4 w-4" aria-hidden="true" />
          Nothing recorded yet. The next person to ring will read whatever you put here.
        </p>
      ) : (
        <ul className="mt-4 space-y-2.5">
          {notes.map((note) => (
            <li
              key={note.id}
              className="group rounded-lg border border-border bg-paper/60 p-3"
            >
              <div className="flex items-start gap-2">
                <p className="min-w-0 flex-1 text-sm whitespace-pre-wrap">{note.body}</p>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                  aria-label="Remove this note"
                  disabled={isPending}
                  onClick={() =>
                    startTransition(async () => {
                      const result = await archiveNoteAction({
                        noteId: note.id,
                        subjectType,
                        subjectId,
                      });
                      if (result.ok) {
                        toast.success(result.message);
                        router.refresh();
                      } else {
                        toast.error(result.message);
                      }
                    })
                  }
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>

              <p className="ui-dense mt-1.5 text-[11px] text-muted-foreground">
                {note.authorName ?? "Someone"} &middot;{" "}
                {note.createdAt.toLocaleString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
