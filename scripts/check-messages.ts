import { readFileSync } from "node:fs";
import { locales } from "../i18n/routing";

/**
 * Item 12 in _AI_CONTEXT/08_TESTING.md. English is the reference catalogue,
 * because it is the authoring language. A key present in English and missing
 * elsewhere renders as the key itself on a live page, which looks like a bug
 * to a visitor and like nothing at all to us.
 *
 * Blocking in CI. Run with `npm run check:i18n`.
 */

type Json = { [key: string]: string | Json };

function flatten(value: Json, prefix = ""): string[] {
  return Object.entries(value).flatMap(([key, child]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return typeof child === "string" ? [path] : flatten(child, path);
  });
}

function load(locale: string): Json {
  return JSON.parse(readFileSync(`messages/${locale}.json`, "utf8")) as Json;
}

const reference = flatten(load("en"));
const referenceSet = new Set(reference);

let failed = false;

for (const locale of locales) {
  if (locale === "en") continue;

  const keys = flatten(load(locale));
  const keySet = new Set(keys);

  const missing = reference.filter((k) => !keySet.has(k));
  const extra = keys.filter((k) => !referenceSet.has(k));

  if (missing.length === 0 && extra.length === 0) {
    console.log(`  ${locale}: ${keys.length} keys, matches en`);
    continue;
  }

  failed = true;
  if (missing.length) {
    console.error(`\n  ${locale} is missing ${missing.length} key(s) present in en:`);
    for (const key of missing) console.error(`    - ${key}`);
  }
  if (extra.length) {
    console.error(`\n  ${locale} has ${extra.length} key(s) not in en:`);
    for (const key of extra) console.error(`    + ${key}`);
  }
}

if (failed) {
  console.error("\nMessage catalogues are out of step. Fix the keys above.\n");
  process.exit(1);
}

console.log(`\nAll ${locales.length} catalogues agree on ${reference.length} keys.`);
