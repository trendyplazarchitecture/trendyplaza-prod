# Repository map and status

TP Architecture platform. One Next.js application, one PostgreSQL database,
two products sharing an admin: a cash-on-delivery **store** and a
gift-card-or-receipt **LMS**.

Status as of **10 August 2026**. Framework: Next.js 16.3.0 App Router,
next-intl 4, Drizzle ORM, Better Auth, PostgreSQL 16, Tailwind v4, shadcn/ui.

**Languages: English, Arabic, French**, in that order of priority. English is
the default locale and the authoring language for both UI strings and database
content.

---

## Overall progress: the week-one launch set is built

Both products run end to end. A visitor can fill a cart, place a cash-on-
delivery order and track it; a student can redeem a printed card or send a
Baridimob receipt, and read their modules through an entitlement-checked
streaming route; an admin can work the order queue, load content, issue cards,
review receipts and edit the team's permissions.

What remains is the test suite, a CI workflow, and deployment.

| Phase | Scope | State | Share of the launch set |
|---|---|---|---|
| P0 | Baseline, deps, Docker, env | **Done** | 5% |
| P1 | Schema and migration | **Done** | 15% |
| P1b | Seed, template content, credentials | **Done** | 8% |
| P2 | Auth and permissions | **Done** | 7% |
| P3 | Server modules and core logic | **Done** | 10% |
| P3b | English locale, schema and catalogues | **Done** | added scope |
| P4 | Storefront, cart, checkout, tracking | **Done** | 15% |
| P5 | Admin dashboard | **Done** | 25% |
| P5b | Account, on-hold, redemption | **Done** | added scope |
| P6 | LMS library, viewer, streaming route | **Done** | 12% |
| P7 | Tests and CI gates | **Partial** | 2% of 5% |

The gap is P7 and it is the one that decides whether the next refactor is safe:
11 of the 13 cases in `08_TESTING.md` are unwritten, and no CI workflow runs
the gates that do exist.

---

## What was built this session

**Framework upgrade.** Next 15.5.23 → 16.3.0 and next-intl 3 → 4. Not
cosmetic: `npm audit` flagged vulnerable `postcss` and `sharp` reachable
through Next 15, and a clean audit is a blocking CI gate. `middleware.ts`
became `proxy.ts`, which is the name Next 16 actually runs. Production
dependencies now audit clean.

**Schema.** 37 tables covering geography, catalogue, orders, LMS content,
packages, codes, entitlements, access requests, identity, audit and
engagement. Soft delete on every content and catalogue table. 42 foreign keys
with `onDelete: restrict` and zero cascades touching content, orders, codes or
entitlements. Money is `integer` DZD centimes throughout. Every timestamp
carries a time zone. Every prose column exists in all three languages.

**Seed.** 69 wilayas, 148 communes, per-wilaya shipping with higher Sahara
rates, a template university with L1 through M2, six products, two LMS
packages, a batch of ten printable codes, one pending order, and five accounts
covering every role including a student on hold and a student with access.

**Auth.** Better Auth on email and password, verified end to end against the
running server. Fifteen granular permissions with four presets. Guards live in
`src/server/session.ts`, and every protected surface will call one itself.

**Core logic.** Nine server modules. Redemption, stock decrement and promo
usage all use conditional `UPDATE` statements rather than read-then-write.
Entitlement expiry is computed at read time, so no cron job can fail open.

**Tests.** Six passing against a scratch database, including eight concurrent
redemptions of one code producing exactly one entitlement.

**English added as the primary locale.** Order is now English, Arabic, French,
with English the default. English is also the authoring language, so every
prose column gained an `_en` sibling and `_en` is the column that is NOT NULL;
the other two are optional and fall back at read time. Migration 0001 adds each
column nullable, backfills from French, then constrains, so it is safe against
a table that already holds rows.

Wilayas and communes deliberately stayed at two columns. A place has one Latin
spelling and one Arabic spelling, and an English reader falls through to the
Latin form rather than waiting for someone to retype 69 identical names.

**Copy externalised.** The storefront had 2,558 lines of hard-coded French and
no component used next-intl at all; the message files existed and were never
read. There are now 202 keys in each of three catalogues, a language switcher
that preserves the current path, and a blocking parity script.

**Gift cards corrected.** They are not a shop item. Cards are printed and
placed inside the packs that include LMS access, so the standalone product is
gone, the store has zero `lms_access` products, and the two calls to action
that pointed at a gift card rayon now point at the packs and the course
library.

**Storefront on real data.** Landing, catalogue and product pages read the
database. Added the product category the nav had always linked to but the
schema never had.

---

## What was deliberately not built

- **Checkout, admin and the LMS.** The next three phases, in that order.
- **Google sign-in.** Blocked on the domain purchase, open item O1. The code
  path exists and switches on when the two environment variables are filled.
- **Week-two features**: promo code admin, tag search, bookmarks, study plans,
  announcements, testimonials CMS, contact inbox, charts, courier API, 2FA.
  Named and scheduled in `_AI_CONTEXT/11_BUILD_ORDER.md`, not silently dropped.

---

## Structure

Generated files, `node_modules`, `.next` and build output are omitted.

```
Platform/
├── CLAUDE.md                     Project rules and invariants, always loaded
├── AGENTS.md                     Agent notes (Next.js appends its own block)
├── EXECUTION_PLAN.md             Phase plan with paste-ready prompts
├── README.md
│
├── _AI_CONTEXT/                  The decision pack. Read before changing anything.
│   ├── 00_INDEX.md               Map, scope, conflicts already decided
│   ├── 01_RULES.md               Conventions, anti-patterns, copy rules
│   ├── 02_DOMAIN.md              Glossary, the two flows, business rules
│   ├── 03_ARCHITECTURE.md        Route groups, boundaries, permissions
│   ├── 04_DATA.md                Full schema, deletion policy, race conditions
│   ├── 05_SECURITY.md            Threat model, authorisation, streaming
│   ├── 06_PERFORMANCE.md         Budgets, images, PDF streaming
│   ├── 07_INTEGRATIONS.md        YouTube, couriers, datasets, fonts
│   ├── 08_TESTING.md             The 13 must-have tests, definition of done
│   ├── 09_RESEARCH.md            Verified findings and sources
│   ├── 10_GOTCHAS.md             Platform traps that each cost someone a day
│   ├── 11_BUILD_ORDER.md         What to write first, pre-authorised cuts
│   ├── 12_DESIGN.md              Tokens, type, page shapes
│   ├── ANSWERS.md                The client's answer sheet, canonical
│   └── PROOF.md                  Every verified claim and its source
│
├── _BUILD/                       This build's working notes
│   ├── PLAN.md                   Order of work, decisions taken, cuts
│   ├── PROGRESS.md               Checklist, one line per item
│   └── CREDENTIALS.md            Test logins (git-ignored)
│
├── docs/
│   └── REPO_MAP.md               This file
│
├── app/                          Next.js App Router
│   ├── api/
│   │   ├── auth/[...all]/route.ts        Better Auth handler
│   │   ├── admin/…                       CSV export, batch export, receipts
│   │   ├── health/route.ts               select 1. Docker and Caddy read it.
│   │   ├── media/[...path]/route.ts      Public buckets only: products, avatars
│   │   └── resource/[id]/route.ts        Entitlement-checked file stream
│   └── [locale]/
│       ├── layout.tsx                    lang + dir, hreflang, fonts, provider
│       ├── (store)/                      Public. No session. Cash on delivery.
│       │   ├── page.tsx                  Landing, reads products + testimonials
│       │   ├── catalogue/page.tsx        Reads products, filters by category
│       │   ├── products/[slug]/page.tsx  Reads one product + structured data
│       │   ├── checkout/page.tsx         Checkout, reads the cart cookie
│       │   ├── order-confirmed/page.tsx  Confirmation, reference from a cookie
│       │   ├── track-order/page.tsx      Guest lookup, reference plus phone
│       │   └── about/page.tsx            Renamed from /a-propos, redesigned
│       ├── (account)/                    Session only. No chrome at all.
│       │   └── login · signup · set-password
│       ├── (portal)/                     Session only. The student shell.
│       │   ├── layout.tsx                Sidebar, search, avatar, Toaster
│       │   └── account/
│       │       ├── page.tsx              Dashboard: figures, carry on, ways in
│       │       ├── progress/page.tsx     Every module opened, in full
│       │       └── profile/page.tsx      Picture, name, what the account holds
│       ├── (lms)/
│       │   ├── courses/page.tsx          Public presentation, reads the tree
│       │   └── library/
│       │       ├── page.tsx              Universities the student can open
│       │       └── [slug]/[moduleId]/    The tree, then the module reader
│       └── (admin)/admin/
│           ├── page.tsx · orders/[id] · products · content · codes
│           ├── requests · students · activity
│           └── team/page.tsx             Permission editor
│
├── src/
│   ├── components/portal/        The student shell: nav, search, avatar, cards
│   ├── db/
│   │   ├── index.ts              The app's connection singleton, server-only
│   │   ├── client.ts             createDb() for scripts and tests
│   │   ├── schema/
│   │   │   ├── index.ts          Barrel
│   │   │   ├── _shared.ts        tsz(), archivedAt(), RESTRICT
│   │   │   ├── enums.ts          15 pg enums
│   │   │   ├── geo.ts            wilayas, communes, shipping_rates
│   │   │   ├── identity.ts       Better Auth tables, profiles, permissions, log
│   │   │   ├── content.ts        university → year → semester → module → resource
│   │   │   ├── catalogue.ts      products, images, promos, orders, order_items
│   │   │   ├── access.ts         batches, codes, requests, entitlements
│   │   │   └── engagement.ts     bookmarks, plans, announcements, testimonials
│   │   └── seed/
│   │       ├── index.ts          Runner: truncate, seed, print credentials
│   │       ├── content.ts        Curriculum and sample resources
│   │       └── catalogue.ts      Products, packages, shipping rates
│   │
│   ├── server/                   The only code that touches the database
│   │   ├── auth.ts               Better Auth instance
│   │   ├── cms.ts                Testimonials, client-managed marketing rows
│   │   ├── session.ts            requireUser / requirePermission, per-request cache
│   │   ├── geo.ts                Wilayas, communes, authoritative shipping cost
│   │   ├── catalogue.ts          Products, cart resolution, packages
│   │   ├── cart.ts               The cart cookie, and the last-order cookie
│   │   ├── content.ts            Student-facing tree, module reads, stats
│   │   ├── library.ts            What THIS student can open, and the marked tree
│   │   ├── orders.ts             Checkout, confirm with stock guard, cancel, lookup
│   │   ├── codes.ts              Batch generation, atomic redemption, void
│   │   ├── entitlements.ts       Scope resolution, expiry at read time, pause
│   │   ├── access-requests.ts    Receipt submission, approve, reject
│   │   ├── team.ts               Staff list, permission set replacement
│   │   ├── rate-limit.ts         Fixed window, in process memory
│   │   ├── storage.ts            Magic-byte checks, WebP, ranged reads
│   │   ├── activity.ts           Audit log writer
│   │   └── actions/              "use server" entry points, one per surface
│   │
│   ├── lib/
│   │   ├── codes.ts              Alphabet, normalisation, batch generation
│   │   ├── media.ts              Product image URLs, seed vs uploaded
│   │   ├── phone.ts              Algerian mobile normalisation
│   │   ├── money.ts              DZD centimes, formatting, discounts
│   │   ├── permissions.ts        15 permissions, 4 presets, UI grouping
│   │   ├── i18n-content.ts       EN/AR/FR pick with a fallback chain
│   │   ├── auth-client.ts        Better Auth React client
│   │   ├── motion.ts             Shared framer-motion variants
│   │   └── utils.ts              cn()
│   │
│   ├── components/
│   │   ├── site/                 Storefront components, currently on mock data
│   │   │   ├── SiteLayout.tsx · SiteHeader.tsx · SiteFooter.tsx
│   │   │   ├── Hero.tsx · Categories.tsx · Products.tsx · ProductCard.tsx
│   │   │   ├── About.tsx · Reviews.tsx · CtaCard.tsx · Faq.tsx · LmsCta.tsx
│   │   │   ├── AnnouncementBar.tsx · LanguageSwitcher.tsx
│   │   │   ├── CatalogueClient.tsx · ProductDetailClient.tsx
│   │   │   ├── CommanderClient.tsx · CoursClient.tsx   still French-only
│   │   └── ui/                   shadcn/ui primitives, 45 files, unmodified
│   │
│   ├── data/                     Source for the seed, not read at runtime
│   │   ├── wilayas.ts            69 wilayas, 148 communes
│   │   └── catalog.ts            Legacy mock products, only CoursClient reads it
│   │
│   ├── hooks/use-mobile.tsx
│   ├── assets/                   Product and hero imagery
│   └── styles.css                Tailwind v4, OKLCH tokens in @theme inline
│
├── i18n/
│   ├── routing.ts                en, ar, fr. en default, no auto-detection
│   ├── request.ts                Message loading per locale
│   └── navigation.ts             Locale-aware Link and redirect
│
├── messages/                     UI chrome only. Content lives in the database.
│   ├── en.json                   202 keys, the reference catalogue
│   ├── ar.json
│   └── fr.json
│
├── drizzle/
│   ├── 0000_init.sql             Initial migration, 37 tables
│   ├── 0001_add_english_locale.sql   _en columns, backfilled then constrained
│   ├── 0002_add_product_category.sql
│   └── meta/
│
├── tests/
│   ├── setup.ts                  Forces DATABASE_URL to the test database
│   ├── helpers/db.ts             Migrate, truncate, minimal fixture
│   ├── stubs/server-only.ts
│   └── redemption.test.ts        6 tests, including 8-way concurrency
│
├── scripts/
│   ├── load-env.ts               .env.local then .env, same precedence as Next
│   └── check-messages.ts         Blocking catalogue parity check
│
├── public/
│   ├── products/                 Seed product images (uploads never land here)
│   ├── favicon/ · favicon.ico · Hero-image.webp · robots.txt
│
├── proxy.ts                      Locale routing ONLY. Never authorisation.
├── next.config.ts
├── drizzle.config.ts
├── vitest.config.ts
├── docker-compose.dev.yml        Postgres 16 on 127.0.0.1:5433
├── components.json               shadcn config
├── eslint.config.js · postcss.config.mjs · tsconfig.json
└── .env.example                  Copy to .env.local
```

---

## Running it

```bash
npm install
```

```bash
npm run db:up
```

```bash
npm run db:reset
```

```bash
npm run dev
```

`db:reset` applies migrations, seeds, and prints the test logins and the
current access codes. Full credentials are in `_BUILD/CREDENTIALS.md`.

Other scripts: `npm run typecheck`, `npm test`, `npm run db:studio`,
`npm run db:generate` after a schema change.

---

## Rules that will fail review if broken

From `CLAUDE.md` and `_AI_CONTEXT/01_RULES.md`, restated because they are the
ones easiest to break by accident.

1. Authorisation is checked in the route handler, server action or data layer.
   Never in `proxy.ts`. A session check there is a redirect, not a gate.
2. Never create `middleware.ts`. Next 16 runs `proxy.ts`. Both old paths are
   git-ignored so a generated file cannot slip in and silently protect nothing.
3. Content and catalogue rows are soft-deleted with `archived_at`, never
   removed. An entitlement must never resolve to a missing row.
4. Code redemption is one conditional `UPDATE` inside a transaction. Never a
   `SELECT` followed by an `UPDATE`.
5. `price_at_purchase` is frozen on order items. Never read `products.price_dzd`
   when rendering a past order.
6. Resources stream through an entitlement-checked route. Files live outside
   the web root. Download is off by default, per resource only.
7. Every schema change is a versioned migration committed to the repo.
8. Every user-visible string exists in `en`, `ar` and `fr`. `npm run check:i18n`
   is blocking. Content records must carry `_en`; the other two fall back
   through `pick()` and are never rendered as an empty string.
9. There are 69 wilayas. Read the count from the table, never hard-code it.
10. Codes are pre-generated in batches and printed, never created at order
    approval. `access_codes.order_id` is nullable.
11. Gift cards are not sold. A card is printed and placed inside a pack. The
    store must never list an `lms_access` product.
12. Layout uses logical properties only. Anything directional, including an
    arrow icon or a drawer side, flips with the script.

---

## Next session, in order

1. **The 11 remaining tests in `08_TESTING.md`.** Item 3 first, and assert the
   negative: an L2 grant must not reach an L3 module. Then items 10 and 11, the
   resource route, which was verified by hand this session but not by a test.
2. **A CI workflow.** `typecheck`, `lint`, `check:i18n`, `test`, `npm audit
   --omit=dev`. Stylelint for directional properties is the one gate still
   unwired.
3. **Deployment**, once the domain exists. Caddy, four containers, ufw,
   fail2ban, nightly `pg_dump` offsite, and a restore actually tested.

Smaller, and worth doing when convenient: product specs still have no column;
`/conditions` and `/confidentialite` are linked from the footer and 404; the
admin content page and the receipt route still query Drizzle directly and carry
an ESLint exception saying so.

## Open items still blocking

| # | Item | Owner | Blocks |
|---|---|---|---|
| O1 | Domain purchase | Developer | TLS, Google OAuth redirect, deployment |
| O4 | Real RIP number | Client | The on-hold screen shows the env placeholder |
| O5 | Gift card artwork and batch size | Client | First real code batch |
| O6 | Terms and privacy copy | Client | Two footer links that 404 today |
