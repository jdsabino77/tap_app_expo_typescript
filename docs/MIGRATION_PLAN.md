# Migration plan: Flutter `tap_app` → Expo TypeScript

This document is the **single working checklist** for the rebuild. Complete phases **in order**; within a phase, prefer **one screen or one vertical slice** before moving on.

---

## Guiding rules

1. **One thing at a time** — merge only when the app still launches and the previous phase still works.
2. **Source of truth** — Flutter code under `../tap_app`; this repo is the TypeScript implementation.
3. **Stub early** — any native capability you will not wire in the current sprint gets a **typed stub module** (no silent failures in call sites).
4. **Parity over cleverness** — match behavior and data shapes first; refactor UX after core flows work.

---

## Phase 1 — Analyze Flutter project structure

**Goal:** Know where logic, UI, and side effects live before copying concepts into TypeScript.

| Task | Done |
|------|------|
| Confirm entry and bootstrap (`main.dart`: Hive, Firebase, `ContentService`) | ☐ |
| Map each feature folder under `lib/features/*` to a future `app/` or `src/features/*` area | ☐ |
| List all `core/services/*` and what they call (Firebase, Hive, platform APIs) | ☐ |
| Trace auth entry: `LoginPage` as `home`; document `pushReplacement` targets (dashboard vs. signup, etc.) | ☐ |
| Note largest / riskiest screens (`new_treatment_page`, `dashboard`, etc.) for later ordering | ☐ |
| Capture asset list (`assets/icon/`, any images/fonts) for porting | ☐ |

**Deliverable:** Keep [FLUTTER_INVENTORY.md](./FLUTTER_INVENTORY.md) updated when you discover new modules or change assumptions.

---

## Phase 2 — Extract data models and business logic

**Goal:** Shared TypeScript types and pure (or testable) logic **without** depending on final UI.

| Task | Done |
|------|------|
| Port Dart models (e.g. `medical_profile.dart`, `provider.dart`) to TypeScript interfaces/types + validators if needed | ☐ |
| Document Firestore document paths and field names from services (`*_service.dart`) | ☐ |
| Extract calculations, mappers, and constants that are not widget-specific into `src/domain` or `src/lib` | ☐ |
| Decide state approach (e.g. Zustand + hooks) and where each “bloc” boundary from Flutter maps | ☐ |
| Add minimal unit tests for serializers and pure functions where Flutter had implicit assumptions | ☐ |

**Rule:** UI components import from these modules; avoid duplicating shape definitions in screens.

---

## Phase 3 — Recreate navigation in Expo Router

**Goal:** File-based routes that reflect **stacks and auth gating**, matching the Flutter navigation graph.

| Task | Done |
|------|------|
| Scaffold Expo Router: `app/_layout.tsx`, group layouts e.g. `(auth)` vs. `(app)` | ☐ |
| Map Flutter stacks: splash/welcome/login/signup → auth group; post-login → tabs or stack | ☐ |
| Replace `Navigator.push` flows with `router.push`, modal routes, or nested stacks as appropriate | ☐ |
| Handle `pushAndRemoveUntil`-style resets (e.g. logout in settings) with `router.replace` / dismissAll patterns | ☐ |
| Deep-link parity: only add URLs where product needs them; document in code comments | ☐ |

**Note:** Flutter currently uses imperative navigation, not `go_router`. Expo Router should encode the **intended** product IA, which may tidy overlapping patterns.

---

## Phase 4 — Port shared utilities

**Goal:** One implementation per concern (dates, IDs, formatting, errors, networking hints).

| Task | Done |
|------|------|
| Date/number formatting (`intl` → chosen TS libs); keep timezone behavior explicit | ☐ |
| UUID generation; secure random if needed for tokens | ☐ |
| HTTP/Firebase error mapping to user-visible messages (mirror Flutter `debugPrint` vs. UI errors) | ☐ |
| Connectivity: subscribe in a small module; expose hook or store | ☐ |
| Theme tokens from `app_theme.dart` → theme object (colors, typography, spacing) | ☐ |

---

## Phase 5 — Rebuild one screen at a time

**Goal:** Vertical slices that connect navigation → UI → services → Firestore/Hive substitutes.

Suggested **order** (adjust if product priority differs):

1. Splash / auth shell (if retained) — align with Expo Router redirects  
2. Login / signup / welcome  
3. Dashboard (hub for other pushes)  
4. Treatment list → detail → new treatment (largest surface; split sub-flows if needed)  
5. Face map  
6. Providers list → add provider  
7. Medical profile  
8. Calendar  
9. Settings (logout / reset navigation)  
10. Terms and conditions  

| Task | Done |
|------|------|
| Define “done” per screen: loads data, handles empty/error, matches critical Flutter actions | ☐ |
| Copy assets and strings as needed per screen | ☐ |
| Track deviations from Flutter in a short `docs/SCREEN_PARITY.md` (optional, add when first gap appears) | ☐ |

---

## Phase 6 — Stub unsupported native plugins early

**Goal:** No crashes from missing native modules; clear TODOs for real implementations.

| Task | Done |
|------|------|
| Create `src/native-stubs/` (or similar) with typed facades: `localAuth`, `permissions`, `storage`, etc. | ☐ |
| Each stub: same async API as the real module; return safe defaults or throw a **`NotImplementedError` with message** in dev if misused | ☐ |
| Replace stubs with Expo modules incrementally (`expo-local-authentication`, `expo-image-picker`, etc.) | ☐ |
| Document Firebase choice: **JS SDK vs. React Native Firebase** and EAS build profiles | ☐ |
| List Hive replacements per service (`preferences_service` → AsyncStorage/MMKV, etc.) | ☐ |

---

## Dependency checklist (high level)

When you bootstrap the Expo app, verify these areas have an owner:

- [ ] Firebase (Auth, Firestore, Storage, Analytics)  
- [ ] Offline / local persistence (Hive parity)  
- [ ] Biometrics  
- [ ] Image pick / display  
- [ ] Network status  
- [ ] Legal/content bootstrap (`ContentService` equivalent)  

---

## Version alignment

Track parity with the Flutter app version in this repo’s `package.json` or `app.config` notes (Flutter reference: **1.0.1+4** at time of inventory).

---

## Changelog

| Date | Change |
|------|--------|
| 2026-04-06 | Initial plan and inventory from `tap_app` tree and `pubspec.yaml` |
