# Flutter project inventory (`tap_app`)

Reference snapshot for migration planning. Paths are relative to `tap_app/lib/`.

## App metadata

| Item | Value |
|------|--------|
| Name | `tap_app` |
| Product | T.A.P by YasaLaser |
| SDK | Dart ^3.9.2 |
| Entry | `main.dart` (initializes Hive, Firebase, `ContentService`; `MaterialApp` home → `LoginPage`) |
| Declared routing | `go_router` in `pubspec.yaml`, but **disabled** in `main.dart`; navigation uses **imperative `Navigator`** |

## Feature layout (screens & modules)

| Area | Files |
|------|--------|
| Auth | `features/auth/presentation/pages/` — `splash_page`, `welcome_page`, `login_page`, `signup_page` |
| Dashboard | `features/dashboard/presentation/pages/dashboard_page.dart` |
| Treatments | `treatment_list_page`, `treatment_detail_page`, `new_treatment_page`, `face_map_page`; widgets in `editable_widgets.dart` |
| Providers | `providers_page`, `add_provider_page`; `data/providers_data.dart`; `models/provider.dart` |
| Profile | `medical_profile_page.dart`; `models/medical_profile.dart` |
| Calendar | `calendar_page.dart` |
| Settings | `settings_page.dart` |
| Legal | `terms_and_conditions_page.dart` |
| Core | `core/services/` — `auth_service`, `content_service`, `treatment_service`, `medical_profile_service`, `provider_service`, `preferences_service`, `user_roles_service` |
| Core UI | `core/theme/app_theme.dart`, `core/widgets/passport_logo.dart` |
| Firebase | `firebase_options.dart`, `core/firebase/firebase_options.dart` |

## Dependencies (`pubspec.yaml`) — migration hints

| Flutter | Role | Typical Expo / RN direction |
|---------|------|------------------------------|
| `flutter_bloc` + `equatable` | State | Context + hooks, Zustand, Jotai, or Redux Toolkit — pick one and mirror bloc boundaries |
| `firebase_*` | Auth, Firestore, Storage, Analytics | `@react-native-firebase/*` or Firebase JS SDK + Expo; align with EAS and platform needs |
| `hive` / `hive_flutter` | Local box storage | `expo-sqlite`, MMKV, AsyncStorage, or WatermelonDB — map by access patterns |
| `local_auth` | Biometrics | `expo-local-authentication` |
| `cached_network_image` | Images | `expo-image` |
| `image_picker` | Camera/gallery | `expo-image-picker` |
| `url_launcher` | URLs | `expo-linking` / `Linking.openURL` |
| `intl` | Dates/numbers | `date-fns`, `Intl` polyfill, or `luxon` |
| `uuid` | IDs | `uuid` (npm) |
| `connectivity_plus` | Network | `@react-native-community/netinfo` or `expo-network` |
| `permission_handler` | Permissions | `expo-*` permission APIs per feature |
| `crypto` | Hashing | `expo-crypto` or Node `crypto` patterns in secure contexts |

## Navigation reality (today)

`main.dart` sets `home: LoginPage`. Flows use `Navigator.push`, `pushReplacement`, `pushAndRemoveUntil`, and `pop`. When recreating **Expo Router**, treat this as a **graph of stacks and groups** (auth stack vs. app stack), not necessarily a 1:1 file layout with every `MaterialPageRoute`.

## Next step

Follow **Phase 1** in [MIGRATION_PLAN.md](./MIGRATION_PLAN.md) and refresh this inventory if the Flutter repo gains routes or packages.
