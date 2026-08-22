"use client";

import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

/**
 * Three languages, side by side, with the language marked.
 *
 * `_AI_CONTEXT/12_DESIGN.md` is explicit that these never go behind a tab: a
 * tab is a thing the client forgets to open, and a forgotten tab is a record
 * that renders in English on an Arabic page forever.
 *
 * English is required because it is the authoring language and the column
 * that is NOT NULL. The other two are optional and fall back at read time, so
 * they are marked optional rather than nagged about.
 */
const LANGS = [
  { key: "En" as const, label: "English", required: true, dir: "ltr" as const },
  { key: "Ar" as const, label: "العربية", required: false, dir: "rtl" as const },
  { key: "Fr" as const, label: "Français", required: false, dir: "ltr" as const },
];

export function TriLingualField({
  name,
  label,
  hint,
  values,
  multiline = false,
  className,
}: {
  /** Base field name. Emits `${name}En`, `${name}Ar`, `${name}Fr`. */
  name: string;
  label: string;
  hint?: string;
  values?: Partial<Record<"En" | "Ar" | "Fr", string | null>>;
  multiline?: boolean;
  className?: string;
}) {
  const t = useTranslations("admin.common");
  const Field = multiline ? Textarea : Input;

  return (
    <fieldset className={cn("space-y-2", className)}>
      <legend className="text-sm font-medium">
        {label}
        <span className="ms-2 text-xs font-normal text-muted-foreground">
          {/*
            "optional" on a label says the form will accept it empty. It does
            not say what a student then sees, which is the question the person
            filling this in actually has. Saying it here is the difference
            between leaving Arabic blank and typing English into the Arabic box
            to get past what looks like a required field.
          */}
          {hint ?? t("triLingualHint")}
        </span>
      </legend>

      {/*
        The three language columns always sit in this fixed En/Ar/Fr order and
        each field forces its own dir — the row's own direction is not tied to
        the admin's current locale, so it never mirrors under RTL.
      */}
      <div dir="ltr" className="grid gap-2 lg:grid-cols-3">
        {LANGS.map((lang) => {
          const id = `${name}${lang.key}`;
          return (
            <div key={lang.key} dir={lang.dir} className="space-y-1">
              <label
                htmlFor={id}
                className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase"
              >
                {lang.label}
                {lang.required ? (
                  <span className="text-primary-press" aria-hidden="true">
                    *
                  </span>
                ) : (
                  <span className="font-normal normal-case opacity-70">{t("optional")}</span>
                )}
              </label>
              <Field
                id={id}
                name={id}
                dir={lang.dir}
                required={lang.required}
                defaultValue={values?.[lang.key] ?? ""}
                rows={multiline ? 3 : undefined}
                // Arabic fields use the UI face, not Amiri: these are dense
                // form controls, not reading.
                className={cn("ui-dense text-sm", lang.key === "Ar" && "text-start")}
              />
            </div>
          );
        })}
      </div>
    </fieldset>
  );
}

/** Reads the three inputs back off a FormData. */
export function readTriLingual(form: FormData, name: string) {
  const get = (suffix: string) => {
    const value = form.get(`${name}${suffix}`);
    const trimmed = typeof value === "string" ? value.trim() : "";
    return trimmed || null;
  };
  return { en: get("En"), ar: get("Ar"), fr: get("Fr") };
}
