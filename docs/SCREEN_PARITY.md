# Screen parity (Expo vs Flutter)

Tracking intentional differences while porting `tap_app`.

**Routing reference:** **[EXPO_ROUTES.md](./EXPO_ROUTES.md)** (paths, query params, nested stacks). Keep these two docs aligned when screens or URL contracts change.

**Post-POC:** EMR / scheduling **server ingest** for `appointments` (e.g. `external_ref` upsert) is **deferred**; see [SETTINGS_FEATURES.md](./SETTINGS_FEATURES.md) and [MIGRATION_PLAN.md](./MIGRATION_PLAN.md) “What’s next”.

| Area | Flutter | Expo (Phase 5) | Notes |
|------|---------|----------------|--------|
| Auth entry | `LoginPage` as `MaterialApp.home` | Root `index` + Supabase session or stub | Cold start restores Supabase session. **Login/signup** use Flutter-aligned **PassportLogo** + headlines (`appStrings`). |
| Sign up → home | `DashboardPage` even if no medical profile | `signupDashboardBypass` until reload | After reload, user without `medical_profiles` row → Welcome (stricter than one-shot Flutter signup). |
| Medical profile | Rich form + Firestore | Text fields + enum hints; saves all arrays | UX polish in later passes. **`/medical-profile?onboarding=true`** from Welcome. |
| Dashboard home | `HomePage` inside `DashboardPage` (bottom nav) | Single scroll hub: welcome card, **Quick Actions** (incl. **Face / Skin Analyzer** → `/skin-analyzer`), **Upcoming appointments** (when any), **Recent Treatments** (3), **More** links | Flutter uses **bottom tabs**; Expo uses **stack** hub. **Upcoming** → **`/appointments/:id`**. |
| Upcoming / scheduled visits | (varies; not always first-class in Flutter) | **`appointments`** table + **Calendar** + dashboard strip | **Consult** vs **treatment** visit types; provider join on lists; **cancel / complete / edit / log treatment** on detail. No EMR sync in POC. |
| Treatments list | Full `treatment_list_page` | List + pull-to-refresh + detail + focus reload | **New / edit / delete** via repository + `/treatments/edit/[id]`; optional **photos** (library picker, max 6) → Supabase Storage + `photo_urls`; **online-only** for add/remove. **Offline:** list cache + queued creates/updates/deletes; alert then pop on queued save. |
| Log treatment from booking | (typically manual re-entry) | **`/treatments/new?fromAppointment=`** | Prefills date, provider, notes; treatment bookings also prefill modality / service / brand when catalogs are loaded. **Completed** appointment only after **online** save; offline queue leaves appointment **scheduled** (see `appStrings.appointmentOfflineLinkedAppointmentNote`). |
| Providers | Admin/global + search | List → **detail** tap; RLS + focus reload | **Add / edit** own rows; **Remove** = `is_active: false`. Global directory rows: view-only in app. **Offline:** same list cache + outbox pattern as treatments. |
| Face map | Full `face_map_page` | Product shell + roadmap bullets + link to treatments | **`/face-map`**. |
| Skin analyzer | (not in Flutter parity) | **`/skin-analyzer`** shell + roadmap; **CoreML** via future Expo Module | Dashboard Quick Action + **More** list. See [SKIN_ANALYZER_IOS_DESIGN.md](./SKIN_ANALYZER_IOS_DESIGN.md); **`analyzePigmentation`** throws until native ships. |
| Calendar | Full `calendar_page` | **Treatments** + **scheduled appointments** by day; **Add appointment**; provider on card; tap appointment → **detail** | No month grid widget parity. Treatments use list cache; appointments from Supabase **`006_*`**. Cancelled/completed rows are **not** listed on Calendar (scheduled-only slice); history is visible via treatments + appointment detail after navigation from past session if needed. |
| Terms | `TermsAndConditionsPage` | Sectioned placeholder + disclaimer | Replace with counsel-approved copy before production. **`/legal/terms`**. |
| Content catalogs | `ContentService` seeds | Supabase tables + chips on treatment/provider forms | **Admins:** Settings → **Catalog admin** edits rows (RLS); **User admin** toggles `is_admin` for *other* users via RPC; first admin still via SQL. |
| Offline catalogs | Hive / local | KV cache of catalog bundle after first successful fetch | Native: SQLite `kv_cache`; web: `localStorage` (`tap_kv_` prefix), same as list caches / outbox. |
| Settings | Sections + Close app | Log out + copy | See `SETTINGS_FEATURES.md`. |

## Upkeep

- When you ship or change a **screen**, update the relevant **row** above and **[EXPO_ROUTES.md](./EXPO_ROUTES.md)**.
- Prefer documenting **URL query params** only in **EXPO_ROUTES.md**; SCREEN_PARITY may point to them in the Notes column.
- Large cross-cutting work (**EMR**, **skin analyzer**, **Phase 6 stubs**) belongs in **MIGRATION_PLAN.md** / **SETTINGS_FEATURES.md**, not duplicated here—link only.
