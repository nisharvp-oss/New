# CLAUDE.md — WanderSync

Guide for Claude (or any coding agent) working on this repository. Also read `AGENTS.md`; its rules win if the two disagree.

## What this is
WanderSync is a multi-tenant group-travel SaaS:
- **Super admins** set subscription plans, pricing, trial length, free-trip limits, unlock price, platform SMTP, PayPal/Stripe account details, and manage other admins.
- **Travel companies** (subscription + trial) have owners, organisers and caretakers; they run trips and set their *own* payment details.
- **Individual organisers** get a personal space (`companies.kind = 'personal'`): free up to N travelers per trip, then a one-time unlock fee (admin marks paid).
- **Travelers** see schedules, tickets (QR), documents/boarding passes, expenses, announcements, SOS.
- **Sponsors / local businesses** appear on free trips only; premium first, then by distance. Sponsors manage their listing at `/sponsor` (matched by contact email).

**Hard business rule:** the platform never processes trip payments. Only platform money (subscriptions, trip unlocks, sponsor fees) belongs to the platform.

## Stack
- TanStack Start v1 (React 19, Vite 7), file routes in `src/routes` (never edit `src/routeTree.gen.ts`). No react-router.
- Tailwind v4 via `src/styles.css` semantic tokens; shadcn/ui in `src/components/ui`. No hard-coded colors.
- Backend: Lovable Cloud (Supabase Postgres + Auth + Storage) with RLS on every table.
- Server logic: `createServerFn` in `src/lib/*.functions.ts`; runs on Cloudflare Workers (no Node-only libs).
- AI: Lovable AI Gateway (`src/lib/ai-itinerary.functions.ts`).
- Tests: Vitest (`bun run test`).

## Layout
- `src/routes/index.tsx` landing + pricing; `auth.tsx`, `reset-password.tsx` public.
- `src/routes/_authenticated/` signed-in only (managed gate in `route.tsx` — don't edit): `dashboard`, `admin`, `company.$companyId`, `trip.$tripId`, `sponsor`.
- `src/routes/demo.tsx`, `traveler.tsx` — browser-only demo using `src/lib/store.ts`.
- `src/components/ws/` feature components (TripOps, TripExpenses, TripSponsors, SponsorMedia, QrScanner, SmtpForm, AdminPaymentsAndAdmins).
- Pure, tested logic: `src/lib/splitwise.ts` (expense splits), `src/lib/subscription.ts` (mirrors DB `company_is_writable`), `src/lib/geo.ts` (sponsor sorting/distance).
- Migrations: `drizzle/migrations/*.sql` (plain SQL, applied by tooling). Generated DB types: `src/integrations/supabase/types.ts` (don't hand-edit).

## Design system & app shell
- Mobile-first, installable app (PWA manifest in `public/manifest.webmanifest`, safe-area insets via `pt-safe`/`pb-safe`/`pb-tabbar`).
- Look: clean white surfaces, one confident blue (`primary`), ink (`navy`) for dark panels, amber (`sunset`) only for ratings. Real photography carries the mood; photo headers use an image plus a dark gradient.
- Type: Plus Jakarta Sans throughout; tight negative tracking on large headings.
- Signed-in screens get a bottom tab bar on phones (`MobileTabBar` in `src/components/ws/AppHeader.tsx`); `/` and `/auth` draw their own chrome.
- Landing (`src/components/landing/`): `Sections.tsx` holds the sections, `Phone.tsx` the phone frame and app screens, `motion.ts` the scroll engine (Lenis + GSAP ScrollTrigger, loaded client-side only). Animate through data attributes (`data-reveal`, `data-reveal-group`, `data-parallax`, `data-hscroll`/`data-track`, `data-expand`, `data-count`); everything must still read correctly with `prefers-reduced-motion`.

## Security conventions
- Roles live in `user_roles` + `has_role()`; never on profiles. First user ever becomes super admin (`handle_new_user`).
- Admin-only writes go through `SECURITY DEFINER` RPCs that check `has_role` (e.g. `admin_set_trip_unlock`, `admin_set_sponsor_premium`, `grant_super_admin`) or guard triggers (billing columns, `unlocked`, `is_premium`).
- Secrets (SMTP passwords, PayPal/Stripe secret keys) live in service-role-only tables (`smtp_secrets`, `payment_secrets`), accessed only from server functions after a role check.
- Every new public table: GRANTs + RLS + policies in the same migration.
- Storage: `trip-docs` (private, trip staff/owner traveler) and `sponsor-media` (private, signed URLs; uploads under `{userId}/`).

## Working rules
- Keep business math in pure modules with tests; change `subscription.ts` and `company_is_writable` together.
- Each route needs its own `head()` metadata.
- Run `bun run test` after changing tested logic.
- Don't rewrite pushed git history (project syncs with Lovable).

## Not built yet
Card checkout for unlocks/sponsor fees/subscriptions (PayPal/Stripe keys are stored but unused), public trip pages with discounts/referral links, reports and reviews.
