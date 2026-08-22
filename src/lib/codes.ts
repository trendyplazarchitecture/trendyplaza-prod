import { randomInt } from "node:crypto";

/**
 * The random body never uses `0` `1` `I` `L` `O`. A code is read off a printed
 * card by a tired student on a phone, and those five are where every mistyped
 * code comes from.
 *
 * The admin-chosen prefix is exempt, because a prefix carries meaning: `TPS1`
 * tells the student and the support line which batch a card came from, and
 * silently dropping the `1` would defeat that. `normaliseCode` folds the
 * confusable characters on both sides instead, so a student who types `TPSI`
 * still matches a code stored as `TPS1`.
 */
const BODY_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

const BODY_LENGTH = 12;
const GROUP = 4;

/**
 * The canonical form: uppercase, no separators, confusables folded. Both the
 * stored code and whatever the student types pass through this before they
 * are compared, so the fold has to be applied when writing as well as reading.
 */
export function normaliseCode(input: string): string {
  return input
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .replace(/O/g, "0")
    .replace(/[IL]/g, "1");
}

/** The printed form: grouped in fours so it can be read aloud and typed. */
export function formatCode(code: string): string {
  const groups = code.match(new RegExp(`.{1,${GROUP}}`, "g")) ?? [code];
  return groups.join("-");
}

function randomBody(length: number): string {
  let out = "";
  for (let i = 0; i < length; i += 1) {
    out += BODY_ALPHABET[randomInt(BODY_ALPHABET.length)];
  }
  return out;
}

export function generateCode(prefix: string): string {
  return normaliseCode(prefix) + randomBody(BODY_LENGTH);
}

/**
 * Collision at 31^12 is not a practical concern, but a batch containing a
 * duplicate would fail its unique index part-way through the insert and leave
 * the batch short, so the set is de-duplicated here rather than discovered in
 * Postgres.
 */
export function generateCodeBatch(prefix: string, quantity: number): string[] {
  const seen = new Set<string>();
  while (seen.size < quantity) {
    seen.add(generateCode(prefix));
  }
  return [...seen];
}
