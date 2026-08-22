"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, ImageUp, Loader2, Pencil, Trash2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { StudentAvatar } from "./StudentAvatar";
import {
  removeAvatarAction,
  updateAvatarAction,
  updateDisplayNameAction,
} from "@/server/actions/student";

/**
 * The profile: a picture, a name, and the email that is neither.
 *
 * The email is shown and is not editable here. It is the identity Better Auth
 * authenticates against, and changing it is an account-recovery flow with a
 * verification step, not a text field on a dashboard.
 *
 * The picture is uploaded straight on choosing a file rather than behind a
 * "save" button. There is one field, the change is visible immediately, and a
 * second click to confirm what you can already see is a click that only ever
 * gets forgotten.
 */
export function ProfileCard({
  name,
  email,
  image,
}: {
  name: string;
  email: string;
  image: string | null;
}) {
  const t = useTranslations("portal.profile");
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);

  const [pending, start] = useTransition();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);

  function report(result: { ok: boolean; reason?: string }) {
    if (result.ok) {
      toast.success(t("saved"));
      router.refresh();
      return;
    }
    // Each failure names what to do about it. "Something went wrong" is a
    // message that ends the conversation.
    toast.error(t(`errors.${result.reason ?? "invalid"}`));
  }

  function onFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const body = new FormData();
    body.set("avatar", file);
    // Cleared so choosing the same file twice fires a change event again.
    event.target.value = "";

    start(async () => report(await updateAvatarAction(body)));
  }

  function saveName() {
    const value = draft.trim();
    if (value === name) {
      setEditing(false);
      return;
    }
    start(async () => {
      const result = await updateDisplayNameAction({ name: value });
      report(result);
      if (result.ok) setEditing(false);
    });
  }

  return (
    <section
      id="profile"
      className="sheet-ticks scroll-mt-24 rounded-xl border border-rule bg-card p-5"
      aria-labelledby="profile-heading"
    >
      <h2
        id="profile-heading"
        className="text-sm font-semibold tracking-tight"
      >
        {t("title")}
      </h2>

      <div className="mt-4 flex items-start gap-4">
        <div className="relative shrink-0">
          <StudentAvatar name={name} image={image} className="h-16 w-16 text-xl" />
          {pending && (
            <span className="absolute inset-0 flex items-center justify-center rounded-full bg-background/70">
              <Loader2 className="h-4 w-4 animate-spin text-primary" aria-hidden="true" />
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          {editing ? (
            <div className="flex items-center gap-1.5">
              <input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") saveName();
                  if (event.key === "Escape") {
                    setDraft(name);
                    setEditing(false);
                  }
                }}
                aria-label={t("nameLabel")}
                maxLength={80}
                autoFocus
                className="h-9 min-w-0 flex-1 rounded-md border border-rule bg-background px-2.5 text-sm"
              />
              <button
                type="button"
                onClick={saveName}
                disabled={pending}
                aria-label={t("save")}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-rule text-primary transition-colors hover:bg-paper"
              >
                <Check className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setDraft(name);
                  setEditing(false);
                }}
                aria-label={t("cancel")}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-rule text-muted-foreground transition-colors hover:bg-paper"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          ) : (
            <p className="flex items-center gap-2">
              <span className="truncate font-semibold">{name}</span>
              <button
                type="button"
                onClick={() => setEditing(true)}
                aria-label={t("rename")}
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </p>
          )}

          <p className="mt-1 truncate text-sm text-muted-foreground">{email}</p>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <input
              ref={fileInput}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={onFile}
              className="sr-only"
            />
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              disabled={pending}
              className="inline-flex h-9 items-center gap-1.5 rounded-md border border-rule px-3 text-xs font-semibold transition-colors hover:bg-paper disabled:opacity-60"
            >
              <ImageUp className="h-3.5 w-3.5" aria-hidden="true" />
              {image ? t("changePhoto") : t("addPhoto")}
            </button>

            {image && (
              <button
                type="button"
                onClick={() => start(async () => report(await removeAvatarAction()))}
                disabled={pending}
                className="inline-flex h-9 items-center gap-1.5 rounded-md px-2.5 text-xs text-muted-foreground transition-colors hover:text-foreground disabled:opacity-60"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                {t("removePhoto")}
              </button>
            )}
          </div>

          <p className="mt-2 text-xs text-muted-foreground">{t("photoHint")}</p>
        </div>
      </div>
    </section>
  );
}
