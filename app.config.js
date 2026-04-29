/**
 * Expo config. Supabase keys can be set here (no .env) or via optional `supabase.local.json`.
 * Email confirmation: set `EXPO_PUBLIC_SUPABASE_AUTH_REDIRECT_URL` to a URL allowed in the Supabase
 * dashboard (see docs/SUPABASE_SETUP.md). If unset, `tap://…/auth/callback` is generated for native builds.
 */
// Optional inline dev values (you can paste URL + anon key here instead of using a file):
const INLINE_SUPABASE_URL = "";
const INLINE_SUPABASE_ANON_KEY = "";

let fromLocalFile = { url: "", anonKey: "" };
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  fromLocalFile = require("./supabase.local.json");
} catch {
  /* optional — copy supabase.local.json.example */
}

const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  fromLocalFile.url ||
  INLINE_SUPABASE_URL ||
  "";
const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  fromLocalFile.anonKey ||
  INLINE_SUPABASE_ANON_KEY ||
  "";

/** Optional: fixed redirect for email confirmation / magic links (must match Supabase “Redirect URLs”). */
const authEmailRedirectUrl = process.env.EXPO_PUBLIC_SUPABASE_AUTH_REDIRECT_URL || "";

module.exports = {
  expo: {
    name: "DermaPass",
    slug: "tap-app-expo-typescript",
    version: "1.0.1",
    icon: "./assets/branding/app-icon.png",
    orientation: "portrait",
    scheme: "tap",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    splash: {
      image: "./assets/branding/splash-logo.jpg",
      resizeMode: "contain",
      backgroundColor: "#1A2332",
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.yasalaser.tap",
      /** CFBundleVersion; EAS bumps this when `eas.json` uses `appVersionSource: remote` + `autoIncrement`. */
      buildNumber: "1",
      /** Home screen label under the icon (committed `ios/` uses Info.plist; keep in sync). */
      infoPlist: {
        CFBundleDisplayName: "DermaPass",
      },
    },
    android: {
      package: "com.yasalaser.tap",
      adaptiveIcon: {
        foregroundImage: "./assets/branding/app-icon.png",
        backgroundColor: "#1A2332",
      },
    },
    plugins: [
      "expo-router",
      "@react-native-community/datetimepicker",
      "expo-dev-client",
      "expo-secure-store",
      "expo-sqlite",
      [
        "expo-image-picker",
        {
          photosPermission: "Allow $(PRODUCT_NAME) to attach photos to your treatments.",
        },
      ],
      "expo-screen-orientation",
    ],
    extra: {
      eas: {
        projectId: "84c71973-11ba-46c9-a35a-21c6673c24f0",
      },
      supabaseUrl,
      supabaseAnonKey,
      authEmailRedirectUrl,
    },
  },
};
