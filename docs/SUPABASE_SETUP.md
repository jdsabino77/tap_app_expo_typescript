# Supabase setup (Phase 5)

## Team dev project (optional reference)

For integration testing you can use the shared dashboard: [Supabase project `pexgbpnsuavlaejwgxnx`](https://supabase.com/dashboard/project/pexgbpnsuavlaejwgxnx). API host pattern: `https://pexgbpnsuavlaejwgxnx.supabase.co` — paste **URL** and **anon key** into `app.config.js` / `supabase.local.json` / env as usual (**never commit** service role keys or user passwords).

---

1. Create a project at [supabase.com](https://supabase.com) (or use the team project above).
2. **SQL:** In the SQL Editor, run the script in [`supabase/migrations/001_phase5_core.sql`](../supabase/migrations/001_phase5_core.sql) (creates `profiles`, `medical_profiles`, `treatments`, `providers`, RLS, and the `auth.users` → `profiles` trigger).
3. **Reference catalogs:** Run [`supabase/migrations/002_reference_catalogs.sql`](../supabase/migrations/002_reference_catalogs.sql) (creates `laser_types`, `service_types`, `treatment_areas`, `provider_service_catalog`, RLS, and starter seed rows). The app shows **suggestion chips** on treatment and provider forms; signed-in users can **read** active rows. **Writes** require `profiles.is_admin = true` (or use the service role in SQL).
4. **Auth:** Authentication → Providers → enable **Email** (disable email confirmation for faster dev if you want instant sessions).
5. **Env:** Copy [`.env.example`](../.env.example) to `.env` at the repo root, set `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`, then restart `npx expo start` with a clean cache if needed.

The app uses **Expo SecureStore** (native) / `localStorage` (web) for the Supabase session.

If env vars are **missing**, the app stays in **stub auth** mode (dev buttons on login).
