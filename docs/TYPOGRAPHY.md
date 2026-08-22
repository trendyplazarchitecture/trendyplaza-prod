# Typography

Three scripts, one voice. Latin and Arabic are set in different families
because no single family does both well at this level, and the pairing is
chosen so a page does not visibly change character when the switcher flips.

## Current stack

| Role | Latin (en, fr) | Arabic (ar) |
|---|---|---|
| Display, headings | Montserrat, 700–800, tracking −0.03em | **Changa**, 700 |
| Body, long prose | Montserrat, 400–500 | **Almarai**, 400 |
| Dense UI: table cells, labels, buttons, badges | Montserrat, 500–600 | **Almarai**, 400–700 |
| Figures, codes, dimensions | Montserrat tabular / `--font-mono` | same |

## Reverted, 12 August 2026: Amiri back to Changa

A session earlier the same day switched Arabic display and body from Changa to
**Amiri**, a Naskh revival, on the reasoning that it reads as academic
publishing rather than a tech brand — recorded below, for the argument.

**It shipped broken.** `src/styles.css` was changed to reference `"Amiri"`,
but the font was never added to the Google Fonts request in
`app/[locale]/layout.tsx` — that link still asked for Montserrat, Changa and
Almarai only. Every Arabic heading and paragraph was silently falling back to
the *next* name in the CSS stack, `Georgia`, a serif that was never chosen or
tested for this product. The failure was invisible in an English-language
review: `[lang="ar"]` never matched, `en` and `fr` pages were untouched, and
nothing in the seven CI gates checks that a referenced font is actually
requested. That is worth fixing before choosing a font again, not repeating.

Reverted rather than repaired: load Amiri correctly and keep the intended
switch, or go back to the pairing that was shipping. Changa was already
proven — it was live in production-shaped review for weeks — so it went back
in, and the Amiri-specific spacing (17px body, 1.9 line height) went with it,
since Almarai does not need either.

## Previous attempt, for the record

| Role | Latin | Arabic |
|---|---|---|
| Display | Montserrat, 700–800 | Amiri, 700 |
| Body | Montserrat, 400–500 | Amiri, 400 |

Amiri is a Naskh revival based on the Bulaq Press type of 1905, the face
Arabic academic and literary publishing actually uses. For a product whose
Arabic content is course material for architecture students, that register —
it looks like something you study from, not something you subscribe to — is
still worth having. If it comes back: add `Amiri:wght@400;700` to the Google
Fonts `href` in `app/[locale]/layout.tsx` in the **same commit** as the CSS
change, and check an Arabic page in the browser before calling it done. A
`[lang="ar"]` rule with no visible effect in English is exactly the kind of
change nothing else here will catch.

## Older stack, before that

| Role | Latin | Arabic |
|---|---|---|
| Display | Google Sans Flex (never obtained), fell back to Montserrat | Changa |
| Body | Montserrat | Almarai |

Google Sans Flex was named in `_AI_CONTEXT/12_DESIGN.md` and never used: it is
not served by the Google Fonts CSS API under that name, so the display role
fell back to Montserrat from the first commit. Montserrat at 800 with tight
tracking carries display adequately, so it is now the deliberate choice rather
than an accident.

## Open

Fonts are loaded from the Google Fonts CDN. **Self-hosting is a Phase 6 task**
and it is not cosmetic: two round trips to a third-party CDN is measurable on
3G, which is the performance budget.
