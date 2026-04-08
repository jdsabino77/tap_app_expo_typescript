# Migration plan: Flutter `tap_app` → Expo TypeScript

This document is the **single working checklist** for the rebuild. Complete phases **in order**; within a phase, prefer **one screen or one vertical slice** before moving on.

---

## Guiding rules

1. **One thing at a time** — merge only when the app still launches and the previous phase still works.
2. **Source of truth** — Flutter code under `../tap_app`; this repo is the TypeScript implementation.
3. **Stub early** — any native capability you will not wire in the current sprint gets a **typed stub module** (no silent failures in call sites).
4. **Parity over cleverness** — match behavior and data shapes first; refactor UX after core flows work.
5. **Online-first, cache locally** — cloud is the source of truth; local SQLite supports fast reads, offline viewing, and queued retry for failed writes.
6. **Repository boundary required** — screens/hooks do not call Supabase or SQLite directly; all persistence goes through repository/service layers.

---

## Architecture decision — backend and local persistence

**Chosen approach**

- **Cloud backend:** Supabase
- **Cloud database:** Supabase Postgres
- **Auth:** Supabase Auth
- **File/image storage:** Supabase Storage
- **Local cache:** Expo SQLite
- **Secure token storage:** Expo SecureStore
- **Sync model:** Online-first with local cache and retry queue
- **State approach:** Lightweight app state + repository-driven data fetching
- **Future option:** background sync / richer local-first model only if product needs it later

**Operating model**

- App reads from **local SQLite cache first** where practical, then refreshes from Supabase.
- App writes try **remote first**.
- If remote write fails due to connectivity/transient issues, store a **queued write job** locally for retry.
- UI must show clear `loading`, `synced`, `pending`, and `error` states for mutating flows where needed.
- Do **not** attempt full bidirectional sync/conflict resolution in the first release.

**Initial rule of thumb**

- **Reference data / profile data:** cache locally after fetch
- **User-generated records (treatments, providers, notes):** send to Supabase first, then mirror locally
- **Photos/assets:** upload to Supabase Storage; cache thumbnails/metadata locally, not full originals unless explicitly needed

---

## Related documentation (big picture)

These docs sit **outside** strict Flutter→Expo parity but define product scope and future native work. Keep them in view while prioritizing screens and stubs.

| Document | Location | Role in this migration |
|----------|----------|-------------------------|
| **Settings & preferences roadmap** | [SETTINGS_FEATURES.md](./SETTINGS_FEATURES.md) (copied from `tap_app`; canonical Flutter-era source: `../tap_app/docs/SETTINGS_FEATURES.md`) | Product backlog for Settings, account, theme, notifications, legal, data export, etc. Use when rebuilding **Settings** and when deciding what is MVP vs. later. |
| **Expo Router map** | [EXPO_ROUTES.md](./EXPO_ROUTES.md) | Canonical **`app/`** routes, query params, nested stacks (`treatments`, `providers`, `appointments`), and deep-link notes. Maintain alongside [SCREEN_PARITY.md](./SCREEN_PARITY.md). |
| **Skin analyzer (Expo)** | [SKIN_ANALYZER_IOS_DESIGN.md](./SKIN_ANALYZER_IOS_DESIGN.md) | iOS CoreML / dev-client roadmap, JS facade, links to **`skin_analyzer_model`** docs. Paired with [SETTINGS_FEATURES.md](./SETTINGS_FEATURES.md) “Face map & skin analyzer”. |
| **Skin analyzer workflow** | [SKIN_ANALYZER_WORKFLOW.md](./SKIN_ANALYZER_WORKFLOW.md) | Ordered commands: prebuild, export `pigment_segmentation.mlpackage`, Xcode bundle, native bridge. |
| **Skin analyzer → iOS app integration** | [`../../skin_analyzer_model/docs/IOS_APP_INTEGRATION.md`](../../skin_analyzer_model/docs/IOS_APP_INTEGRATION.md) (sibling of `tap_app` under `development/`) | End-to-end plan for on-device segmentation (capture → preprocess → **CoreML** → overlays/metrics → progress). Not a Flutter port item: plan **Expo dev client / native module** (or alternative ML stack) and stub the feature surface until the pipeline is chosen. |

---

## Proposed TypeScript architecture

```text
app/                      # Expo Router routes
src/
  features/               # feature modules
  domain/                 # domain types, validators, mappers, pure logic
  repositories/           # orchestration layer (remote + local)
  services/
    supabase/             # supabase client and remote services
    local/                # sqlite, secure storage, queued writes
    native-stubs/         # typed native placeholders
  hooks/                  # feature hooks
  store/                  # lightweight app state
  theme/                  # theme tokens
  lib/                    # shared utilities
docs/
```

---

## Phase 1 — Analyze Flutter project structure

**Goal:** Know where logic, UI, and side effects live before copying concepts into TypeScript.

| Task | Done |
|------|------|
| Confirm entry and bootstrap (`main.dart`: Hive, Firebase, `ContentService`) | ☑ |
| Map each feature folder under `lib/features/*` to a future `app/` or `src/features/*` area | ☑ |
| List all `core/services/*` and what they call (Firebase, Hive, platform APIs) | ☑ |
| Trace auth entry: `LoginPage` as `home`; document `pushReplacement` targets (dashboard vs. signup, etc.) | ☑ |
| Note largest / riskiest screens (`new_treatment_page`, `dashboard`, etc.) for later ordering | ☑ |
| Capture asset list (`assets/icon/`, any images/fonts) for porting | ☑ |
| Read [SETTINGS_FEATURES.md](./SETTINGS_FEATURES.md); mark which items are in-scope for first Expo releases vs. backlog | ☑ |
| Skim [IOS_APP_INTEGRATION.md](../../skin_analyzer_model/docs/IOS_APP_INTEGRATION.md) and note dependencies (camera quality, model bundle size, iOS-only CoreML vs. cross-platform options) | ☑ |

**Deliverable:** [FLUTTER_INVENTORY.md](./FLUTTER_INVENTORY.md) — Phase 1 analysis (2026-04-06). Update when the Flutter app or target architecture changes.

---

## Phase 2 — Extract data models and business logic

**Goal:** Shared TypeScript types and pure (or testable) logic **without** depending on final UI.

| Task | Done |
|------|------|
| Port Dart models (e.g. `medical_profile.dart`, `provider.dart`) to TypeScript interfaces/types + validators if needed | ☑ |
| Map Firestore document paths and fields from services (`*_service.dart`) to **Supabase tables/columns** and RLS rules | ☑ |
| Extract calculations, mappers, and constants that are not widget-specific into `src/domain` or `src/lib` | ☑ |
| Decide state approach (e.g. Zustand + hooks) and where each “bloc” boundary from Flutter maps | ☑ |
| Add minimal unit tests for serializers and pure functions where Flutter had implicit assumptions | ☑ |

**Rule:** UI components import from these modules; avoid duplicating shape definitions in screens.

**Deliverables (2026-04-06):**

- Domain + Zod: `src/domain/*`, shared `calculateAge` in `src/lib/age.ts`, theme hex tokens in `src/theme/tokens.ts`
- Supabase draft: [SUPABASE_SCHEMA.md](./SUPABASE_SCHEMA.md)
- State plan: [STATE_AND_BLOC_MAPPING.md](./STATE_AND_BLOC_MAPPING.md)
- Tests: `npm test` (Vitest) — age, medical profile parse/labels, treatment stats, provider `specialties` → `services`

---

## Phase 3 — Recreate navigation in Expo Router

**Goal:** File-based routes that reflect **stacks and auth gating**, matching the Flutter navigation graph.

| Task | Done |
|------|------|
| Scaffold Expo Router: `app/_layout.tsx`, group layouts e.g. `(auth)` vs. `(app)` | ☑ |
| Map Flutter stacks: splash/welcome/login/signup → auth group; post-login → tabs or stack | ☑ |
| Replace `Navigator.push` flows with `router.push`, modal routes, or nested stacks as appropriate | ☑ |
| Handle `pushAndRemoveUntil`-style resets (e.g. logout in settings) with `router.replace` / dismissAll patterns | ☑ |
| Deep-link parity: only add URLs where product needs them; document in code comments | ☑ |

**Note:** Flutter currently uses imperative navigation, not `go_router`. Expo Router should encode the **intended** product IA, which may tidy overlapping patterns.

**Deliverables (2026-04-06):** Expo SDK 52 + `expo-router` ~4, `app/` route tree, `SessionProvider` stub, `legal` stack for terms, [EXPO_ROUTES.md](./EXPO_ROUTES.md), `src/navigation/deep-linking.ts`. Run **`npm start`** for Expo Go / simulator.

---

## Phase 4 — Port shared utilities

**Goal:** One implementation per concern (dates, IDs, formatting, errors, networking hints).

| Task | Done |
|------|------|
| Date/number formatting (`intl` → chosen TS libs); keep timezone behavior explicit | ☑ |
| UUID generation; secure random if needed for tokens | ☑ |
| HTTP/Supabase error mapping to user-visible messages (mirror Flutter `debugPrint` vs. UI errors) | ☑ |
| Connectivity: subscribe in a small module; expose hook or store | ☑ |
| Theme tokens from `app_theme.dart` → theme object (colors, typography, spacing) | ☑ |

**Deliverables (2026-04-06):** `src/lib/datetime.ts` (date-fns + locale + TZ notes), `format.ts` (Intl), `ids.ts` + `crypto-bridge.ts` (uuid / expo-crypto), `supabase-errors.ts`, `src/hooks/useNetworkStatus.ts` (NetInfo), `src/theme/theme.ts` (light/dark from Flutter), dashboard offline banner; Vitest for format/datetime/errors/uuid.

---

## Phase 5 — Rebuild one screen at a time

**Goal:** Vertical slices that connect navigation → UI → repositories → **Supabase + local SQLite** (replacing Firestore/Hive behavior).

Suggested **order** (adjust if product priority differs):

1. Splash / auth shell (if retained) — align with Expo Router redirects  
2. Login / signup / welcome  
3. Dashboard (hub for other pushes)  
4. Treatment list → detail → new treatment (largest surface; split sub-flows if needed)  
5. Face map  
6. Providers list → add provider  
7. Medical profile  
8. Calendar — treatments by day **plus** DB-backed **appointments** (consult / treatment), upcoming list on dashboard  
9. Settings (logout / reset navigation) — align with [SETTINGS_FEATURES.md](./SETTINGS_FEATURES.md) for planned vs. shipped features  
10. Terms and conditions  

| Task | Done |
|------|------|
| Define “done” per screen: loads data, handles empty/error, matches critical Flutter actions | ☑ (slice 1: auth + gate + dashboard header + treatments list/detail + providers list + medical save + settings logout) |
| Copy assets and strings as needed per screen | ☑ (slice 8: `appStrings` + `PassportLogo`; hub + auth aligned; raster assets N/A in Flutter source) |
| Track deviations from Flutter in a short `docs/SCREEN_PARITY.md` (optional, add when first gap appears) | ☑ |

**Deliverables — Phase 5 slice 1 (2026-04-06):** `@supabase/supabase-js` + **SecureStore** client, `supabase/migrations/001_phase5_core.sql`, repositories (`medical-profile`, `treatments`, `providers`, `profile`), real **login/signup/logout**, **medical profile upsert**, **treatments** list/detail, **providers** list, [SUPABASE_SETUP.md](./SUPABASE_SETUP.md), [SCREEN_PARITY.md](./SCREEN_PARITY.md), `.env.example`.

**Deliverables — Phase 5 slice 2 (2026-04-06):** **New treatment** (`createTreatmentForCurrentUser`, profile `treatment_count` bump), **add provider** (`createProviderForCurrentUser`, RLS-aligned `created_by` / `user_id`), nested stacks for **treatments** and **providers**, **calendar** (treatments by day), **face map** product shell + link to treatments, **terms** placeholder sections (replace with legal), **Supabase `postal_code`** mapping in `providerFromRemote`, **focus refresh** on dashboard / lists / calendar after saves.

**Deliverables — Phase 5 slice 3 (2026-04-06):** **Treatment** `updateTreatmentForCurrentUser`, `deleteTreatmentForCurrentUser` (profile `treatment_count` **adjust** +1 / −1), detail **Edit** / **Delete** + `/treatments/edit/[id]`. **Provider** `fetchProviderByIdForCurrentUser` (with **canMutate**), `updateProviderForCurrentUser`, `deactivateProviderForCurrentUser` (soft hide via `is_active`), **`/providers/[id]`** detail + **`/providers/edit/[id]`**, list rows **navigate to detail**; directory (`user_id` null) providers **read-only** in UI. **Domain:** `Provider.website`, snake_case **`is_active` / `is_global`** in `providerFromRemote`.

**Deliverables — Phase 5 slice 4 (2026-04-06):** **Reference catalogs** migration [`002_reference_catalogs.sql`](../supabase/migrations/002_reference_catalogs.sql) (`laser_types`, `service_types` with **`applies_to`**, `treatment_areas`, `provider_service_catalog`), RLS (authenticated **read** active; **admin** full CRUD), **seed** rows. **`catalog.repository`** + **`useReferenceCatalogs`**; **`filterServiceTypesForTreatment`**; UI chips on **new/edit treatment** and **new/edit provider** (`src/components/catalog-suggestions.tsx`, `toggleCommaListItem`).

**Deliverables — Phase 5 slice 5 (2026-04-06):** **Team Supabase dashboard** noted in [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) (`pexgbpnsuavlaejwgxnx`). **`expo-sqlite`** + `expo-sqlite` config plugin; **`src/services/local/cache-db.ts`** (KV table) + initial **`reference-catalog-cache.ts`** (later slice 7: **`kv-async`** for web). Catalog fetch **writes cache** after remote success and **falls back** when offline / remote error. **`ReferenceCatalogBundle`** + **`parseReferenceCatalogBundleJson`** in domain; **Settings** About (version) + Terms link + note on cache.

**Deliverables — Phase 5 slice 6 (2026-04-06):** **Treatments/providers list KV cache** (`treatments-list-cache`, `providers-list-cache`; web: `localStorage` via `kv-async`). Repositories **persist lists after successful fetch**, **fall back to cache** on fetch failure, expose **`readCached*ForCurrentUser`** for cache-first UI. **`write_outbox`** table + **`write-queue`** (web: `tap_write_outbox_v1`); offline (or failed) mutations **enqueue**, **patch list cache**, throw **`WriteQueuedError`**; **`WriteQueueSync`** + **`flushWriteOutbox`** when **`useNetworkStatus` → online**; **logout** clears list caches + outbox via **`clearUserLocalCache`**.

**Deliverables — Phase 5 slice 7 (2026-04-06):** **Reference catalog bundle** persistence moved to **`kv-async`** (`reference-catalog-cache.ts`): same **`kv_cache` / `tap_kv_` localStorage** path as list caches; **offline / failed fetch** fallback works on **web**. **`clearReferenceCatalogBundleCache`** on **logout** with other local data. **Settings** copy updated.

**Deliverables — Phase 5 slice 8 (2026-04-06):** **Copy + branding parity** with Flutter: **`src/strings/appStrings.ts`** (dashboard, auth, welcome, terms, nav labels); **`PassportLogo`** component (Flutter `passport_logo.dart` — vector, no PNG); **login / signup / welcome / splash** wired to strings + logo; **`app.config.js`** `name` → **T.A.P by YasaLaser** (`main.dart`); **dashboard** home: welcome card, **Quick Actions** grid (Flutter `HomePage`), **Recent Treatments** (up to 3) + empty state, **More** list + terms link; **stack titles** for face map, calendar, medical profile, settings.

**Deliverables — Phase 5 slice 9 (2026-04-06):** **In-app reference catalog admin** for **`profiles.is_admin`**: **`catalog-admin.repository.ts`** (list / insert / update / delete on all four catalog tables; **`clearReferenceCatalogBundleCache`** after mutations); **`/catalog-admin`** screen (tabs + row editors: name, description where applicable, **`applies_to`** for service types, sort order, active/default, delete confirm); **Settings → Catalog admin** link when **`is_admin`**; **`fetchOwnProfileRow`** includes **`is_admin`**. [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) documents **`update profiles set is_admin = true`**.

**Deliverables — Phase 5 slice 10 (2026-04-07):** **Appointments** — migration [`006_appointments.sql`](../supabase/migrations/006_appointments.sql): `public.appointments` (consult vs treatment, optional **`provider_id`**, **`external_ref`** for clinic/EMR correlation). Repos: list + upcoming + create + **`fetchAppointmentByIdForCurrentUser`** + **`updateAppointmentForCurrentUser`**; queries use **`*, providers(name)`** embed → domain **`providerName`**. **Calendar:** logged treatments + **scheduled** appointments by day, **Add appointment**, rows show **provider** under date/time; tap → **`/appointments/[id]`** detail. **Dashboard:** **Upcoming appointments** (before recent treatments), tap → detail. **Navigation:** **`appointments/_layout`** nested stack (`new`, `[id]`, **`edit/[id]`**); parent **`(app)/_layout`** registers **`appointments`** with `headerShown: false`. Strategy notes: [SETTINGS_FEATURES.md](./SETTINGS_FEATURES.md) (calendar + EMR push). Schema/setup: [SUPABASE_SCHEMA.md](./SUPABASE_SCHEMA.md), [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) step for `006`.

**Deliverables — Phase 5 slice 11 (2026-04-07):** **Appointment lifecycle (client):** **`setAppointmentStatusForCurrentUser`** (`cancelled` \| `completed`, only from **`scheduled`**). **Detail screen:** confirm dialogs, **Log treatment from this visit** → **`/treatments/new?fromAppointment=`** with prefill (date, provider, notes; treatment visits also modality / service / brand hydrate); online save runs **`setAppointmentStatusForCurrentUser(..., completed)`** after **`createTreatmentForCurrentUser`**; offline queue shows extra copy so users know the appointment stays **scheduled**. Docs: [SETTINGS_FEATURES.md](./SETTINGS_FEATURES.md), [SCREEN_PARITY.md](./SCREEN_PARITY.md).

### What’s next (recommended order)

1. **Appointments — EMR ingest (server):** Supabase **Edge Function** (or other backend) with **service role**, idempotent **upsert** by **`external_ref`** + **`user_id`** resolution (see [SETTINGS_FEATURES.md](./SETTINGS_FEATURES.md)). Optional: show **cancelled/completed** appointments on Calendar for history (filter/grouping).
2. **Parity & docs:** Keep [SCREEN_PARITY.md](./SCREEN_PARITY.md) + [EXPO_ROUTES.md](./EXPO_ROUTES.md) aligned with `app/` (2026-04-07 upkeep: appointments stack, query params, nested stacks, EMR deferred); extend when adding universal links or EMR handoff URLs.
3. **Phase 6 checklist:** Typed **`src/native-stubs/`** (or incremental Expo modules) so missing native APIs fail loudly; confirm repositories-only DB access in new code.
4. **Settings / product backlog:** Work through [SETTINGS_FEATURES.md](./SETTINGS_FEATURES.md) (notifications, export, theme, account, etc.).
5. **Face map / skin analyzer:** Separate track — dev client / native ML (see **Planned capability — Skin analyzer** below and `IOS_APP_INTEGRATION.md`).
6. **Hardening:** i18n / string audit, EAS/TestFlight runbook, counsel-approved **Terms** copy.

---

## Phase 6 — Stub unsupported native plugins early

**Goal:** No crashes from missing native modules; clear TODOs for real implementations.

| Task | Done |
|------|------|
| Create `src/native-stubs/` (or similar) with typed facades: `localAuth`, `permissions`, `storage`, etc. | ☐ |
| Each stub: same async API as the real module; return safe defaults or throw a **`NotImplementedError` with message** in dev if misused | ☐ |
| Replace stubs with Expo modules incrementally (`expo-local-authentication`, `expo-image-picker`, etc.) | ☐ |
| Confirm Supabase client setup, EAS env (URL, anon key), and **no direct DB access from screens** (repositories only) | ☐ |
| List SQLite + SecureStore mappings per service (`preferences_service` default provider → local cache + sync rules) | ☐ |

---

## Planned capability — Skin analyzer (on-device ML)

**References:** [SETTINGS_FEATURES.md](./SETTINGS_FEATURES.md) (Face map & skin analyzer), [SKIN_ANALYZER_IOS_DESIGN.md](./SKIN_ANALYZER_IOS_DESIGN.md) (Expo implementation steps), [`skin_analyzer_model/docs/IOS_APP_INTEGRATION.md`](../../skin_analyzer_model/docs/IOS_APP_INTEGRATION.md) (training → CoreML → UI).

Treat this as a **separate track** from screen-for-screen Flutter porting: it needs native ML and likely **custom dev builds** (not Expo Go alone).

| Task | Done |
|------|------|
| Define UX entry point in T.A.P (e.g. from treatment flow or profile) and keep it behind a **feature flag** or stub screen until ML is ready | ☑ **Dashboard** Quick Action + **`/skin-analyzer`** shell; JS facade **`analyzePigmentation`** stubs until native module |
| Decide stack: iOS **CoreML** (per integration guide) vs. cross-platform (e.g. ONNX / TFLite) vs. server-side fallback | ☐ |
| Stub module: `analyzeSkinPhoto(imageUri) → Promise<AnalysisResult \| NotImplemented>` with typed result shape matching future metrics (scores, mask, percentages) | ☑ **`analyzePigmentation`** in `src/services/skin-analyzer/` (throws `SkinAnalyzerNotAvailableError` until native) |
| Plan bundling: model size (guide cites ~60–120 MB class of artifact), asset delivery, and EAS / Xcode integration | ☐ |
| Validate camera + preprocessing parity with the guide (resize/normalize assumptions) before trusting clinical-style metrics in UI | ☐ |

---

## Dependency checklist (high level)

When you bootstrap the Expo app, verify these areas have an owner:

- [x] Supabase (Auth, Postgres, RLS, Storage for treatment photos)  
- [~] Local cache (Expo SQLite) — reference catalogs + treatments/providers lists + write outbox; web uses localStorage for KV/outbox  
- [ ] Biometrics  
- [x] Image pick / display — treatment photos (`expo-image-picker` + signed URLs)  
- [x] Network status — `useNetworkStatus` (NetInfo) + dashboard offline banner; list/outbox behavior per repos  
- [~] Legal/content bootstrap — Supabase reference catalogs + form chips (Flutter `ContentService` parity partial)  
- [ ] Settings roadmap parity (see [SETTINGS_FEATURES.md](./SETTINGS_FEATURES.md))  
- [ ] Skin analyzer / on-device ML (see integration guide; likely native module + dev client)  

---

## Version alignment

Track parity with the Flutter app version in this repo’s `package.json` or `app.config` notes (Flutter reference: **1.0.1+4** at time of inventory).

---

## Changelog

| Date | Change |
|------|--------|
| 2026-04-06 | Initial plan and inventory from `tap_app` tree and `pubspec.yaml` |
| 2026-04-06 | Added big-picture docs: `SETTINGS_FEATURES.md` (copied), skin analyzer `IOS_APP_INTEGRATION.md`, and planned ML phase |
| 2026-04-06 | Phase 1 complete: expanded `FLUTTER_INVENTORY.md`; fixed architecture code fence; aligned Phases 5–6 and dependency checklist with Supabase + SQLite |
| 2026-04-06 | Phase 2 complete: `src/domain`, `SUPABASE_SCHEMA.md`, `STATE_AND_BLOC_MAPPING.md`, Vitest + Zod, `package.json` / `tsconfig` |
| 2026-04-06 | Phase 3 complete: Expo Router `(auth)` / `(app)` / `legal`, session stub, dashboard hub stubs, `EXPO_ROUTES.md` |
| 2026-04-06 | Phase 4 complete: shared lib (dates, Intl, ids, Supabase error mappers), NetInfo hook, expanded theme, `expo-crypto` |
| 2026-04-06 | Phase 5 slice 1: Supabase auth + RLS schema migration + repositories + core screens wired |
| 2026-04-06 | Phase 5 slice 7: reference catalog cache via `kv-async` (web parity); clear on logout; Settings copy |
| 2026-04-06 | Phase 5 slice 8: `appStrings` + `PassportLogo`; dashboard quick actions + recent treatments; auth/splash copy; app display name |
| 2026-04-06 | Phase 5 slice 9: catalog admin screen + repository; `is_admin` on profile; Settings link; Supabase setup note |
| 2026-04-06 | Supabase CLI: `supabase init` + `config.toml`; `db:push` / `db:link` scripts; SUPABASE_SETUP clarifies schema not auto-applied by Expo |
| 2026-04-06 | Phase 5: treatment photos (`003` column + `treatment-photos` bucket RLS); admin user list + `admin_set_user_admin` (`004`); `/admin-users` + Settings link |
| 2026-04-07 | Phase 5 slice 10: **`006_appointments`**, calendar + dashboard upcoming visits, appointment detail/edit, **`providers(name)`** join, nested **`appointments`** stack; [SETTINGS_FEATURES.md](./SETTINGS_FEATURES.md) strategy updated |
| 2026-04-07 | Phase 5 slice 11: appointment **cancel/complete**, **log visit** → new treatment + auto-complete when online; **`setAppointmentStatusForCurrentUser`** |
| 2026-04-07 | Docs: [EXPO_ROUTES.md](./EXPO_ROUTES.md) + [SCREEN_PARITY.md](./SCREEN_PARITY.md) overhaul (appointments, query params, upkeep checklist); EMR integration explicitly **post-POC** |
| 2026-04-08 | Skin analyzer: `/skin-analyzer` screen, dashboard Quick Action + More link, `src/services/skin-analyzer` facade, docs cross-links ([SKIN_ANALYZER_IOS design](./SKIN_ANALYZER_IOS_DESIGN.md), MIGRATION_PLAN table) |
| 2026-04-08 | Skin analyzer workflow: `expo-dev-client`, `prebuild:ios` / `run:ios` scripts, [SKIN_ANALYZER_WORKFLOW.md](./SKIN_ANALYZER_WORKFLOW.md) (parallel to ML training) |
