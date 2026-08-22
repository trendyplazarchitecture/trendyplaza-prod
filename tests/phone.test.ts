import { describe, expect, it } from "vitest";
import { formatPhone, isValidPhone, normalisePhone } from "@/lib/phone";

/**
 * Item 9 in _AI_CONTEXT/08_TESTING.md.
 *
 * The number is the only way the client reaches the customer, and checkout has
 * no account behind it to correct a mistake later. Every form below is one a
 * real customer types, and all of them have to land on the same canonical
 * string, or the same person places two orders the admin cannot join up.
 */

describe("normalisePhone", () => {
  it("accepts the four input forms and stores one of them", () => {
    for (const input of [
      "0555123456",
      "+213555123456",
      "00213555123456",
      "213555123456",
    ]) {
      expect(normalisePhone(input), input).toBe("0555123456");
    }
  });

  it("ignores spaces, dots and dashes wherever they fall", () => {
    for (const input of [
      "0555 12 34 56",
      "0555.12.34.56",
      "0555-12-34-56",
      "  0555123456  ",
      "+213 555 12 34 56",
      "00213 555.12.34.56",
    ]) {
      expect(normalisePhone(input), input).toBe("0555123456");
    }
  });

  it("restores the zero a customer drops after the country code", () => {
    expect(normalisePhone("555123456")).toBe("0555123456");
    expect(normalisePhone("661234567")).toBe("0661234567");
    expect(normalisePhone("770123456")).toBe("0770123456");
  });

  it("takes all three operator prefixes", () => {
    expect(normalisePhone("0555123456")).toBe("0555123456");
    expect(normalisePhone("0661234567")).toBe("0661234567");
    expect(normalisePhone("0770123456")).toBe("0770123456");
  });

  it("rejects a landline", () => {
    // 021 Alger, 031 Constantine, 041 Oran. A courier cannot ring these.
    expect(normalisePhone("021123456")).toBeNull();
    expect(normalisePhone("031234567")).toBeNull();
    expect(normalisePhone("041234567")).toBeNull();
    expect(normalisePhone("+213021123456")).toBeNull();
  });

  it("rejects the wrong length rather than truncating it", () => {
    expect(normalisePhone("055512345")).toBeNull();
    expect(normalisePhone("05551234567")).toBeNull();
    expect(normalisePhone("")).toBeNull();
    expect(normalisePhone("not a number")).toBeNull();
  });

  it("rejects a foreign number that is not Algerian", () => {
    expect(normalisePhone("+33612345678")).toBeNull();
    expect(normalisePhone("+216555123456")).toBeNull();
  });

  it("is idempotent, so re-saving an order does not corrupt the number", () => {
    const once = normalisePhone("+213 555 12 34 56")!;
    expect(normalisePhone(once)).toBe(once);
  });
});

describe("isValidPhone", () => {
  it("passes only the canonical stored form", () => {
    expect(isValidPhone("0555123456")).toBe(true);
    // Valid input, but not what the column holds.
    expect(isValidPhone("+213555123456")).toBe(false);
    expect(isValidPhone("0555 12 34 56")).toBe(false);
  });
});

describe("formatPhone", () => {
  it("groups a stored number the way a delivery slip reads", () => {
    expect(formatPhone("0555123456")).toBe("0555 12 34 56");
  });

  it("returns anything it cannot format untouched, rather than mangling it", () => {
    expect(formatPhone("021123456")).toBe("021123456");
  });
});
