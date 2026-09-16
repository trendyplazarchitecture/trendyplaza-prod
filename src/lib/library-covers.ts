/**
 * A small set of vetted "stock" cover illustrations, generated in-house
 * (gradients + typography, no photographic stock imagery — nothing to
 * license or attribute) — same role as `carousel-logos.ts`'s
 * `CAROUSEL_LOGO_FILES` for the Software Hub: a fixed picker the admin
 * form can offer alongside a real upload, kept out of `"use server"`
 * action files since a plain constant exported from one resolves to
 * garbage on the client (`10_GOTCHAS.md`).
 */
export const LIBRARY_COVER_FILES: { file: string; label: string }[] = [
  { file: "herbal-dispensatory.svg", label: "Herbal (green)" },
  { file: "how-to-win-friends.svg", label: "Classic (amber)" },
  { file: "way-of-superior-man.svg", label: "Navy & gold" },
  { file: "art-of-war.svg", label: "Strategy (black/red)" },
  { file: "guns-germs-steel.svg", label: "History (earth tones)" },
  { file: "im-ok-youre-ok.svg", label: "Psychology (teal)" },
  { file: "zero-to-one.svg", label: "Minimalist (mono)" },
  { file: "millionaire-fastlane.svg", label: "Business (green/gold)" },
];
