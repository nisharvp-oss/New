<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Platform data (companies, members, plans, trips, settings) lives in Lovable Cloud with RLS; the /demo and /traveler pages still run on the persisted client store (src/lib/store.ts) until trip features move to the database.
- Expense split and debt-simplification math lives in src/lib/splitwise.ts, kept pure and covered by tests.
- Subscription rules live in src/lib/subscription.ts (pure, tested) and mirror the database function company_is_writable; change both together.
- Billing columns on companies are protected by a trigger so only super admins change status/plan/trial/paid_until.
- SMTP passwords live in smtp_secrets (service-role only); read/write only via src/lib/smtp.functions.ts after a role check. Mail is sent with the minimal client in src/lib/smtp.server.ts because Node mail libraries don't run on the worker runtime.
- First account ever created becomes super admin (handle_new_user trigger).
- Individual organisers own a companies row with kind='personal' (created by get_personal_space); free-trip traveler cap and unlock price live in platform_settings and are enforced in enforce_traveler_limit. Why: reuse all company/trip RLS instead of a parallel model.
- Sponsor ordering/distance math lives in src/lib/geo.ts (pure, tested); local business search uses OpenStreetMap Nominatim from the browser (no key).
