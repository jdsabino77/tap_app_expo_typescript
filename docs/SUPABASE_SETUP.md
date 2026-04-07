# Supabase setup (Phase 5)

1. Create a project at [supabase.com](https://supabase.com).
2. **SQL:** In the SQL Editor, run the script in [`supabase/migrations/001_phase5_core.sql`](../supabase/migrations/001_phase5_core.sql) (creates `profiles`, `medical_profiles`, `treatments`, `providers`, RLS, and the `auth.users` → `profiles` trigger).
3. **Auth:** Authentication → Providers → enable **Email** (disable email confirmation for faster dev if you want instant sessions).
4. **Env:** Copy [`.env.example`](../.env.example) to `.env` at the repo root, set `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`, then restart `npx expo start` with a clean cache if needed.

The app uses **Expo SecureStore** (native) / `localStorage` (web) for the Supabase session.

If env vars are **missing**, the app stays in **stub auth** mode (dev buttons on login).
