# Supabase schema sketch (from Flutter / Firestore)

**Status:** Implemented as SQL in [`supabase/migrations/`](../supabase/migrations/) (`001` core + `002` catalogs). The **Expo app does not apply** these files; your cloud project must run them via [SQL Editor or CLI `db push`](./SUPABASE_SETUP.md). Names use `snake_case` in Postgres; mappers convert to/from TS `camelCase` as needed.

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
| `service_type` | `text` | |
| `brand` | `text` | |
| `treatment_areas` | `text[]` | |
| `units` | `int` | |
| `provider_id` | `uuid` FK → `providers.id` | nullable if legacy allows |
| `treatment_date` | `timestamptz` | |
| `notes` | `text` default '' | |
| `cost` | `numeric` | nullable |
| `created_at` | `timestamptz` | |
| `updated_at` | `timestamptz` | |

Index: `(user_id, treatment_date desc)` for list + calendar queries.

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
| `treatmentAreas` | `treatment_areas` | Optional `category` |
| `providerServices` | `provider_service_catalog` | |

**Shared columns (all four):** `id` (uuid), `name`, `description`, `icon`, `sort_order`, `is_default`, `is_active`, `created_by` (FK → `profiles`), `created_at`, `updated_at`.

**RLS (implemented):** authenticated users **SELECT** rows where `is_active = true`. **INSERT/UPDATE/DELETE** only when `profiles.is_admin` for `auth.uid()`. Seeds run as SQL superuser (bypass RLS).

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
