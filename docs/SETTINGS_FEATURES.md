# T.A.P Settings & User Preferences

## Overview

Comprehensive settings page for user account management, preferences, and app configuration.

**TestFlight beta:** Product scope and validation checklists (**Strongly include / Nice / After beta**) are under **TestFlight & iOS beta (test user POC)** → **Beta feature scope**.

## Before production: Supabase email confirmation

**Interim (development):** In the Supabase dashboard, under **Authentication → Providers → Email**, leave **Confirm email** **disabled** so new accounts can sign in immediately without clicking a confirmation link.

**Before launch:** Re-enable **Confirm email** and finish the full flow:

- Set **Site URL** and **Redirect URLs** so confirmation links do not point at a dead default (e.g. `http://localhost:3000`).
- Use a stable app redirect (custom scheme / dev or store build), and allow-list it in Supabase; configure **`EXPO_PUBLIC_SUPABASE_AUTH_REDIRECT_URL`** if needed.
- Verify the link opens the app (or web) and establishes a session end-to-end.

Implementation details and checklist: **[SUPABASE_SETUP.md](./SUPABASE_SETUP.md)** (email confirmation section).

## TestFlight & iOS beta (test user POC)

**Goal:** Get a **signed release-quality iOS binary** onto **TestFlight** so trusted testers can review navigation, auth, treatments, calendar, and **Skin analyzer (on-device demo)** without sideloading Xcode builds.

**Model training timeline:** The **clinic-grade / multi-class** pigment model (exclusive conditions, real `conditions[]`, Supabase-driven **recommended treatments**) is planned **after** this TestFlight POC. The POC build validates **app packaging, Core ML wiring, privacy posture, and UX** with the **current** bundled **`pigment_segmentation.mlpackage`** (and stub condition / recommendation copy). See **[SKIN_ANALYZER_WORKFLOW.md](./SKIN_ANALYZER_WORKFLOW.md)** and **`skin_analyzer_model`** when you are ready to train for production.

**Main branch:** Core app functionality (dashboard, treatments, calendar/appointments, etc.) is expected there; use the checklist below to **validate the beta bar** on a **release / TestFlight-equivalent** build (signing, env, and permissions can differ from the dev client).

### Beta feature scope — categories & validation

Use this to gate the first TestFlight. Check boxes as you confirm each item on an **iOS release build** (local Archive or **EAS** `production`).

#### A. Strongly include for beta (validate for TestFlight POC)

| # | Item | Validation notes |
|---|------|------------------|
| A1 | **Auth end-to-end** | **Required before wider beta.** Sign up, sign in, sign out; password reset if you expose it. Use **release** `EXPO_PUBLIC_*` Supabase URLs/keys; **`tap`** scheme + Supabase **Redirect URLs** so email/magic links return to the app; align with **[Before production: Supabase email confirmation](#before-production-supabase-email-confirmation)** and **[SUPABASE_SETUP.md](./SUPABASE_SETUP.md)**. |
| A2 | **Core patient journeys** | Smoke-test **dashboard**, **treatments** (list / add / edit as shipped), **appointments / calendar** if testers should review them — same flows as **main**, on the **TF binary**. |
| A3 | **Skin analyzer (demo)** | `/skin-analyzer`: pick photo → on-device inference → mask + condition preview + recommended treatments stubs; UI clearly **non-diagnostic** / educational. |
| A4 | **Photo permission + one happy path** | On the **TestFlight build** (not only Xcode debug/dev client): first-time **photo library** prompt appears; **Settings → T.A.P → Photos** is correct after a pick. Complete at least **one** path: e.g. Skin analyzer pick **or** one **treatment photo** attach — whichever you ship. *Release-only breakages are common; treat this as explicit QA.* |
| A5 | **Legal / trust (minimal)** | Testers can open **Privacy policy** and **Terms** (in-app or Safari to stable URLs). **About** shows **version/build** if the screen exists (helps support). |

**Suggested ownership:** mark each **A** row `[x]` below when done.

- [ ] **A1** — Auth end-to-end (release build + Supabase redirects) — *must complete for beta readiness*
- [ ] **A2** — Core patient journeys on TF binary *(manual QA on release IPA)*
- [ ] **A3** — Skin analyzer demo path *(in-app: non-diagnostic banner + disclosures; still verify on TF)*
- [ ] **A4** — Photo permission + one happy path on TF binary *(deny flow offers Open Settings; verify system prompt + Settings on TF)*
- [ ] **A5** — Privacy, Terms, About/version *(in-app: Privacy → Safari to yasalaser.com; Terms placeholder + link to site; Settings version + native build)*

#### B. Nice for beta (optional first drop)

Defer if time-constrained; not required to get meaningful feedback on core + Skin analyzer.

- [ ] **Profile editing** (name/email/photo) — if testers use **dedicated test accounts**, read-only profile may suffice.
- [ ] **Change password** — same note as above.
- [ ] **Dark mode** — polish.
- [ ] **Push notifications** — extra Apple setup; skip unless reminders are the main hypothesis.
- [ ] **Export data / delete account / backup** — defer until after UX validation.

#### C. After this beta (explicitly out of POC scope)

- [ ] **Production / multi-class** skin model and real **`conditions[]`** from Core ML.
- [ ] **`condition_service_map`** wired in-app (replace recommendation stubs).
- [ ] Full **settings** backlog in **Planned Features (Coming Soon)** below (many items are **Flutter-era** notes; reconcile with **Expo** implementation status when prioritizing).

### Distribution path (pick one)

| Path | When to use |
|------|-------------|
| **[EAS Build + Submit](https://docs.expo.dev/build/introduction/)** | Recommended for this Expo repo: cloud builds, credentials, `eas submit` to App Store Connect. Add **`eas.json`**, run **`eas build:configure`**, link Apple Developer + App Store Connect (API key or Apple ID). |
| **Xcode Archive** | Local: open **`ios/*.xcworkspace`**, set scheme to **Release**, **Product → Archive**, **Distribute App → App Store Connect → Upload**. Matches Flutter-era muscle memory; you must manage signing manually. |

Bundle ID in **`app.config.js`** is **`com.yasalaser.tap`** — must match the **App ID** in Apple Developer and the app record in **App Store Connect**.

### Key items checklist (before first upload)

**Apple & Connect**

- [ ] **Apple Developer Program** membership active (**$99/yr**).
- [ ] **App Store Connect** → **My Apps** → create (or link) the **T.A.P** app with bundle ID **`com.yasalaser.tap`**.
- [ ] **Signing:** iOS **Distribution** certificate + **App Store** provisioning profile (or let **EAS** create/manage them).
- [ ] Increment **marketing version** (`expo.version` in **`app.config.js`**) and **build number** (`ios.buildNumber` or EAS auto-increment) for **each** upload TestFlight expects a new build number).

**Expo / project**

- [ ] Add **`eas.json`** and run a **release** iOS build (`production` profile or equivalent) so **`SKIP_BUNDLING`** is not used and JS is embedded for store builds.
- [ ] **Secrets / env:** configure **EAS** environment variables (or Xcode scheme) for **`EXPO_PUBLIC_SUPABASE_URL`**, **`EXPO_PUBLIC_SUPABASE_ANON_KEY`**, and **`EXPO_PUBLIC_SUPABASE_AUTH_REDIRECT_URL`** if email magic links are enabled — pointed at the **same** Supabase project testers will use.
- [ ] Confirm **custom URL scheme** **`tap`** and Supabase **Redirect URLs** allow tester sign-in (see **Before production: Supabase email confirmation** above).

**Compliance & metadata**

- [ ] **Privacy** in App Store Connect: **nutrition labels** and **encryption** questionnaire (most Expo apps: HTTPS only → exempt or standard answers per Apple flow).
- [ ] **Photo library** (and camera if added): usage strings already driven by **`expo-image-picker`** in **`app.config.js`**; verify copy is acceptable for review.
- [ ] **Large app / Core ML:** the bundled **`.mlpackage`** increases IPA size — warn testers (“download on Wi‑Fi”); acceptable for beta.

**TestFlight**

- [ ] Upload build to **App Store Connect** (Transporter, `eas submit`, or Xcode Organizer).
- [ ] **Internal testing** (fast, up to **100** users on the team) for smoke tests; then **External testing** if you need outside emails (**Beta App Review** required for first external group).
- [ ] Add **What to Test** notes: e.g. Skin analyzer is **demonstration / non-diagnostic**; known limitations until model v2.

**Post-POC (not blocking TestFlight)**

- [ ] Train and export **production** weights in **`skin_analyzer_model`**; swap **`pigment_segmentation.mlpackage`**; optionally hide Quick Action until you are happy with metrics.
- [ ] Apply **`007_condition_service_map`** and wire **recommended treatments** from Supabase (see Face map & skin analyzer checklist below).

### Reference

- Expo: [Submit to App Store](https://docs.expo.dev/submit/ios/), [EAS Build](https://docs.expo.dev/build/introduction/).
- Older **Flutter** checklist (signing concepts still useful): [`../tap_app/docs/TESTFLIGHT_DEPLOYMENT_GUIDE.md`](../tap_app/docs/TESTFLIGHT_DEPLOYMENT_GUIDE.md).

## Calendar, appointments & EMR integration (strategy)

**Goal:** Patients often book their **next** visit when leaving the clinic. The app needs **upcoming** items on the home screen and a **Calendar** that mixes **logged treatments** (historical procedures) with **scheduled visits** stored in Postgres.

### Data model (Expo + Supabase)

- Table **`appointments`** (migration **`006_appointments.sql`**) holds user-scoped rows: **Consult** (first-time / evaluation) or **Treatment** (scheduled service), optional **injectable / laser** modality for treatment visits, **service type** and **brand** aligned with the treatment form catalogs, **scheduled_at**, optional **duration**, **provider**, **notes**, **status** (`scheduled` \| `cancelled` \| `completed`), and **`external_ref`** for ids from outside systems.
- **RLS:** users can only read/write their own rows (`user_id = auth.uid()`).
- The **Dashboard** loads the next few **`scheduled`** appointments **after now** for an **Upcoming appointments** section.
- The **Calendar** screen loads **all** appointments (for history/cancelled later if needed) and **treatments**, grouped by calendar day.

### Product behavior

- **Consult** is a first-class visit type (typical for new patients).
- **Treatment** reuses the same catalog-driven patterns as **New treatment** (service type, brand/device fields) but represents a **future** booking, not a completed log line in **`treatments`**.
- **Appointment detail (mobile):** users can **cancel** (`status = cancelled`), **mark completed** (consult-only or when not logging a procedure), or **Log treatment from this visit** → **New treatment** with date/provider (and treatment-style fields when applicable) prefilled; a successful online save sets **`appointments.status = completed`**. Offline-queued treatment saves do not auto-complete the linked appointment.

### EMR / clinic scheduling (future API)

- A **server-side API** (or Supabase **Edge Function** with service role) can accept webhooks or polls from an **EMR / scheduling** product when a patient **confirms** an appointment.
- That API should **upsert** into **`public.appointments`** for the matching **`user_id`** (resolved via mapped patient id or email), set **`external_ref`** to the EMR encounter id, and set **`scheduled_at`** / metadata from the EMR payload so the mobile app’s calendar updates without manual entry.
- **Security:** never expose the service role key in the app; only the backend or Edge Function should insert cross-system rows, or use **RLS-safe** patterns with user JWT if the EMR integration is per-user OAuth.

### Documentation

- Schema: **[SUPABASE_SCHEMA.md](./SUPABASE_SCHEMA.md)** (`appointments` section).
- Apply migration: **[SUPABASE_SETUP.md](./SUPABASE_SETUP.md)** step **006**.

## Treatment photos (New / Edit treatment)

**Where:** **[`/treatments/new`](../app/(app)/treatments/new.tsx)** (“New Treatment”) and **[`/treatments/edit/[id]`](../app/(app)/treatments/edit/[id].tsx)**. Users attach images from the **photo library** (`expo-image-picker`), up to **six** per treatment, with thumbnails and remove-before-save in the form.

**After a successful online save, photos are not device-only.** The app uploads each file to Supabase **Storage** bucket **`treatment-photos`** (private; object paths like `{user_id}/{treatment_id}/{uuid}.{ext}`), then stores those **storage paths** in Postgres on **`treatments.photo_urls`**. Detail views resolve paths to **time-limited signed URLs** for display. Schema and RLS: **[SUPABASE_SCHEMA.md](./SUPABASE_SCHEMA.md)** (`photo_urls`, `treatment-photos` bucket). Implementation details and Flutter parity notes: **[SCREEN_PARITY.md](./SCREEN_PARITY.md)** (Treatments list row), **[EXPO_ROUTES.md](./EXPO_ROUTES.md)** (`new_treatment_page`).

**Offline / sync:** Adding or removing treatment photos **requires an online connection**; if the device is offline, save fails with a clear error (local picker URIs are **not** queued on the outbox—only already-uploaded storage paths could theoretically be replayed, and the create path does not persist new local picks offline). A **treatment with no new photo work** can still be **queued offline** like other writes. Appointment-linked flows: completing an appointment after **“Log treatment from this visit”** only auto-marks **`completed`** when the save finishes **online**; see Calendar section above.

**Contrast:** **[Skin analyzer](./SKIN_ANALYZER_WORKFLOW.md)** (`/skin-analyzer`) runs **on-device** on a picked image and does **not** upload that analysis image to Supabase by default—treatment photos are a **separate**, cloud-backed attachment flow.

## Face map & skin analyzer (on-device)

**Goal:** Offer **pigmentation segmentation** and related **progress-style metrics** aligned with the sibling **`skin_analyzer_model`** project (capture → preprocess → **CoreML** on iOS → overlay / percentages). This is a **separate track** from Supabase CRUD: it requires **native iOS** code and typically **Expo development builds**, not Expo Go alone.

**Phasing vs TestFlight POC:** The **first TestFlight** build is meant for **test users to review the app** (flows, Skin analyzer **demo** quality, privacy). **Training the proper / multi-class model** and tightening **clinical** validation come **after** that POC — see **TestFlight & iOS beta** above and **`skin_analyzer_model`** / **[SKIN_ANALYZER_WORKFLOW.md](./SKIN_ANALYZER_WORKFLOW.md)** Phase **D**.

### Product intent

- **Face Map** (`/face-map`): remains a **lightweight shell / roadmap** surface for treatment-planning context.
- **Face / Skin Analyzer** (`/skin-analyzer`): dedicated entry for **on-device analysis** once the native module and **`pigment_segmentation.mlpackage`** are wired.

### Technical references (canonical)

| Document | Location |
|----------|----------|
| iOS app integration (end-to-end flow, preprocessing, metrics) | [`../../skin_analyzer_model/docs/IOS_APP_INTEGRATION.md`](../../skin_analyzer_model/docs/IOS_APP_INTEGRATION.md) |
| CoreML export, Xcode embedding, Vision pipeline | [`../../skin_analyzer_model/docs/IOS_DEPLOYMENT.md`](../../skin_analyzer_model/docs/IOS_DEPLOYMENT.md) |

### Current state

- **Model repo:** Use **current export** for **TestFlight POC**; **retrain / multi-class exclusive** labels **after** tester feedback and data readiness (see **[SKIN_ANALYZER_IOS_DESIGN.md](./SKIN_ANALYZER_IOS_DESIGN.md)**).
- **Expo app:** Local module **`tap-skin-analyzer`** runs Core ML on iOS; **`/skin-analyzer`** uses image picker + mask + **exclusive-condition preview** (stub %) + **recommended treatments** (stub list) until Supabase-backed rules ship. **TestFlight testers** should treat outputs as **non-diagnostic demos**.
- **Catalog data:** Migration **[`007_condition_service_map.sql`](../supabase/migrations/007_condition_service_map.sql)** defines **`condition_service_map`** (`condition_key` → **`service_types`** + optional **`laser_types`**). Apply via **[SUPABASE_SETUP.md](./SUPABASE_SETUP.md)**; schema sketch in **[SUPABASE_SCHEMA.md](./SUPABASE_SCHEMA.md)**.

### Implementation checklist (Expo repo)

- **Commands & ordering:** **[SKIN_ANALYZER_WORKFLOW.md](./SKIN_ANALYZER_WORKFLOW.md)** (train → export → Xcode → bridge).
- **Architecture:** **[SKIN_ANALYZER_IOS_DESIGN.md](./SKIN_ANALYZER_IOS_DESIGN.md)**.

- [x] Add **`expo-dev-client`** and **prebuild** scripts (run **`npm run prebuild:ios`** when ready).
- [x] Bundle **`pigment_segmentation.mlpackage`** in the iOS target (dev workflow); re-apply after `prebuild --clean` if needed.
- [x] **`tap-skin-analyzer`** Expo Module — **`analyzePigmentation(imageUri)`** (Core ML, 512×512).
- [x] **`skin-analyzer`** screen: image picker → native inference → pigmented-area % → mask → by-condition card (preview stubs) → **recommended treatments** (stub).
- [ ] **Apply `007_condition_service_map`** to Supabase; curate / expand seed rows per clinical protocol.
- [ ] **Repository + use case:** fetch active `condition_service_map` joined with **`service_types`** / **`laser_types`** (cached catalog bundle); map `condition_key` + optional **`severity_band`** (when model exports severities) to ordered recommendations.
- [ ] Replace **`stubRecommendedTreatments`** with remote-driven list on **`/skin-analyzer`**; keep offline fallback or empty state + copy.
- [ ] **Multi-class model** + real `conditions[]` from native — **post–TestFlight POC**; then drive recommendations from **actual** area / severity per class (thresholds in app or DB).
- [ ] (Optional) Feature flag or remote config to hide the Quick Action until a build includes the module.
- [ ] **Android:** stub or alternate stack; CoreML is **iOS-only**.
- [ ] **TestFlight:** release iOS build + App Store Connect upload — use checklist in **TestFlight & iOS beta** above (add **`eas.json`** if using EAS).

### Migration plan alignment

See **[MIGRATION_PLAN.md](./MIGRATION_PLAN.md)** — **Planned capability — Skin analyzer**.

## Current Implementation Status

### ✅ Completed Features

**Settings Page Structure:**
- Account section
- Preferences section  
- About section
- Actions section

**Functional Features:**
1. **Logout** - Signs user out and returns to login page
   - Confirmation dialog before logout
   - Clears Firebase Auth session
   - Removes all navigation history
   - Error handling for failed logout

2. **Close App** - Exits the application
   - Confirmation dialog before closing
   - Uses `SystemNavigator.pop()`
   - Works on iOS and Android

**Navigation:**
- Accessible from Profile page settings icon (gear)
- Uses MaterialPageRoute for consistency
- Back button returns to Profile page

## Planned Features (Coming Soon)

### Account Management

**Profile Settings** (High Priority)
- Edit first name and last name
- Update email address
- Change profile photo
- View account creation date
- Display user ID

**Change Password** (High Priority)
- Current password verification
- New password with strength indicator
- Confirm new password
- Password requirements display
- Success/error feedback

**Delete Account** (Low Priority)
- Permanent account deletion
- Data export before deletion
- Confirmation with password
- 30-day grace period option
- Email confirmation

### Preferences

**Dark Mode** (High Priority)
- Toggle between light and dark themes
- System theme option (follow device)
- Smooth theme transition
- Save preference to local storage
- Apply across entire app

**Implementation Plan:**
```dart
// 1. Create ThemeProvider
class ThemeProvider extends ChangeNotifier {
  ThemeMode _themeMode = ThemeMode.system;
  
  ThemeMode get themeMode => _themeMode;
  
  void setThemeMode(ThemeMode mode) {
    _themeMode = mode;
    notifyListeners();
    // Save to SharedPreferences
  }
}

// 2. Update MaterialApp
MaterialApp(
  themeMode: themeProvider.themeMode,
  theme: ThemeData.light(),
  darkTheme: ThemeData.dark(),
)

// 3. Settings toggle
Switch(
  value: themeMode == ThemeMode.dark,
  onChanged: (value) {
    provider.setThemeMode(
      value ? ThemeMode.dark : ThemeMode.light
    );
  },
)
```

**Notifications** (High Priority)
- Treatment reminders (1 day before, 1 week before)
- Appointment notifications
- New feature announcements
- Marketing communications toggle
- Push notification permissions
- Email notification preferences

**Language Selection** (Medium Priority)
- English (default)
- Spanish
- French
- Other languages as needed
- Save preference to Firestore
- Restart required notification

**Units Preference** (Medium Priority)
- Metric (mL, cm)
- Imperial (oz, in)
- Apply to all measurements
- Save to user profile

### About & Legal

**About T.A.P** (Medium Priority)
- App name: "The Aesthetic Passport"
- Version number (from pubspec.yaml)
- Build number
- YasaLaser branding
- Credits and acknowledgments
- Contact information

**Privacy Policy** (High Priority)
- Full privacy policy text
- Scrollable viewer
- Last updated date
- HIPAA compliance information
- Data collection practices
- Third-party services disclosure

**Terms & Conditions** (High Priority)
- Link to existing TermsAndConditionsPage
- Full terms text
- Last updated date
- User agreement acknowledgment
- Medical disclaimer

**Help & Support** (Medium Priority)
- FAQ section
- Contact support form
- Email: support@yasalaser.com
- Phone number
- Live chat (future)
- Tutorial videos

**App Version & Updates** (Low Priority)
- Current version display
- Check for updates button
- What's new in this version
- Update history
- Force update notification

### Data Management

**Export Data** (Medium Priority)
- Export all treatments as CSV
- Export as PDF report
- Include photos (optional)
- Email export to user
- Cloud storage backup

**Backup & Restore** (Medium Priority)
- Manual backup to cloud
- Automatic backup schedule
- Restore from backup
- Backup history
- Storage usage display

**Clear Cache** (Low Priority)
- Clear image cache
- Clear temporary files
- Clear local database cache
- Keep user data intact
- Display cache size

**Data Usage Statistics** (Low Priority)
- Total treatments logged
- Storage used
- Photos stored
- Data sync status
- Last backup date

## Implementation Priority

### Phase 1 (Next Sprint)
1. Change Password functionality
2. Dark Mode implementation
3. Privacy Policy viewer
4. Terms & Conditions linking

### Phase 2 (Following Sprint)
1. Notification preferences
2. Profile Settings editor
3. Help & Support section
4. About T.A.P page

### Phase 3 (Future)
1. Export Data functionality
2. Language selection
3. Backup & Restore
4. Delete Account

## Technical Requirements

### Dependencies Needed
```yaml
dependencies:
  # Theme management
  provider: ^6.0.0
  shared_preferences: ^2.2.0
  
  # Notifications
  firebase_messaging: ^14.6.0
  flutter_local_notifications: ^15.1.0
  
  # Data export
  csv: ^5.0.0
  pdf: ^3.10.0
  path_provider: ^2.1.0
  share_plus: ^7.0.0
```

### Files to Create
- `lib/core/theme/theme_provider.dart`
- `lib/core/theme/app_theme.dart`
- `lib/features/settings/presentation/pages/change_password_page.dart`
- `lib/features/settings/presentation/pages/profile_settings_page.dart`
- `lib/features/settings/presentation/pages/notification_settings_page.dart`
- `lib/features/settings/presentation/pages/about_page.dart`
- `lib/features/settings/presentation/pages/privacy_policy_page.dart`
- `lib/features/settings/presentation/pages/help_support_page.dart`

### State Management
- Use Provider for theme management
- SharedPreferences for local settings
- Firestore for user preferences (sync across devices)

## User Experience Considerations

### Confirmation Dialogs
- All destructive actions require confirmation
- Clear messaging about consequences
- Cancel option always available
- Red color for dangerous actions

### Loading States
- Show loading indicators for async operations
- Disable buttons during processing
- Timeout handling for network requests

### Error Handling
- User-friendly error messages
- Retry options for failed operations
- Log errors for debugging
- Graceful degradation

### Accessibility
- Screen reader support
- High contrast mode compatibility
- Large touch targets
- Clear labels and descriptions

## Security Considerations

### Password Changes
- Require current password
- Enforce password strength requirements
- Rate limiting for failed attempts
- Email notification of password change

### Account Deletion
- Require password confirmation
- Email verification
- Grace period before permanent deletion
- Data export option before deletion

### Data Export
- Encrypted export files
- Secure email transmission
- Temporary download links
- Automatic cleanup of exports

## Testing Checklist

### Functional Testing
- [ ] Logout successfully signs out user
- [ ] Close app exits application
- [ ] Dark mode toggles correctly
- [ ] Settings persist across app restarts
- [ ] Confirmation dialogs appear for destructive actions
- [ ] Navigation works correctly
- [ ] All "Coming Soon" features show placeholder

### UI Testing
- [ ] Settings page scrolls smoothly
- [ ] All sections are properly styled
- [ ] Icons are consistent
- [ ] Text is readable
- [ ] Cards have proper spacing
- [ ] Buttons are appropriately sized

### Integration Testing
- [ ] Settings sync with Firestore
- [ ] Theme changes apply app-wide
- [ ] Notifications work correctly
- [ ] Data export generates valid files
- [ ] Backup/restore works correctly

## Future Enhancements

### Advanced Features
- Two-factor authentication
- Biometric settings management
- App lock with PIN/biometric
- Session timeout configuration
- Data retention policies
- GDPR compliance tools

### Analytics
- Track feature usage
- Monitor settings changes
- Identify popular preferences
- A/B testing for UI improvements

### Integrations
- Apple Health integration settings
- Google Fit integration settings
- Third-party app connections
- API key management for developers
