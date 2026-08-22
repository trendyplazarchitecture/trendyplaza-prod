"use client";

import { useState, useTransition } from "react";
import {
  AtSign,
  CheckCircle2,
  Loader2,
  Mail,
  MessageSquare,
  Phone,
  Send,
  Tag,
  User,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { submitContactMessageAction } from "@/server/actions/contact";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

/**
 * The form half of the contact page.
 *
 * Two names rather than one, matching the reference, but everything after
 * that is what this project actually has: no live chat, no phone rota with
 * office hours — a message that lands in `/admin/messages` and gets answered
 * on Instagram or by phone, same as every other channel on this site.
 *
 * Fields carry their own icon rather than a plain shadcn `<Input>`, matching
 * the drafting-sheet language used everywhere else a field needs one — the
 * code lookup, the search bar — rather than a generic form.
 */

function Field({
  id,
  name,
  label,
  Icon,
  type = "text",
  required,
  maxLength,
  dir,
  autoComplete,
}: {
  id: string;
  name: string;
  label: string;
  Icon: typeof User;
  type?: string;
  required?: boolean;
  maxLength?: number;
  dir?: "ltr" | "rtl";
  autoComplete?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <div className="relative">
        <Icon
          className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <input
          id={id}
          name={name}
          type={type}
          required={required}
          maxLength={maxLength}
          dir={dir}
          autoComplete={autoComplete}
          className="h-11 w-full rounded-lg border border-rule bg-background ps-10 pe-3.5 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary/50 focus:ring-2 focus:ring-primary/15"
        />
      </div>
    </div>
  );
}

export function ContactForm() {
  const t = useTranslations("contactPage.form");
  const [pending, start] = useTransition();
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const body = String(form.get("body") ?? "").trim();
    const email = String(form.get("email") ?? "").trim();
    const phone = String(form.get("phone") ?? "").trim();
    if (!name || !body) return;

    // Checked here too, not only on the server: a student who left both
    // fields empty should see why before the round trip, not after it.
    if (!email && !phone) {
      setError(t("errors.noContactMethod"));
      return;
    }

    setError(null);
    start(async () => {
      const result = await submitContactMessageAction({
        name,
        email,
        phone,
        subject: String(form.get("subject") ?? "").trim(),
        body,
        // A field no real visitor can see or reach by tabbing. Left empty by
        // everyone except a script that fills in every input it finds.
        website: String(form.get("website") ?? ""),
      });

      if (result.ok) {
        setDone(true);
        return;
      }

      const messages = {
        rate_limited: t("errors.rateLimited"),
        no_contact_method: t("errors.noContactMethod"),
        invalid: t("errors.invalid"),
      } as const;
      setError(messages[result.reason]);
    });
  }

  if (done) {
    return (
      <div className="flex flex-col items-center py-10 text-center">
        <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
          <CheckCircle2 className="h-7 w-7 text-primary" aria-hidden="true" />
        </span>
        <h3 className="mt-5 text-lg font-bold">{t("sentTitle")}</h3>
        <p className="mt-2 max-w-xs text-sm text-muted-foreground">{t("sentBody")}</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {/*
        The honeypot. `sr-only` rather than `display: none` — some scraping
        bots skip fields a stylesheet hides outright, and this still "exists"
        as a field for a form-filling bot to find. It stays a clipped 1x1 box
        in normal flow, never pushed off the page, which matters on this site
        specifically: a fixed-off-screen honeypot is exactly the shape of bug
        that put an admin drawer into horizontal scroll earlier this session.
        `tabIndex={-1}` and `aria-hidden` keep it out of a real visitor's tab
        order and off a screen reader's list.
      */}
      <div className="sr-only" aria-hidden="true">
        <label htmlFor="website">Leave this field empty</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="name" name="name" label={t("name")} Icon={User} required maxLength={120} autoComplete="name" />
        <Field id="phone" name="phone" label={t("phone")} Icon={Phone} type="tel" maxLength={40} dir="ltr" autoComplete="tel" />
      </div>

      <Field id="email" name="email" label={t("email")} Icon={AtSign} type="email" maxLength={255} dir="ltr" autoComplete="email" />
      <p className="text-xs text-muted-foreground">{t("contactHint")}</p>

      <Field id="subject" name="subject" label={t("subject")} Icon={Tag} maxLength={200} />

      <div className="space-y-1.5">
        <label htmlFor="body" className="text-sm font-medium">
          {t("message")}
        </label>
        <div className="relative">
          <MessageSquare
            className="pointer-events-none absolute start-3.5 top-3.5 h-4 w-4 text-muted-foreground"
            aria-hidden="true"
          />
          <Textarea
            id="body"
            name="body"
            required
            maxLength={4000}
            rows={5}
            className="ps-10 focus-visible:ring-2 focus-visible:ring-primary/15"
          />
        </div>
      </div>

      {error && <p className="text-sm text-primary-press">{error}</p>}

      <button
        type="submit"
        disabled={pending}
        className={cn(
          "inline-flex h-12 items-center gap-2 rounded-lg bg-primary px-7 text-sm font-bold text-primary-foreground",
          "transition-all hover:bg-primary-press hover:shadow-md hover:shadow-primary/20 disabled:opacity-60",
        )}
      >
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <Send className="h-4 w-4" aria-hidden="true" />
        )}
        {t("submit")}
      </button>
    </form>
  );
}
