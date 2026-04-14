# Supabase schema sketch (from Flutter / Firestore)

**Status:** Implemented as SQL in [`supabase/migrations/`](../supabase/migrations/) (`001` core, `002` catalogs, `003` treatment photos + storage, `004` admin user listing + RPC, `005` service-type brands, `006` appointments, `007` skin condition → service/laser map, **`008` EBD clinical categories**, **`009` EBD ↔ laser_types junction**). The **Expo app does not apply** these files; your cloud project must run them via [SQL Editor or CLI `db push`](./SUPABASE_SETUP.md). Names use `snake_case` in Postgres; mappers convert to/from TS `camelCase` as needed.

---

## Tables

### `profiles`

One row per `auth.users` id (replaces `users/{uid}`).

| Column | Type | Notes |
|--------|------|--------|
| `id` | `uuid` PK, FK → `auth.users.id` | Same as Supabase Auth user |
| `email` | `text` | Denormalized for queries; optional if only social auth |
| `first_name` | `text` | |
| `last_name` | `text` | |
| `display_name` | `text` | |
| `photo_url` | `text` | |
| `treatment_count` | `int` default 0 | Denormalized; update on treatment add/delete (or recompute in job) |
| `is_admin` | `boolean` default false | Replaces Firestore `isAdmin` |
| `created_at` | `timestamptz` | |
| `updated_at` | `timestamptz` | |
| `last_login_at` | `timestamptz` | |

### `medical_profiles`

Single current profile per user (replaces `users/{uid}/medicalProfile/current`).

| Column | Type | Notes |
|--------|------|--------|
| `user_id` | `uuid` PK, FK → `profiles.id` | |
| `date_of_birth` | `date` | |
| `gender` | `text` | Enum string: `male`, `female`, … |
| `ethnicity` | `text` | |
| `skin_type` | `text` | `type1` … `type6` |
| `allergies` | `text[]` | |
| `medications` | `text[]` | |
| `medical_conditions` | `text[]` | |
| `previous_treatments` | `text[]` | Persist here (Flutter save path omitted this field; treat as bugfix in Expo) |
| `notes` | `text` | |
| `created_at` | `timestamptz` | |
| `updated_at` | `timestamptz` | |

### `treatments`

Replaces `users/{uid}/treatments/{id}`.

| Column | Type | Notes |
|--------|------|--------|
| `id` | `uuid` PK default `gen_random_uuid()` | |
| `user_id` | `uuid` FK → `profiles.id` | |
| `treatment_type` | `text` | `injectable` \| `laser` |
| `service_type` | `text` | Injectable: catalog name; laser/EBD: treatment category label |
| `ebd_indication_id` | `uuid` nullable FK → `ebd_indications` | Set for laser rows using EBD hierarchy (issue #22) |
| `brand` | `text` | |
| `treatment_areas` | `text[]` | |
| `units` | `int` | |
| `provider_id` | `uuid` FK → `providers.id` | nullable if legacy allows |
| `treatment_date` | `timestamptz` | |

### `appointments`

Upcoming or historical **scheduled visits** (consult or treatment service). Distinct from **`treatments`** (completed procedure log). Sync-friendly via **`external_ref`**.

| Column | Type | Notes |
|--------|------|--------|
| `id` | `uuid` PK | |
| `user_id` | `uuid` FK → `profiles.id` | |
| `appointment_kind` | `text` | `consult` \| `treatment` |
| `treatment_type` | `text` | `injectable` \| `laser` if kind is `treatment`; **null** for `consult` |
| `service_type` | `text` | Catalog-backed label; consult may use e.g. `Consultation` |
| `ebd_indication_id` | `uuid` nullable FK → `ebd_indications` | Laser treatment visits using EBD categories |
| `brand` | `text` | Optional product/device |
| `scheduled_at` | `timestamptz` | Start time |
| `duration_minutes` | `int` | Optional |
| `provider_id` | `uuid` FK → `providers.id` | Optional |
| `notes` | `text` | |
| `status` | `text` | `scheduled` \| `cancelled` \| `completed` |
| `external_ref` | `text` | EMR / scheduling system id (optional) |
| `created_at` / `updated_at` | `timestamptz` | |
| `notes` | `text` default '' | |
| `cost` | `numeric` | nullable |
| `photo_urls` | `text[]` default `{}` | Storage object paths in bucket `treatment-photos` (`{user_id}/{treatment_id}/{file}`) |
| `created_at` | `timestamptz` | |
| `updated_at` | `timestamptz` | |

Index: `(user_id, treatment_date desc)` for list + calendar queries.

**Storage:** private bucket `treatment-photos`; RLS on `storage.objects` restricts paths whose first folder equals `auth.uid()`.

**Admin:** `current_user_is_admin()` (security definer) + policy `profiles_select_all_for_admin`; `admin_set_user_admin(p_user_id, p_is_admin)` RPC toggles `is_admin` for other users only (not self).

### `providers`

Replaces top-level `providers` collection.

| Column | Type | Notes |
|--------|------|--------|
| `id` | `uuid` PK | |
| `name` | `text` | |
| `address` | `text` | |
| `city` | `text` | |
| `province` | `text` | |
| `postal_code` | `text` | |
| `phone` | `text` | |
| `email` | `text` | |
| `website` | `text` | |
| `specialties` | `text[]` | UI maps to `Provider.services` |
| `is_verified` | `boolean` default false | |
| `is_global` | `boolean` | Global directory vs user-scoped |
| `user_id` | `uuid` nullable FK | Owner for non-global rows |
| `created_by` | `uuid` FK | |
| `is_active` | `boolean` default true | |
| `created_at` | `timestamptz` | |
| `updated_at` | `timestamptz` | |

### Reference catalogs (Firestore top-level collections)

| Firestore | Postgres table | Status |
|-----------|----------------|--------|
| `laserTypes` | `laser_types` | Migration `002_reference_catalogs.sql` |
| `serviceTypes` | `service_types` | + `applies_to` ∈ `injectable` \| `laser` \| `both` |
| `treatmentAreas` | `treatment_areas` | Optional `category` (admin notes); **`region`** `head` \| `upper_body` \| `lower_body` groups the treatment-form accordion (migration **`012_treatment_areas_region.sql`**) |
| `providerServices` | `provider_service_catalog` | |
| (per–service-type brands) | `service_type_brands` | Migration `005_service_type_brands.sql` — FK → `service_types`; `is_other` row → free-text detail in app; seeds e.g. neuromodulator + filler stubs |
| Skin analyzer recommendations | `condition_service_map` | Migration **`007_condition_service_map.sql`** — FK → `service_types` and optionally `laser_types`; optional **`ebd_indication_id`** (migration **`008_ebd_indications.sql`**) → `ebd_indications`; `condition_key` matches app/model ids (`melasma`, `solar_lentigines`, `freckles`, `pih`); optional `severity_band` for future tiered rules |
| EBD treatment categories | `ebd_indications` | Migration **`008_ebd_indications.sql`** — `modality` ∈ `laser` \| `photofacial`; `name` = treatment category (master lists); seeded 20 rows; RLS like other catalogs |
| EBD category → device list | `ebd_indication_laser_types` | Migration **`009_ebd_indication_laser_types.sql`** — many-to-many `ebd_indications` ↔ `laser_types`; `sort_order` per pair; seeds editorial device↔category links + **Other** on every category; RLS: authenticated read when both parents active; admin CRUD; app filters device picker by selected `ebd_indication_id` (like `service_type_brands` → `service_types` for injectables) |

**`ebd_indications`:** clinical **Energy Based Devices** categories per modality; laser appointments/treatments set `ebd_indication_id` and store the category name in `service_type` for readable lists.

**`laser_types`:** optional `is_other` (005) for catalog row **Other** (device not listed).

**Shared columns (all four core catalogs):** `id` (uuid), `name`, `description`, `icon`, `sort_order`, `is_default`, `is_active`, `created_by` (FK → `profiles`), `created_at`, `updated_at`.

**RLS (implemented):** authenticated users **SELECT** rows where `is_active = true`. **INSERT/UPDATE/DELETE** only when `profiles.is_admin` for `auth.uid()`. Seeds run as SQL superuser (bypass RLS).

**Treatment form pick lists (important):**

- The **`treatments`** table holds **logged procedures** per user (what they saved). It is **not** the source for service-type or area **suggestions**.
- **Service type** and **treatment area** dropdowns/chips load from **`service_types`** and **`treatment_areas`** (and laser **brand** from **`laser_types`**). The app reads these via `catalog.repository` → `fetchReferenceCatalogBundleFromRemote()`, caches the bundle locally, and refetches when the new/edit treatment screen is focused so **admin changes in Supabase (or Catalog admin)** show up without reinstalling the app.
- **Initial defaults** for a new project come from **`002_reference_catalogs.sql` seed `INSERT`s** (idempotent “where not exists”). Admins add or edit rows later; the Expo app stays **dynamic** against whatever is **active** (`is_active = true`) in those tables.

---

## Row Level Security (policies)

**Principles**

- **`profiles`**: user `select/update` own row (`auth.uid() = id`). Admins may `select` all if you add an admin claim or `is_admin` check via secure RPC.
- **`medical_profiles`**: `user_id = auth.uid()` for `select/insert/update/delete`.
- **`treatments`**: `user_id = auth.uid()` for CRUD on own rows.
- **`providers`**: `select` where `is_global = true` **or** `user_id = auth.uid()`. `insert/update/delete` for own `user_id` rows; admins can manage `is_global` (policy or service role + Edge Function).
- **Reference tables**: authenticated `select` for active rows; `insert/update/delete` restricted to admins (or service role for migrations only).

**Implementation note:** Prefer `auth.jwt() ->> 'role'` or a `profiles.is_admin` flag read inside policies; avoid duplicating admin logic in the client.

---

## Storage

- Treatment / profile photos (when added): Supabase Storage buckets with RLS on `auth.uid()` path prefix, aligned with Flutter’s future `firebase_storage` usage.

---

## Local SQLite cache (app)

Mirror hot paths only: e.g. `treatments`, `providers`, `medical_profiles` rows as JSON or normalized tables; `preferences` default provider id; queued writes table. Schema owned by `src/services/local/` (Phase 3+).
