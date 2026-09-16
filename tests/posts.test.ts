import { describe, expect, it } from "vitest";
import { postCoverImageUrl } from "@/lib/media";
import { pickField } from "@/lib/i18n-content";

describe("postCoverImageUrl", () => {
  it("returns null for null or empty input", () => {
    expect(postCoverImageUrl(null)).toBeNull();
    expect(postCoverImageUrl(undefined)).toBeNull();
    expect(postCoverImageUrl("")).toBeNull();
  });

  it("preserves external https URLs", () => {
    expect(postCoverImageUrl("https://example.com/cover.jpg")).toBe(
      "https://example.com/cover.jpg",
    );
  });

  it("serves seeded posts from /posts/", () => {
    expect(postCoverImageUrl("seed/workshop.jpg")).toBe("/posts/workshop.jpg");
  });

  it("serves uploaded post covers via /api/media/posts/", () => {
    expect(postCoverImageUrl("posts/123-uuid.webp")).toBe(
      "/api/media/posts/123-uuid.webp",
    );
    expect(postCoverImageUrl("123-uuid.webp")).toBe(
      "/api/media/posts/123-uuid.webp",
    );
  });
});

describe("posts localization", () => {
  it("localizes post title and location correctly across locales", () => {
    const post = {
      titleEn: "Annual Architecture Exhibition 2026",
      titleFr: "Exposition Annuelle d'Architecture 2026",
      titleAr: "المعرض المعماري السنوي 2026",
      locationEn: "EPAU Algiers",
      locationFr: "EPAU Alger",
      locationAr: "المدرسة المتعددة العلوم للهندسة المعمارية والعمران - الجزائر",
    };

    expect(pickField("en", post, "title")).toBe("Annual Architecture Exhibition 2026");
    expect(pickField("fr", post, "title")).toBe("Exposition Annuelle d'Architecture 2026");
    expect(pickField("ar", post, "title")).toBe("المعرض المعماري السنوي 2026");

    expect(pickField("en", post, "location")).toBe("EPAU Algiers");
    expect(pickField("fr", post, "location")).toBe("EPAU Alger");
    expect(pickField("ar", post, "location")).toBe("المدرسة المتعددة العلوم للهندسة المعمارية والعمران - الجزائر");
  });

  it("falls back to English when Arabic location is absent", () => {
    const post = {
      titleEn: "Rhino 3D Masterclass",
      titleFr: null,
      titleAr: null,
      locationEn: "Online Webinar",
      locationFr: null,
      locationAr: null,
    };

    expect(pickField("ar", post, "title")).toBe("Rhino 3D Masterclass");
    expect(pickField("ar", post, "location")).toBe("Online Webinar");
  });
});
