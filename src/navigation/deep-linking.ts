/**
 * Deep linking — Phase 3
 *
 * Scheme: `tap://` (see `app.json` → `expo.scheme`).
 * Expo Router builds paths from `app/`; groups like `(app)` are omitted from URLs.
 *
 * Examples (when universal links are configured later):
 * - `tap:///login` → `/(auth)/login`
 * - `tap:///treatments` → `/(app)/treatments`
 *
 * No custom URL policies are required for MVP; add `+native-intent` or
 * `expo-linking` config when marketing pages need to open specific screens.
 */
export const LINKING_SCHEME = "tap";
