import type { MetadataRoute } from "next";
import { locales } from "@/../i18n/routing";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.BETTER_AUTH_URL ||
    (process.env.NODE_ENV === "production"
      ? "https://trendyplaza.tech"
      : "http://localhost:3000");

  const staticPages = [
    { path: "", changeFrequency: "daily" as const, priority: 1.0 },
    { path: "/catalogue", changeFrequency: "daily" as const, priority: 0.9 },
    { path: "/news", changeFrequency: "daily" as const, priority: 0.8 },
    { path: "/events", changeFrequency: "daily" as const, priority: 0.8 },
    { path: "/about", changeFrequency: "monthly" as const, priority: 0.7 },
    { path: "/contact", changeFrequency: "monthly" as const, priority: 0.7 },
    { path: "/track-order", changeFrequency: "monthly" as const, priority: 0.5 },
  ];

  const now = new Date();
  const entries: MetadataRoute.Sitemap = [];

  // Static localized routes
  for (const page of staticPages) {
    for (const locale of locales) {
      const url = `${baseUrl}/${locale}${page.path}`;
      entries.push({
        url,
        lastModified: now,
        changeFrequency: page.changeFrequency,
        priority: page.priority,
        alternates: {
          languages: Object.fromEntries(
            locales.map((l) => [l, `${baseUrl}/${l}${page.path}`]),
          ),
        },
      });
    }
  }

  return entries;
}
