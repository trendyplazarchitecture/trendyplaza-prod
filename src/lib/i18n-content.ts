import type { Locale } from "../../i18n/routing";

export type { Locale };

/**
 * Content translation lives in the database as paired columns, one per locale.
 * A translation is optional per record at input time, so a read must fall back
 * rather than render an empty heading. An empty title showing as a blank line
 * is the most common multilingual bug and it looks like data loss to the
 * client.
 *
 * English is the authoring language, so it is first in every chain after the
 * requested locale.
 */
const FALLBACK: Record<Locale, readonly Locale[]> = {
  en: ["en", "fr", "ar"],
  ar: ["ar", "en", "fr"],
  fr: ["fr", "en", "ar"],
};

export type Translated = Partial<Record<Locale, string | null | undefined>>;

export function pick(locale: Locale, values: Translated): string {
  for (const candidate of FALLBACK[locale] ?? FALLBACK.en) {
    const value = values[candidate];
    if (value && value.trim()) return value.trim();
  }
  return "";
}

/**
 * Picks from a row using the `_en` / `_ar` / `_fr` column convention, so
 * callers write `pickField(locale, product, "title")` rather than naming all
 * three columns at every call site.
 *
 * Proper nouns are deliberately not tripled. A wilaya or commune has one Latin
 * spelling and one Arabic spelling, so those tables carry `_fr` and `_ar` only
 * and an English reader falls through to the Latin form.
 */
export function pickField<
  TField extends string,
  TRow extends Partial<
    Record<`${TField}En` | `${TField}Ar` | `${TField}Fr`, string | null>
  >,
>(locale: Locale, row: TRow, field: TField): string {
  return pick(locale, {
    en: row[`${field}En` as keyof TRow] as string | null | undefined,
    ar: row[`${field}Ar` as keyof TRow] as string | null | undefined,
    fr: row[`${field}Fr` as keyof TRow] as string | null | undefined,
  });
}

export { isRtlLocale as isRtl } from "../../i18n/routing";
