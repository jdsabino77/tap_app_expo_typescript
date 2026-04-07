/**
 * Expo config. Supabase keys can be set here (no .env) or via optional `supabase.local.json`.
 * For email confirmation testing: leave keys here or in supabase.local.json, enable "Confirm email" in Supabase Auth.
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

module.exports = {
  expo: {
    name: "T.A.P",
    slug: "tap-app-expo-typescript",
    version: "1.0.1",
    orientation: "portrait",
    scheme: "tap",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.yasalaser.tap",
    },
    android: {
      package: "com.yasalaser.tap",
    },
    plugins: ["expo-router", "expo-secure-store"],
    extra: {
      supabaseUrl,
      supabaseAnonKey,
    },
  },
};
