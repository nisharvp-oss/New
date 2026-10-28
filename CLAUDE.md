# CLAUDE.md — WanderSync

Guide for Claude (or any coding agent) working on this repository. Also read `AGENTS.md`; its rules win if the two disagree.

## What this is
WanderSync is a multi-tenant group-travel SaaS:
- **Super admins** set subscription plans, pricing, trial length, free-trip limits, unlock price, platform SMTP, PayPal/Stripe account details, and manage other admins.
- **Travel companies** (subscription + trial) have owners, organisers and caretakers; they run trips and set their *own* payment details.
- **Individual organisers** get a personal space (`companies.kind = 'personal'`): free up to N travelers per trip ("Free Zone"), then a one-time unlock fee per trip up to a cap ("Pay as you go", admin marks paid).
- **Pricing** (landing page, built by `src/lib/pricing.ts`, tested): Free Zone and Pay as you go come from `platform_settings` (`free_trip_travelers`, `trip_unlock_price`, `trip_unlock_max_travelers`); company plans come from `plans` (trip limits are per year; `ad_free` hides sponsors via `trip_shows_sponsors`; `contact_sales` shows "Contact us" to `sales_email`). Public copy says "Sign up free, no credit card needed", never "free trial".
- **Travelers** see schedules, tickets (QR), documents/boarding passes, expenses, announcements, SOS.
- **Sponsors / local businesses** appear on free trips only; premium first, then by distance. Sponsors manage their listing at `/sponsor` (matched by contact email).

**Hard business rule:** the platform never processes trip payments. Only platform money (subscriptions, trip unlocks, sponsor fees) belongs to the platform.

## Stack
- TanStack Start v1 (React 19, Vite 7), file routes in `src/routes` (never edit `src/routeTree.gen.ts`). No react-router.
- Tailwind v4 via `src/styles.css` semantic tokens; shadcn/ui in `src/components/ui`. No hard-coded colors.
- Backend: Lovable Cloud (Supabase Postgres + Auth + Storage) with RLS on every table.
- Server logic: `createServerFn` in `src/lib/*.functions.ts`; runs on Cloudflare Workers (no Node-only libs). Signed-out reads use `publicServerClient()` (4 s timeout, no retries) and must fall back to defaults.
- AI: Lovable AI Gateway (`src/lib/ai-itinerary.functions.ts`).
- Tests: Vitest (`bun run test`).

## Layout
- `src/routes/index.tsx` landing + pricing; `auth.tsx`, `reset-password.tsx` public.
- `src/routes/_authenticated/` signed-in only (managed gate in `route.tsx` — don't edit): `dashboard`, `admin`, `company.$companyId`, `trip.$tripId`, `sponsor`.
- `src/routes/demo.tsx`, `traveler.tsx` — browser-only demo using `src/lib/store.ts`.
- `src/components/ws/` feature components (TripOps, TripExpenses, TripSponsors, SponsorMedia, QrScanner, SmtpForm, AdminPaymentsAndAdmins).
- Pure, tested logic: `src/lib/splitwise.ts` (expense splits), `src/lib/my-expenses.ts` ("My expenses": private per-trip spending in `personal_expenses`/`personal_budgets`, migration 0016; never split or shared; totals, budget and a converter in a chosen "show in" currency via `src/lib/fx.ts` + `useRates()` in `fx-rates.ts`: free keyless daily rates from fawazahmed0/currency-api on jsDelivr, mirror on pages.dev, cached on the device for offline use), `src/lib/subscription.ts` (mirrors DB `company_is_writable`), `src/lib/geo.ts` (sponsor sorting/distance), `src/lib/airlines.ts` (airline check-in pages, search, flight-number matching), `src/lib/maps.ts` (open a location in the user's own maps app: Google/Apple/Waze links, Android `geo:` chooser).
- Tools (`/tools`, public): free tools that only link out to official sites or the user's own apps, never paid third-party APIs. Airlines live in the `airlines` table (migration 0013, public read, super-admin writes; managed in Admin → Airlines) and are read with `useAirlines()`; `AIRLINES` in `src/lib/airlines.ts` is the bundled fallback and the seed. Unknown airlines fall back to a web search. Translator (`src/lib/translate.ts`, `Translator.tsx`): Chrome's on-device Translator API where available, otherwise a prefilled Google Translate link, plus an offline phrasebook (have native speakers review it). Sponsored offers per destination country (`src/lib/sponsor-offers.ts`, `SponsorOffers.tsx`, `AdminSponsorOffers.tsx`): eSIM providers (`esim_offers`, 0014) and visa agencies (`visa_agencies`, 0015); empty `countries` = worldwide, flyers in `site-media` under `esim/`/`visa/`, clicks counted by `record_*_click`, links use `rel="sponsored"`. Visa (`src/lib/visa.ts`, `VisaFinder.tsx`, Admin → Visa): destination + passport → the destination's official visa page from `visa_pages` (0015; `VISA_PAGES` is the fallback and seed), the EU page for Schengen countries, else a web search. Compass (`src/lib/compass.ts`, `Compass.tsx`): device orientation sensor, saved spot in localStorage. Each tool has an SVG illustration in `ToolArt.tsx`. Countries and flags come from `src/lib/countries.ts` (`guessCountry` suggests one from free-text destinations). Trips have an optional `destination_country` (migration 0017, set in New trip or the trip's "Visa & eSIM" tab, `TripEssentials.tsx`): that tab shows the official visa page always, and visa agencies and eSIM offers only where `trip_shows_sponsors` is true.
- Migrations: `drizzle/migrations/*.sql` (plain SQL, applied by tooling). Generated DB types: `src/integrations/supabase/types.ts` (don't hand-edit).

## Design system & app shell
- Mobile-first, installable app (PWA manifest in `public/manifest.webmanifest`, safe-area insets via `pt-safe`/`pb-safe`/`pb-tabbar`).
- Look: clean white surfaces, one confident blue (`primary`), ink (`navy`) for dark panels, amber (`sunset`) only for ratings. Real photography carries the mood; photo headers use an image plus a dark gradient.
- Type: Plus Jakarta Sans throughout; tight negative tracking on large headings.
- Signed-in screens get a bottom tab bar on phones (`MobileTabBar` in `src/components/ws/AppHeader.tsx`); `/` and `/auth` draw their own chrome.
- Site photos: super admins replace them in Admin → Site images. Slots and bundled fallbacks live in `src/lib/site-images.ts` (pure, tested); rows in `site_images` + public `site-media` bucket (migration 0011); read with `useSiteImages()` (preloaded by the root loader). Add a slot there before using a new marketing/app photo.
- Landing (`src/components/landing/`): `Sections.tsx` holds the sections, `Phone.tsx` the phone frame and app screens, `motion.ts` the scroll engine (Lenis + GSAP ScrollTrigger, loaded client-side only). Animate through data attributes (`data-reveal`, `data-reveal-group`, `data-parallax`, `data-hscroll`/`data-track`, `data-expand`, `data-count`). The feature route (`journey.ts`) connects `data-stop-d` phones (desktop) or `data-stop-m` rows (mobile) inside `[data-journey]`, with one vehicle and scene per leg in `JOURNEY_LEGS` (illustrations in `JourneyArt.tsx`, animated by `.art-*` classes in `styles.css`; full scenes beside the route on wide screens, `Mini*` versions riding behind the vehicle on the narrow timeline; both only while their leg is travelling); everything must still read correctly with `prefers-reduced-motion`.

## Security conventions
- Roles live in `user_roles` + `has_role()`; never on profiles. First user ever becomes super admin (`handle_new_user`).
- Admin-only writes go through `SECURITY DEFINER` RPCs that check `has_role` (e.g. `admin_set_trip_unlock`, `admin_set_sponsor_premium`, `grant_super_admin`) or guard triggers (billing columns, `unlocked`, `is_premium`).
- Secrets (SMTP passwords, PayPal/Stripe secret keys) live in service-role-only tables (`smtp_secrets`, `payment_secrets`), accessed only from server functions after a role check.
- Every new public table: GRANTs + RLS + policies in the same migration.
- Storage: `trip-docs` (private, trip staff/owner traveler), `sponsor-media` (private, signed URLs; uploads under `{userId}/`) and `receipts` (private, JPEG ≤ 64 KB; `{tripId}/shared/` for split expenses, `{tripId}/{userId}/` for personal ones). Receipt photos are shrunk to 50 KB on the device (`prepareReceipt` in `src/lib/image-upload.ts`).

## Working rules
- Keep business math in pure modules with tests; change `subscription.ts` and `company_is_writable` together.
- Each route needs its own `head()` metadata.
- Run `bun run test` after changing tested logic.
- Don't rewrite pushed git history (project syncs with Lovable).

## Not built yet
Card checkout for unlocks/sponsor fees/subscriptions (PayPal/Stripe keys are stored but unused), public trip pages with discounts/referral links, reports and reviews.
