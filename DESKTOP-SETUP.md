# Working on WanderSync from your own computer

The code lives on GitHub in `nisharvp-oss/New`, branch `claude/nice-lovelace-rizmmf` (pull request #1). The backup ZIP from Claude has the same code (with full history) plus a copy of the database.

## 1. Get the code

Easiest, from GitHub:

```bash
git clone https://github.com/nisharvp-oss/New.git WanderSync
cd WanderSync
git checkout claude/nice-lovelace-rizmmf
```

Or from the backup ZIP, with no GitHub needed:

```bash
git clone WanderSync.bundle WanderSync
cd WanderSync
git checkout claude/nice-lovelace-rizmmf
git remote set-url origin https://github.com/nisharvp-oss/New.git   # so you can push later
```

## 2. Install and run

You need [Bun](https://bun.sh) (or Node 20+ with npm).

```bash
bun install
bun run test      # all tests should pass
bun run dev       # then open the local address it prints (e.g. http://localhost:8080)
```

## 3. Connect the database

Create a file called `.env` in the project folder (it is git-ignored, never commit it):

```
VITE_SUPABASE_URL=https://zeegfjwhqyaqsjcrbczg.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<publishable key>
SUPABASE_URL=https://zeegfjwhqyaqsjcrbczg.supabase.co
SUPABASE_PUBLISHABLE_KEY=<publishable key>
SUPABASE_SERVICE_ROLE_KEY=<service role key>   # server only: admin email/payment settings
LOVABLE_API_KEY=<key>                          # only for the AI itinerary feature
```

Copy the keys from Lovable (Cloud → settings) or, if you move to your own Supabase project, from Supabase → Project Settings → API. Treat the service role key like a password.

Without the keys, the public pages (landing, pricing, Tools) still open with their built-in defaults, but you can't sign in.

## 4. Database changes the app needs

The live Lovable database has migrations `0000`–`0010`. This version of the app also needs these, in order:

| Migration | Adds |
| --- | --- |
| `0011_site_images` | Admin → Site images |
| `0012_pricing_tiers` | Free Zone / Pay as you go / Organiser / Business / Enterprise pricing |
| `0013_airlines` | Admin → Airlines, flight check-in |
| `0014_esim_offers` | eSIM sponsors |
| `0015_visa` | Official visa pages + visa agency sponsors |
| `0016_my_expenses_receipts` | My expenses, budgets, receipt photos |
| `0017_trip_destination_country` | Trip country for the Visa & eSIM tab |

The SQL files are in `drizzle/migrations/`. Paste each one into the Supabase SQL editor (or the Lovable database screen) and run it, in number order. They were all tested together on PostgreSQL 16.

## 5. Restoring the database somewhere new (only if you leave Lovable Cloud)

1. Take Lovable's full export (More → Database → Manage → Settings → Export data). It is the only copy that includes sign-in accounts and password hashes.
2. Restore that export into your new Supabase project.
3. Run any migrations from step 4 that it doesn't have yet.
4. Uploaded files (documents, sponsor media, receipts) are not in any database export: download them from Lovable → Storage and upload them to the same bucket names.

The backup ZIP also has `database/data.json` (every table's rows as of the backup) and `database/restore-data.sql`, which reloads those rows into a database that already has the schema and the sign-in accounts. Running it twice is harmless.

## 6. Using Claude Code on your computer

Open a terminal in the project folder and run `claude`. It reads `CLAUDE.md` and `AGENTS.md` automatically, so it knows the stack, the rules (for example: never edit `src/routeTree.gen.ts` or the generated database types, and never rewrite pushed git history) and where everything lives.
