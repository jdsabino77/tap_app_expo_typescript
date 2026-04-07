# T.A.P — Expo (TypeScript)

React Native rebuild of **T.A.P by YasaLaser** (Treatment & Aesthetic Procedures), migrated from the Flutter app at `../tap_app`.

## Migration docs

- **[docs/MIGRATION_PLAN.md](docs/MIGRATION_PLAN.md)** — phased checklist, dependency mapping, and working order (one item at a time).
- **[docs/FLUTTER_INVENTORY.md](docs/FLUTTER_INVENTORY.md)** — snapshot of the source Flutter layout and screens.
- **[docs/SUPABASE_SCHEMA.md](docs/SUPABASE_SCHEMA.md)** — Postgres tables and RLS sketch (from Firestore).
- **[docs/STATE_AND_BLOC_MAPPING.md](docs/STATE_AND_BLOC_MAPPING.md)** — Flutter services → hooks + repositories.
- **[docs/EXPO_ROUTES.md](docs/EXPO_ROUTES.md)** — Flutter screens → Expo Router paths.
- **[docs/SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md)** — env vars + SQL migration for Phase 5.
- **[docs/SCREEN_PARITY.md](docs/SCREEN_PARITY.md)** — Flutter vs Expo behavioral notes.
- **[docs/SETTINGS_FEATURES.md](docs/SETTINGS_FEATURES.md)** — settings and preferences roadmap (copied from `tap_app` for product scope).

## Run the app (Phase 3+)

```bash
npm start
```

Uses **Expo SDK 52** and **`expo-router`**. Optional **Supabase:** copy [`.env.example`](.env.example) → `.env` and follow [docs/SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md). Without env vars, **stub auth** buttons appear on the login screen.

## Domain code (Phase 2+)

- **`src/domain/`** — Zod schemas and types: medical profile, provider, treatment, app user, reference catalogs.
- **`src/lib/`** — dates (`date-fns`), numbers (`Intl`), `newUuid()`, `newSecureUuid()` (`expo-crypto`), Supabase-oriented error mappers, age helper.
- **`src/hooks/`** — e.g. `useNetworkStatus` (NetInfo) for online-first UX.
- **`src/theme/`** — `tokens.ts` (colors) + `theme.ts` (typography, spacing, radii, light/dark component tokens from Flutter `AppTheme`).

```bash
npm test        # Vitest
npm run typecheck
```

## Principles

Work in **small, verifiable steps**: finish one phase (or one screen) before starting the next, and keep the app runnable on simulator/device after each merge.

## Source project

Flutter repo: `/Users/Jamie.Sabino/development/tap_app` (v1.0.1+4 per `pubspec.yaml`).
