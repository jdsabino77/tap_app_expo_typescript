# Styling and themes (T.A.P Expo)

This document describes **how styling works in the app today**: where colors and type are defined, how navigation chrome is set, and how to change them safely for releases (including beta). It is maintainer documentation, not a product spec.

---

## 1. Layout of the styling system

| Layer | File | Role |
|--------|------|------|
| **Color tokens** | [`src/theme/tokens.ts`](../src/theme/tokens.ts) | Single source for hex/RGBA primitives (`primaryNavy`, `primaryGold`, `lightGray`, text steps, borders, overlays). |
| **Themes (bundles)** | [`src/theme/theme.ts`](../src/theme/theme.ts) | `lightTheme` and `darkTheme`: each bundles `colors` (tokens plus aliases like `background`), `spacing`, `radii`, `typography`, and `component` (app bar, buttons, cards). |
| **Barrel export** | [`src/theme/index.ts`](../src/theme/index.ts) | Re-exports tokens and theme objects. Screens usually `import { colors }` or `import { colors, lightTheme }`. |

Runtime theme switching is now available through a `ThemeProvider` (`light`, `dark`, `system`) with persisted user preference. Theme selection is exposed in Settings and resolves against device appearance when `system` is selected.

---

## 2. Changing colors

1. **Global brand / neutrals** — Edit [`src/theme/tokens.ts`](../src/theme/tokens.ts). Prefer semantic names (`textPrimary`, `borderSubtle`) over adding one-off hex in random screens.
2. **Derived / overlay tokens** — `primaryGoldMutedBg`, `onNavyMuted`, `overlayScrim`, etc. live in the same file. If you change `primaryGold`, consider whether the rgba-derived entries still look correct.
3. **Per-screen exceptions** — Allowed for one-offs, but repeated values should be moved into `tokens.ts` or into `lightTheme.colors` in [`theme.ts`](../src/theme/theme.ts).

`lightTheme.colors` spreads `colors` and adds aliases used in structured UI:

- `surface` — white card / sheet background  
- `background` — page background (`lightGray`; matches dashboard and auth flows)  
- `inputBorder` / `inputBorderFocused`

Changing `lightTheme.colors.background` affects any code that references `lightTheme.colors.background` (for example the Welcome screen). Most screens still reference `colors.lightGray` directly; those stay in sync as long as `lightTheme.colors.background` continues to map to `colors.lightGray` in [`theme.ts`](../src/theme/theme.ts).

---

## 3. Typography and fonts

**Today:** Type is **system default** (React Native / iOS / Android). Sizes and weights are set in:

- Individual screen `StyleSheet`s (many components use explicit `fontSize` / `fontWeight` with `colors.*`).
- [`lightTheme.typography`](../src/theme/theme.ts) and [`darkTheme.typography`](../src/theme/theme.ts) for headings, body, labels, and hints.

**To adjust the “design system” scale** for light mode, edit `lightTheme.typography` in [`src/theme/theme.ts`](../src/theme/theme.ts). **To introduce a custom font** (e.g. via `expo-font`), load it at the app root, then add `fontFamily` to the typography objects (and any legacy screen styles you care to migrate).

**Navy full-bleed screens:** [`textOnNavy`](../src/theme/theme.ts) holds white/gold typography for screens that use `primaryNavy` as the full background (currently aligned with splash-style layouts).

---

## 4. Navigation chrome (headers and stack background)

| Location | What it controls |
|----------|------------------|
| [`app/_layout.tsx`](../app/_layout.tsx) | Root `Stack`: `contentStyle.backgroundColor` defaults the outer stack to `colors.lightGray`. |
| [`app/(app)/_layout.tsx`](../app/(app)/_layout.tsx) | Signed-in stack: `headerTintColor: colors.primaryNavy` (back button and header button tint). |
| [`app/(auth)/_layout.tsx`](../app/(auth)/_layout.tsx) | Auth stack: default stack header (title, back). Individual screens can override via `navigation.setOptions`. |
| Nested stacks | e.g. [`app/(app)/treatments/_layout.tsx`](../app/(app)/treatments/_layout.tsx) — same tint pattern where present. |

To **change the primary header accent** globally for the main app, update `headerTintColor` in the relevant `Stack` `screenOptions`. To **change the default page background** behind screens, adjust root `contentStyle` and/or each screen’s root `backgroundColor` to match `colors.lightGray` / `lightTheme.colors.background`.

---

## 5. Named themes (`theme_1`, `theme_2`) in this repo

In code, **two named bundles** are defined:

| Name in docs / mental model | Export in code | Typical use in this project |
|------------------------------|----------------|-----------------------------|
| **theme_1** (default light) | `lightTheme` in [`theme.ts`](../src/theme/theme.ts) | Dashboard, auth (login/signup), Welcome, most forms: `lightGray` canvas, navy/gold accents. |
| **theme_2** | `darkTheme` in [`theme.ts`](../src/theme/theme.ts) | Structured dark palette for parity with Flutter `darkTheme`; import where needed—**not** wired app-wide. |

The app now uses a runtime `ThemeProvider` from [`src/store/theme.tsx`](../src/store/theme.tsx) and a Settings appearance selector. New screens should consume the resolved theme through that provider instead of hardcoding `lightTheme`.

---

## 6. Checklist: new screen or large UI change

1. **Background** — Use `colors.lightGray` or `lightTheme.colors.background` for main scroll/surface area unless the design is intentionally full-bleed navy (rare; see splash).  
2. **Text** — Prefer `colors.textPrimary` / `colors.textSecondary` / `colors.textLight`, or spreads from `lightTheme.typography`.  
3. **Primary actions** — Gold fill (`colors.primaryGold` or `lightTheme.component.elevatedButton`) with navy or dark text for contrast as elsewhere.  
4. **Avoid** — New raw hex scattered across the screen when a token already exists.  
5. **Headers** — If the screen lives under a stack, confirm `headerTintColor` and title readability match sibling screens.

---

## 7. Related docs

- Product-oriented settings ideas (notifications, language, etc.) live in [`SETTINGS_FEATURES.md`](SETTINGS_FEATURES.md); styling **maintenance** for beta should treat this file (`STYLING_AND_THEMES.md`) as the source of truth for tokens and theme bundles.
