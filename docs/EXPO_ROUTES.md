# Expo Router map

File-based routes under `app/`. **URL paths omit group segments** such as `(auth)` and `(app)` (e.g. you navigate to `/(app)/calendar` but the path is typically expressed as **`/calendar`** in `router.push`).

## Screen map (Flutter reference → Expo)

| Flutter screen | Route | Notes |
|----------------|-------|--------|
| `LoginPage` (home) | `/login` | Root `app/index.tsx` redirects signed-out users to `/(auth)/login`. |
| `SignUpPage` | `/signup` | |
| `WelcomePage` | `/welcome` | Shown when Supabase user has no `medical_profiles` row (unless `signupDashboardBypass`). |
| `SplashPage` | `/splash` | Optional; not default cold start. |
| `DashboardPage` / `HomePage` | `/` inside `(app)` | `app/(app)/index.tsx` — dashboard hub. |
| `treatment_list_page` | `/treatments` | Nested stack: `app/(app)/treatments/_layout.tsx` (own header + back affordance). |
| `treatment_detail_page` | `/treatments/:id` | Edit + delete; reload on focus. |
| `new_treatment_page` | `/treatments/new` | `createTreatmentForCurrentUser`; optional photos (online) → `treatment-photos` bucket. **Query:** `?fromAppointment=<uuid>` prefills from a **scheduled** appointment and marks it **completed** after a successful online save (see [SCREEN_PARITY.md](./SCREEN_PARITY.md)). |
| (edit treatment) | `/treatments/edit/:id` | `updateTreatmentForCurrentUser`; photo add/remove when online. |
| (appointments; Flutter N/A or partial) | `/appointments/new` | Nested stack: `app/(app)/appointments/_layout.tsx`. Creates `appointments` row (consult or future treatment visit). |
| | `/appointments/:id` | Detail: cancel / mark complete / log treatment / edit (when **scheduled**). |
| | `/appointments/edit/:id` | `updateAppointmentForCurrentUser`; **scheduled** only. |
| `face_map_page` | `/face-map` | Product shell; analyzer is a separate track (see [MIGRATION_PLAN.md](./MIGRATION_PLAN.md)). |
| `providers_page` | `/providers` | Nested stack: `app/(app)/providers/_layout.tsx`. |
| (provider detail) | `/providers/:id` | `fetchProviderByIdForCurrentUser`; edit/remove if `canMutate`. |
| `add_provider_page` | `/providers/new` | User-scoped provider (`is_global: false`). |
| (edit provider) | `/providers/edit/:id` | `updateProviderForCurrentUser` (own rows). |
| `medical_profile_page` | `/medical-profile` | **Query:** `?onboarding=true` from Welcome. |
| `calendar_page` | `/calendar` | Treatments + **scheduled** appointments by day; **Add appointment** → `/appointments/new`. |
| `settings_page` | `/settings` | Logout → `router.replace('/(auth)/login')`. |
| (catalog admin) | `/catalog-admin` | Settings when `profiles.is_admin`; reference catalog CRUD. |
| (user admin) | `/admin-users` | Same gate; `admin_set_user_admin` RPC (not on self). |
| `terms_and_conditions_page` | `/legal/terms` | Reachable without signing in (e.g. from login). |

## Nested stacks under `(app)`

These groups use **`headerShown: false`** on the parent `(app)/_layout.tsx` stack entry; **child** `Stack` screens supply titles and **`NestedStackExitBackButton`** where needed.

| Folder | Child screens (file names) |
|--------|----------------------------|
| `treatments/` | `index`, `new`, `[id]`, `edit/[id]` |
| `providers/` | `index`, `new`, `[id]`, `edit/[id]` |
| `appointments/` | `new`, `[id]`, `edit/[id]` |

## Query parameters (MVP)

| Param | Where | Purpose |
|-------|--------|---------|
| `onboarding` | `/medical-profile` | Set `true` when arriving from Welcome onboarding. |
| `fromAppointment` | `/treatments/new` | UUID of a **scheduled** `appointments` row; prefill + auto-complete after save (online only for completion). |

Add new params here when introducing flows that rely on `router.push` with search params (and prefer **repository IDs**, not PII, in URLs).

## Auth gating

- **`SessionProvider`** (`src/store/session.tsx`): Supabase session + optional **stub** mode; **`hasMedicalProfile`**, **`signupDashboardBypass`**, **`supabaseEnabled`** drive redirects.
- **`app/index.tsx`**: loading gate → `login` / `welcome` / `(app)` — mirrors Flutter login branches (stricter medical-profile rule when Supabase is on).

## Deep linking

- **Scheme:** **`tap`** (`app.config.js` / `expo.scheme`). Detail: `src/navigation/deep-linking.ts` (`LINKING_SCHEME`).
- **Universal links / app links** are not required for the POC; when added, extend **`deep-linking.ts`** and test `tap:///` paths against the table above.
- **EMR / scheduling ingest** (server-side appointment upsert) is **post-POC**; no public patient deep links for EMR are defined yet.

## Logout vs Flutter `pushAndRemoveUntil`

Flutter clears the stack to `LoginPage`. Expo: **`signOut()`** + **`router.replace('/(auth)/login')`** so the user cannot navigate back to `(app)` with the header back button.

## Upkeep checklist

When you add or rename a route:

1. Update this file’s tables and **`src/navigation/deep-linking.ts`** comments if the public URL shape changes.
2. Update **[SCREEN_PARITY.md](./SCREEN_PARITY.md)** if Flutter parity or intentional divergence changes.
3. If the flow is user-visible in Settings or onboarding, consider a one-line note in **[SETTINGS_FEATURES.md](./SETTINGS_FEATURES.md)** when behavior is product-significant.
