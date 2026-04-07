# Flutter project inventory (`tap_app`)

**Phase 1 status:** Complete (2026-04-06). This document is the analysis deliverable for Expo migration. Paths below are relative to `tap_app/lib/` unless noted.

**Target stack (Expo repo):** Supabase (Auth, Postgres, Storage), Expo SQLite cache, SecureStore, repository boundary — see [MIGRATION_PLAN.md](./MIGRATION_PLAN.md). The Flutter app still uses **Firebase + Hive**; Phase 2 maps Firestore shapes and paths into Supabase tables and RLS.

---

## 1. Entry, bootstrap, and app shell

| Step | Implementation |
|------|----------------|
| Binding | `WidgetsFlutterBinding.ensureInitialized()` |
| Error handling | `FlutterError.onError` + `ErrorWidget.builder` suppress **PigeonUserDetails** / `List<Object?>` (Firebase iOS plugin quirk) |
| Local DB | `Hive.initFlutter()` — no adapters registered in `main.dart` |
| Remote | `Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform)` |
| Seed content | `ContentService().initializeDefaultContent()` (Firestore collections for laser/service/treatment reference data) |
| UI root | `MaterialApp` with `AppTheme.lightTheme` / `darkTheme`, `themeMode: ThemeMode.system` |
| Initial route | **`home: LoginPage()`** — `SplashPage` exists but is **not** the app entry (only reached if something pushes it) |
| Routing package | `go_router` declared in `pubspec.yaml` but **commented out** in `main.dart`; all navigation is **`Navigator`** + `MaterialPageRoute` |

Unused imports in `main.dart` (pages pulled in without use in `TAPApp`): `NewTreatmentPage`, `SplashPage`, `FaceMapPage`, `ProvidersPage`, `MedicalProfilePage`, `CalendarPage`, `TermsAndConditionsPage` — likely leftovers; Expo scaffold should not copy this pattern.

---

## 2. Feature → TypeScript layout map

Proposed mapping aligned with [MIGRATION_PLAN.md](./MIGRATION_PLAN.md) `src/` layout:

| Flutter (`lib/features/...`) | Expo Router (`app/`) suggestion | Feature module (`src/features/`) |
|-------------------------------|----------------------------------|----------------------------------|
| `auth/.../splash_page` | `app/(auth)/splash.tsx` (optional if product wants splash) | `auth` |
| `auth/.../login_page` | `app/(auth)/login.tsx` | `auth` |
| `auth/.../signup_page` | `app/(auth)/signup.tsx` | `auth` |
| `auth/.../welcome_page` | `app/(onboarding)/welcome.tsx` or post-login stack | `auth` / `onboarding` |
| `dashboard/.../dashboard_page` | `app/(app)/index.tsx` or `dashboard.tsx` | `dashboard` |
| `treatments/.../*` | `app/(app)/treatments/...` (list, `[id]`, `new`, `face-map`, etc.) | `treatments` |
| `providers/.../*` | `app/(app)/providers/...` | `providers` |
| `profile/.../medical_profile_page` | `app/(app)/medical-profile.tsx` | `profile` |
| `calendar/.../calendar_page` | `app/(app)/calendar.tsx` | `calendar` |
| `settings/.../settings_page` | `app/(app)/settings.tsx` | `settings` |
| `legal/.../terms_and_conditions_page` | `app/(app)/legal/terms.tsx` or modal | `legal` |

`core/widgets`, `core/theme` → `src/theme`, shared `components/` as needed.

---

## 3. `core/services/*` — responsibilities and backends

| Service | Firebase Auth | Firestore | Hive | Notes |
|---------|:-------------:|:---------:|:----:|-------|
| `auth_service.dart` | Yes | Yes (`users/{uid}`) | No | Email/password; **`signInWithGoogle()` throws** (GoogleSignIn disabled in code) |
| `content_service.dart` | Yes (current user) | Yes | No | Collections: `laserTypes`, `serviceTypes`, `treatmentAreas`, `providerServices`; seeds defaults |
| `user_roles_service.dart` | Yes | Yes (`users/{uid}`) | No | Reads `isAdmin` (and caches in memory) |
| `treatment_service.dart` | Yes | Yes `users/{uid}/treatments` | No | CRUD treatments |
| `medical_profile_service.dart` | Yes | Yes `users/{uid}/medicalProfile/current` | No | Single “current” profile doc |
| `provider_service.dart` | Yes | Yes `providers` (+ queries) | No | Uses `UserRolesService` for admin checks |
| `preferences_service.dart` | No | No | Yes | Box `preferences`, key `defaultProviderId` |

**Not observed in `lib/`:** `firebase_storage` usage — `pubspec` includes it but grep shows no Storage API in app code (verify before dropping on Expo).

---

## 4. Firestore shape sketch (for Supabase / Phase 2)

| Area | Path / collection | Purpose |
|------|-------------------|---------|
| User profile | `users/{uid}` | Profile fields, `isAdmin`, last login, etc. |
| Medical profile | `users/{uid}/medicalProfile/current` | Onboarding / health profile |
| Treatments | `users/{uid}/treatments/{treatmentId}` | User-scoped treatment records |
| Providers | `providers/{providerId}` | Shared provider directory |
| Reference data | `laserTypes`, `serviceTypes`, `treatmentAreas`, `providerServices` | ContentService-driven catalogs |

Expo implementation should mirror these **concepts** in Postgres tables with RLS, not necessarily the same nesting.

---

## 5. Navigation graph (imperative)

**Entry:** `LoginPage`.

**From `LoginPage`**

- Successful email login → `pushReplacement` → **`WelcomePage`** if no medical profile, else **`DashboardPage`** (same logic on PigeonUserDetails recovery path).
- Google button → **`DashboardPage`** on success (currently `signInWithGoogle` throws).
- `push` → **`TermsAndConditionsPage`** (terms + privacy both open Terms page today; privacy TODO in UI).
- `push` → **`SignUpPage`**.

**From `SignUpPage`**

- Success → `pushReplacement` → **`DashboardPage`**.

**From `WelcomePage`**

- CTA → `pushReplacement` → **`MedicalProfilePage(isOnboarding: true)`**.

**From `SplashPage`** (if used)

- After delay → `pushReplacement` → **`LoginPage`**.

**From `SettingsPage`**

- Logout → `pushAndRemoveUntil` → **`LoginPage`** (clear stack).

**Hub:** **`DashboardPage`** — many `Navigator.push` targets (treatments, providers, profile, calendar, face map, settings, new treatment, etc.). Full list is in source; Phase 3 will inventory each route when building Expo Router.

---

## 6. Screen size and risk (for ordering)

| Screen | Approx. lines | Notes |
|--------|---------------|--------|
| `new_treatment_page.dart` | ~2350 | Largest; many dialogs and branches — split into subcomponents when porting |
| `providers_page.dart` | ~900 | Heavy UI and navigation |
| `dashboard_page.dart` | ~760 | Central hub — stabilize early after auth |
| `new_treatment_page` + treatment stack | — | Highest regression risk |
| `settings_page.dart` | ~320 | Mostly static sections + logout/close |

---

## 7. Assets and branding

| Item | Flutter config | Workspace note |
|------|----------------|----------------|
| App icon | `flutter_launcher_icons` → `assets/icon/app_icon.png` (`pubspec.yaml`) | **`assets/` directory not present** in this checkout — icon may live only on machines with full project; re-add or export from Flutter project for Expo |
| `pubspec.yaml` `flutter.assets` | Commented out | No bundled image assets declared |
| Fonts | None custom in `pubspec` | Uses theme + Material |

**Port:** `PassportLogo` widget + theme colors from `core/theme/app_theme.dart` (gold `#d4af37`, dark `#1a2332` appear in welcome flow).

---

## 8. Settings roadmap — first Expo releases vs. backlog

Source: [SETTINGS_FEATURES.md](./SETTINGS_FEATURES.md).

**Ship in parity / MVP pass (match current Flutter behavior)**

- Settings layout (sections as today).
- **Logout** (confirm → clear session → root to login).
- **Close app** (platform exit where supported).

**Near-term (doc “Phase 1 / Next sprint” — prioritize after core flows)**

- Change password, dark mode, privacy policy viewer, terms linking (Flutter doc priorities).

**Later**

- Notifications, profile editor, help/about, export/backup, language, delete account, etc.

Expo first release does **not** need the full SETTINGS_FEATURES backlog; track gaps in [SCREEN_PARITY.md](./SCREEN_PARITY.md) when that file is created.

---

## 9. Skin analyzer (`IOS_APP_INTEGRATION.md`) — migration implications

Source: `../skin_analyzer_model/docs/IOS_APP_INTEGRATION.md` (sibling repo).

| Topic | Implication for Expo |
|-------|----------------------|
| Pipeline | Camera → preprocess (**512×512**, normalize) → **CoreML** segmentation → threshold mask → metrics (affected %, severity) |
| Model size | Guide: **~60–120 MB** class `.mlmodel` — affects app binary / OTA strategy |
| Platform | Guide is **iOS / Xcode / Swift** — React Native needs **native module** or alternate stack (TFLite/ONNX/server) for Android parity |
| Storage | “Save results for progress” — fits Supabase Storage + Postgres metadata later |
| Dependency | High-quality camera capture; align preprocessing exactly before trusting metrics |

Treat as **stub + feature flag** until native ML path is chosen (see MIGRATION_PLAN “Planned capability — Skin analyzer”).

---

## 10. `pubspec.yaml` packages — quick map to Expo world

| Package | Map to |
|---------|--------|
| `flutter_bloc`, `equatable` | Hooks + lightweight store (per plan) |
| `firebase_*` | **Supabase** client + auth (migration) |
| `hive` | **Expo SQLite** + repositories (preferences → SecureStore/SQLite as appropriate) |
| `local_auth` | `expo-local-authentication` |
| `cached_network_image` | `expo-image` |
| `image_picker` | `expo-image-picker` |
| `url_launcher` | `expo-linking` |
| `intl` | `date-fns` / `Intl` |
| `uuid` | `uuid` |
| `connectivity_plus` | `@react-native-community/netinfo` or `expo-network` |
| `permission_handler` | Expo permission APIs per feature |

---

## Maintenance

When `tap_app` changes (new screens, Firebase → something else, or assets added), update this file and Phase checkboxes in [MIGRATION_PLAN.md](./MIGRATION_PLAN.md).

**Phase 2:** Domain types and Supabase sketch live in `../src/domain/`, [SUPABASE_SCHEMA.md](./SUPABASE_SCHEMA.md), and [STATE_AND_BLOC_MAPPING.md](./STATE_AND_BLOC_MAPPING.md).

**Phase 3:** Expo Router — [EXPO_ROUTES.md](./EXPO_ROUTES.md), `app/` layouts, `src/store/session.tsx` (stub until Supabase Auth).

**Phase 4:** Shared utilities — `src/lib/*` (date-fns, Intl, uuid, Supabase-style error mappers), `src/hooks/useNetworkStatus.ts`, `src/theme/theme.ts` (light/dark).

**Phase 5 (in progress):** Supabase + repositories — see [SUPABASE_SETUP.md](./SUPABASE_SETUP.md), [SCREEN_PARITY.md](./SCREEN_PARITY.md). **Next slices:** treatment create, provider create, SQLite cache, reference content.
