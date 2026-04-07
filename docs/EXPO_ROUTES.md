# Expo Router map (Phase 3)

File-based routes under `app/`. URLs omit group segments `(auth)` and `(app)`.

| Flutter screen | Route | Notes |
|----------------|-------|--------|
| `LoginPage` (home) | `/ (auth)/login` | Root `index` redirects signed-out users here. |
| `SignUpPage` | `/signup` | |
| `WelcomePage` | `/welcome` | After stub login without profile. |
| `SplashPage` | `/splash` | Optional; not default entry. |
| `DashboardPage` | `/` inside `(app)` → `/` or `/(app)` | |
| `treatment_list_page` | `/treatments` | Nested stack: `app/(app)/treatments/_layout.tsx` (own header). |
| `treatment_detail_page` | `/treatments/:id` | Edit + Delete on screen; reload on focus. |
| `new_treatment_page` | `/treatments/new` | Creates row via `createTreatmentForCurrentUser`. |
| (edit treatment) | `/treatments/edit/:id` | `updateTreatmentForCurrentUser`. |
| `face_map_page` | `/face-map` | |
| `providers_page` | `/providers` | Nested stack: `app/(app)/providers/_layout.tsx`. |
| (provider detail) | `/providers/:id` | `fetchProviderByIdForCurrentUser`; edit/remove if `canMutate`. |
| `add_provider_page` | `/providers/new` | Creates user-scoped provider (`is_global: false`). |
| (edit provider) | `/providers/edit/:id` | `updateProviderForCurrentUser` (own rows only). |
| `medical_profile_page` | `/medical-profile` | Query `?onboarding=true` from Welcome. |
| `calendar_page` | `/calendar` | |
| `settings_page` | `/settings` | Logout → `router.replace('/(auth)/login')`. |
| `terms_and_conditions_page` | `/legal/terms` | Available without signing in (from login). |

## Auth gating

- **`SessionProvider`** (`src/store/session.tsx`): stub `userId` + `hasMedicalProfile`.
- **`app/index.tsx`**: `Redirect` to `login` / `welcome` / `(app)` — mirrors Flutter login branches.

## Deep linking

Scheme: **`tap`** (`app.config.js`). See `src/navigation/deep-linking.ts`.

## Logout vs Flutter `pushAndRemoveUntil`

Flutter clears the stack to `LoginPage`. Expo: **`signOut()`** + **`router.replace('/(auth)/login')`** so the user cannot navigate back to `(app)` with the header back button.
