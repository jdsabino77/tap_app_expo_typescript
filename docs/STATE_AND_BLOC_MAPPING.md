# State management: Flutter Bloc → Expo app

**Decision (Phase 2):** Use **lightweight app state** (session / UI flags) plus **repository-driven data** in feature hooks. Do **not** introduce Redux or a global Bloc layer for the first vertical slices.

## Flutter today

- `flutter_bloc` + `equatable` are in `pubspec.yaml`, but **feature screens mostly use `StatefulWidget`** and call `*Service` classes directly from widgets (e.g. `LoginPage` → `AuthService`, `MedicalProfileService`).
- There is **no pervasive Bloc layer** in the inventoried `lib/` tree; migration cost is mostly **service → repository** rewiring, not Bloc-to-Bloc mapping.

## Target mapping

| Flutter pattern | Expo / TypeScript target |
|-----------------|---------------------------|
| `AuthService` in widget | `useAuth()` (or similar) wrapping **auth repository** + Supabase session |
| `TreatmentService` / `ProviderService` / … | Feature hooks: `useTreatments()`, `useProviders()` calling **repositories** |
| `PreferencesService` (Hive) | Local preferences repository: **SQLite + SecureStore** per [MIGRATION_PLAN.md](./MIGRATION_PLAN.md) |
| `ContentService` (reference data) | Cached reads: repository fetches Supabase → writes SQLite → UI reads cache first |
| Theme (`ThemeMode.system` in `MaterialApp`) | React context or Expo-compatible theme provider; persist mode in `profiles` or local prefs when SETTINGS_FEATURES ships |

## Optional later

- **Zustand** (or Jotai) for cross-cutting UI state if prop drilling becomes painful.
- **TanStack Query** for server cache + invalidation once Supabase APIs stabilize.

## Rule

Screens and route components **do not** import `@supabase/supabase-js` directly; they use hooks that call **repositories** only.
