/**
 * Algerian mobile numbers arrive as `0555123456`, `+213555123456`,
 * `00213555123456`, and every one of those with spaces or dots in it.
 * Normalise before validating, always, or a third of real customers fail
 * checkout.
 *
 * Canonical stored form is the national one: `0` + operator digit + 8 digits.
 */
export function normalisePhone(input: string): string | null {
  const digits = input.replace(/[^\d+]/g, "");

  let national = digits;
  if (national.startsWith("+213")) national = "0" + national.slice(4);
  else if (national.startsWith("00213")) national = "0" + national.slice(5);
  else if (national.startsWith("213") && national.length === 12)
    national = "0" + national.slice(3);

  // Some users drop the leading zero after the country code.
  if (/^[567]\d{8}$/.test(national)) national = "0" + national;

  return isValidPhone(national) ? national : null;
}

/** Mobile only. `5`, `6` and `7` are the operator prefixes; landlines start `02` to `04`. */
export function isValidPhone(candidate: string): boolean {
  return /^0[567]\d{8}$/.test(candidate);
}

/** `0555 12 34 56`, the way it is written on a delivery slip. */
export function formatPhone(phone: string): string {
  if (!isValidPhone(phone)) return phone;
  return `${phone.slice(0, 4)} ${phone.slice(4, 6)} ${phone.slice(6, 8)} ${phone.slice(8, 10)}`;
}
