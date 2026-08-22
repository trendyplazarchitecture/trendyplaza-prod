import { describe, expect, it } from "vitest";
import { pick, pickField } from "@/lib/i18n-content";

/**
 * Item 13 in _AI_CONTEXT/08_TESTING.md.
 *
 * Arabic is optional per record at input time, so a module loaded on a day
 * with no translator to hand has an empty `_ar`. The failure that matters is
 * silent: an empty heading renders as a blank line, and it looks like the
 * client's content was lost rather than untranslated.
 */

describe("pick", () => {
  it("returns the requested locale when it is there", () => {
    const values = { en: "Studio", fr: "Atelier", ar: "ورشة" };
    expect(pick("ar", values)).toBe("ورشة");
    expect(pick("fr", values)).toBe("Atelier");
    expect(pick("en", values)).toBe("Studio");
  });

  it("falls back to English before French when Arabic is missing", () => {
    // English is the authoring language, so it is first after the request.
    expect(pick("ar", { en: "Studio", fr: "Atelier", ar: null })).toBe("Studio");
    expect(pick("ar", { en: null, fr: "Atelier", ar: undefined })).toBe("Atelier");
  });

  it("treats whitespace as missing, and trims what it returns", () => {
    // An admin who tabs through the Arabic field leaves a space in it. That is
    // an untranslated record, not a translation.
    expect(pick("ar", { en: "Studio", fr: "Atelier", ar: "   " })).toBe("Studio");
    expect(pick("ar", { ar: "  ورشة  " })).toBe("ورشة");
  });

  it("falls back to Arabic rather than rendering nothing", () => {
    expect(pick("fr", { en: null, fr: "", ar: "ورشة" })).toBe("ورشة");
  });

  it("returns an empty string only when every locale is empty", () => {
    expect(pick("ar", { en: null, fr: null, ar: null })).toBe("");
    expect(pick("fr", {})).toBe("");
  });
});

describe("pickField", () => {
  it("reads the _en / _fr / _ar convention off a row", () => {
    const row = { titleEn: "Studio", titleFr: "Atelier", titleAr: "ورشة" };
    expect(pickField("ar", row, "title")).toBe("ورشة");
    expect(pickField("fr", row, "title")).toBe("Atelier");
  });

  it("renders the French title when a record has an empty title_ar", () => {
    // The case named in 08_TESTING.md, at the shape the callers actually use.
    const row = { titleEn: null, titleFr: "Atelier", titleAr: "" };
    expect(pickField("ar", row, "title")).toBe("Atelier");
    expect(pickField("ar", row, "title")).not.toBe("");
  });

  it("falls through to the Latin spelling on a two-column proper noun", () => {
    // Wilayas and communes carry _fr and _ar only. An English reader gets the
    // Latin spelling rather than a blank.
    const wilaya = { nameFr: "Alger", nameAr: "الجزائر" };
    expect(pickField("en", wilaya, "name")).toBe("Alger");
    expect(pickField("ar", wilaya, "name")).toBe("الجزائر");
  });
});
