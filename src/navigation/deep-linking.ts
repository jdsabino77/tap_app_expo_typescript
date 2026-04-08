/**
 * Deep linking
 *
 * Scheme: `tap://` (see `app.config` / `expo.scheme`).
 * Expo Router builds paths from `app/`; groups like `(app)` are omitted from URL paths.
 *
 * **Canonical route table:** `docs/EXPO_ROUTES.md`
 *
 * Examples (when universal links are configured later):
 * - `tap:///login` → `/(auth)/login`
 * - `tap:///treatments` → treatments list
 * - `tap:///calendar` → calendar (treatments + scheduled appointments)
 * - `tap:///appointments/new` → new appointment
 * - `tap:///skin-analyzer` → skin analyzer shell (CoreML TBD)
 *
 * No custom URL policies are required for the POC; extend when adding marketing
 * links or EMR handoff URLs post-POC.
 */
export const LINKING_SCHEME = "tap";
