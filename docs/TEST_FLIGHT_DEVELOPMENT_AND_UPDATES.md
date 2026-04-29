# TestFlight development and shipping (POC beta)

Operational runbook for **DermaPass by Yasa** (Expo): change the app, produce a **store-quality iOS binary**, upload to **App Store Connect**, and refresh **TestFlight** testers.

## Purpose and scope

- **In scope:** POC beta — signed builds distributed via **TestFlight**; testers install through the **TestFlight** app, not sideloaded Xcode installs.
- **Out of scope (here):** Public **App Store** release checklist, **Android** shipping, and deep **EAS Update** / OTA workflows. This repo’s **`production`** profile in [`eas.json`](../eas.json) does **not** set a `channel`, and **`expo-updates`** is not used. **Each meaningful release is a new native build** uploaded to App Store Connect.
- **Product / QA checklist:** Beta bar, compliance reminders, and feature scope live in **[SETTINGS_FEATURES.md](./SETTINGS_FEATURES.md)** (TestFlight & iOS beta, sections A–C).

## Prerequisites (one-time)

1. **Apple Developer Program** membership and access to **App Store Connect**.
2. **App record** in App Store Connect whose bundle ID matches the native app — **`com.yasalaser.tap`** (see Xcode / [`app.config.js`](../app.config.js); with a committed **`ios/`** tree, the identifier in native projects is authoritative; EAS may log that `ios.bundleIdentifier` from `app.config.js` is ignored).
3. **Expo account** and EAS CLI: `npx eas-cli login` (or global `eas login`).
4. **EAS project** linked by **`extra.eas.projectId`** under `expo.extra` in [`app.config.js`](../app.config.js). This project uses **dynamic** config — the CLI **cannot** auto-inject the project ID; keep it in sync if you recreate the EAS project.
5. **iOS credentials:** On first production build, either let **EAS** create/manage the distribution certificate and App Store provisioning profile, or configure an **App Store Connect API key** for non-interactive submits (see [EAS iOS credentials](https://docs.expo.dev/app-signing/app-credentials/)).
6. **Further reading:** [EAS Build](https://docs.expo.dev/build/introduction/), [Submit to App Store](https://docs.expo.dev/submit/ios/), [App versions / build numbers](https://docs.expo.dev/build-reference/app-versions/).

## Day-to-day development vs release builds

| Mode | When | Command / flow |
|------|------|----------------|
| **Local + dev client** | Fast JS/TS iteration, Metro, native module debugging | `npx expo start` with a **development build** installed on device. Build installers with **`npm run eas:build:ios:dev`** (`eas.json` → **`development`**, `developmentClient: true`). |
| **TestFlight / store** | What testers run; must match release signing and embedded bundle | **`npm run eas:build:ios`** → **`production`** profile: release configuration, JS embedded in the binary. |

Always validate risky changes (auth, photos, Core ML) on a **production-profile** build before expanding the beta audience.

## Config and secrets (what lands in the IPA)

1. **`EXPO_PUBLIC_*` at build time**  
   Production builds on EAS **do not** use your laptop’s `.env` unless you wire it. Set variables in the **EAS project** (Expo dashboard → Environment variables) for the environment EAS resolves for **`production`** builds, at minimum:

   - `EXPO_PUBLIC_SUPABASE_URL`
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
   - Optional: `EXPO_PUBLIC_SUPABASE_AUTH_REDIRECT_URL` (must match Supabase **Redirect URLs**, e.g. `tap://auth/callback`)

   Details: **[SUPABASE_SETUP.md](./SUPABASE_SETUP.md)** and **Supabase email confirmation** in [SETTINGS_FEATURES.md](./SETTINGS_FEATURES.md).

2. **Marketing vs build number**  
   - **Marketing version (user-visible):** `expo.version` in [`app.config.js`](../app.config.js) (e.g. `1.0.1`). Bump when you want a new **version** line in Settings / App Store.  
   - **iOS build number (`CFBundleVersion`):** [`eas.json`](../eas.json) uses **`appVersionSource: remote`** and **`autoIncrement: true`** on **`production`** so EAS can bump the build number between uploads without manual edits (see Expo [app versions](https://docs.expo.dev/build-reference/app-versions/)).

3. **Custom URL scheme**  
   Scheme **`tap`** is used for deep links (auth callbacks). Supabase and Apple **Associated Domains** / universal links (if added later) must stay aligned with what you ship.

## Native and Core ML changes

- **Skin analyzer:** Local module **`tap-skin-analyzer`**, **`pigment_segmentation.mlpackage`**, and **`ios/`** CocoaPods. After changing native code or Pod dependencies, run **`pod install`** in **`ios/`** and commit stable **`ios/`** + **`Podfile.lock`** changes when the project builds locally.
- **`app.config.js` plugins** (e.g. `expo-image-picker`, `expo-router`) can trigger **prebuild** behavior on EAS; the **production EAS build** is the reliable check for TestFlight parity when native or config plugins change.
- Workflow references: **[SKIN_ANALYZER_WORKFLOW.md](./SKIN_ANALYZER_WORKFLOW.md)**, **[SKIN_ANALYZER_IOS_DESIGN.md](./SKIN_ANALYZER_IOS_DESIGN.md)**.

## Ship a new build (checklist)

1. Land and **merge** changes on **`main`** (or whatever branch policy you use for beta).
2. Confirm **EAS production environment variables** for Supabase (and any other `EXPO_PUBLIC_*` your app reads).
3. **App icon (committed `ios/` tree):** If you change **app icon** or **splash** assets, or icons look wrong in TestFlight, ensure **`ios/TAPbyYasaLaser/Images.xcassets/AppIcon.appiconset/`** contains **`App-Icon-1024x1024@1x.png`** and it is **committed** (EAS only ships what git has). Alternatively run **`npm run prebuild:ios`** and commit any **new or updated** files under that `AppIcon.appiconset`. Source artwork for the store icon lives under **`assets/branding/`** (see `expo.icon` in [`app.config.js`](../app.config.js)). Run **`pod install`** in **`ios/`** only when native deps change — see [Native and Core ML changes](#native-and-core-ml-changes).
4. **`npm run eas:build:ios`** — wait until the build succeeds on [expo.dev](https://expo.dev) (fix credential or compile errors as prompted).
5. **Upload to App Store Connect**  
   - **`npm run eas:submit:ios`** (submits the **latest** **`production`** iOS build — matches `eas submit … --latest` in [`package.json`](../package.json)), or  
   - Download the **`.ipa`** / use **Transporter**, or submit from the Expo build page.
6. **App Store Connect**  
   - Wait for **processing** to finish.  
   - Assign the build to an **Internal testing** group (and **External** if needed — first external group may trigger **Beta App Review**).  
   - Update **What to Test** (e.g. skin analyzer is **non-diagnostic** / demo; known limitations).
7. **Smoke on device** using the same bar as **[SETTINGS_FEATURES.md](./SETTINGS_FEATURES.md)** section **A** (auth, core journeys, skin analyzer, photos, legal / About).

## TestFlight tester experience

- **Internal testers** (up to team limit on App Store Connect): fastest path after processing.  
- **External testers:** useful for non–App-Store-Connect emails; plan for possible **Beta App Review** on the first external group.  
- Tell testers the IPA can be large (Core ML asset); **Wi‑Fi** download is reasonable.

## Troubleshooting

| Issue | What to check |
|-------|----------------|
| **Dynamic `app.config.js`** | Any value EAS would normally write (e.g. `extra.eas.projectId`, future **`updates`**) must be added **by hand** in JS; auto-configure steps can fail silently or abort. |
| **Prompt to install `expo-updates` / EAS Update** | Current **`production`** profile has **no `channel`**. Say **no** unless you intentionally add **`expo-updates`**, `updates.url`, **`runtimeVersion`**, and (if needed) **`channel`** — see [EAS Update](https://docs.expo.dev/eas-update/introduction/). |
| **Email confirm / reset links fail** | Supabase **Redirect URLs** must exactly match the app’s **`redirectTo`** (e.g. `tap://auth/callback`). **Site URL** should be a real HTTPS landing if you use web fallbacks. |
| **Wrong Supabase in TestFlight** | Release binary was built **without** the right EAS **production** env vars; fix secrets and rebuild. |
| **Bundle ID mismatch** | Native **`ios/`** project wins over `app.config.js` when both exist — align Xcode, Apple portal, and App Store Connect. |
| **Blank / white app icon** (TestFlight list, home screen) | **`AppIcon.appiconset/Contents.json`** references **`App-Icon-1024x1024@1x.png`** but that file was missing from git — EAS built without real icon art. Add/commit that PNG (e.g. export from [`assets/branding/app-icon.png`](../assets/branding/app-icon.png) or the JPG source at 1024×1024). |

## Optional: Xcode Archive

You can also ship by opening **`ios/*.xcworkspace`**, **Archive**, and uploading via Organizer. Signing is manual. See the **Distribution path** table in [SETTINGS_FEATURES.md](./SETTINGS_FEATURES.md) and the legacy Flutter-oriented **[`../tap_app/docs/TESTFLIGHT_DEPLOYMENT_GUIDE.md`](../tap_app/docs/TESTFLIGHT_DEPLOYMENT_GUIDE.md)** for concepts that still apply (certificates, profiles, Connect).

## Related docs

- [SETTINGS_FEATURES.md](./SETTINGS_FEATURES.md) — beta scope, compliance, Supabase notes.  
- [BETA_POC_REVIEW_ITEMS.md](./BETA_POC_REVIEW_ITEMS.md) — App Store / tester follow-ups and deadlines from the POC.  
- [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) — backend and client configuration.  
- [SKIN_ANALYZER_WORKFLOW.md](./SKIN_ANALYZER_WORKFLOW.md) — model and iOS integration.
