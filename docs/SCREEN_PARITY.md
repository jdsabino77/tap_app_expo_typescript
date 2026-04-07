# Screen parity (Expo vs Flutter)

Tracking intentional differences while porting `tap_app`.

| Area | Flutter | Expo (Phase 5) | Notes |
|------|---------|----------------|--------|
| Auth entry | `LoginPage` as `MaterialApp.home` | Root `index` + Supabase session or stub | Cold start restores Supabase session. |
| Sign up → home | `DashboardPage` even if no medical profile | `signupDashboardBypass` until reload | After reload, user without `medical_profiles` row → Welcome (stricter than one-shot Flutter signup). |
| Medical profile | Rich form + Firestore | Text fields + enum hints; saves all arrays | UX polish in later passes. |
| Treatments list | Full `treatment_list_page` | List + pull-to-refresh + detail + focus reload | **New / edit / delete** via repository + `/treatments/edit/[id]`; not full Flutter new-treatment wizard. |
| Providers | Admin/global + search | List → **detail** tap; RLS + focus reload | **Add / edit** own rows; **Remove** = `is_active: false`. Global directory rows: view-only in app. |
| Face map | Full `face_map_page` | Product shell + roadmap bullets + link | On-device analyzer still separate track (see migration plan). |
| Calendar | Full `calendar_page` | Treatments grouped by day (read-only) | No month grid widget parity. |
| Terms | `TermsAndConditionsPage` | Sectioned placeholder + disclaimer | Replace with counsel-approved copy before production. |
| Content catalogs | `ContentService` seeds | Supabase tables + chips on treatment/provider forms | Admin UI to edit catalogs not built; use SQL or `is_admin` in DB. |
| Settings | Sections + Close app | Log out + copy | See `SETTINGS_FEATURES.md`. |

Update this table when a screen reaches “done” in the migration plan.
