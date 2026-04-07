-- Reference catalogs (Flutter ContentService–style). Run after 001_phase5_core.sql.
-- Authenticated users: SELECT active rows. Admins (profiles.is_admin): full CRUD.

-- ---------------------------------------------------------------------------
-- laser_types
-- ---------------------------------------------------------------------------
create table if not exists public.laser_types (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  icon text,
  sort_order int not null default 0,
  is_default boolean not null default false,
  is_active boolean not null default true,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists laser_types_active_order_idx on public.laser_types (is_active, sort_order);

-- ---------------------------------------------------------------------------
-- service_types (filter by applies_to: injectable | laser | both)
-- ---------------------------------------------------------------------------
create table if not exists public.service_types (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  icon text,
  applies_to text not null default 'both' check (applies_to in ('injectable', 'laser', 'both')),
  sort_order int not null default 0,
  is_default boolean not null default false,
  is_active boolean not null default true,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists service_types_active_order_idx on public.service_types (is_active, sort_order);
create index if not exists service_types_applies_idx on public.service_types (applies_to, is_active);

-- ---------------------------------------------------------------------------
-- treatment_areas
-- ---------------------------------------------------------------------------
create table if not exists public.treatment_areas (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text,
  description text,
  icon text,
  sort_order int not null default 0,
  is_default boolean not null default false,
  is_active boolean not null default true,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists treatment_areas_active_order_idx on public.treatment_areas (is_active, sort_order);

-- ---------------------------------------------------------------------------
-- provider_service_catalog
-- ---------------------------------------------------------------------------
create table if not exists public.provider_service_catalog (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  icon text,
  sort_order int not null default 0,
  is_default boolean not null default false,
  is_active boolean not null default true,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists provider_service_catalog_active_order_idx
  on public.provider_service_catalog (is_active, sort_order);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.laser_types enable row level security;
alter table public.service_types enable row level security;
alter table public.treatment_areas enable row level security;
alter table public.provider_service_catalog enable row level security;

-- SELECT: any signed-in user, active rows only
create policy "laser_types_select_active" on public.laser_types
  for select using (auth.uid() is not null and is_active = true);

create policy "service_types_select_active" on public.service_types
  for select using (auth.uid() is not null and is_active = true);

create policy "treatment_areas_select_active" on public.treatment_areas
  for select using (auth.uid() is not null and is_active = true);

create policy "provider_service_catalog_select_active" on public.provider_service_catalog
  for select using (auth.uid() is not null and is_active = true);

-- WRITE: admins only (manage content in Dashboard / SQL as service role)
create policy "laser_types_admin_write" on public.laser_types
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  )
  with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  );

create policy "service_types_admin_write" on public.service_types
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  )
  with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  );

create policy "treatment_areas_admin_write" on public.treatment_areas
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  )
  with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  );

create policy "provider_service_catalog_admin_write" on public.provider_service_catalog
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  )
  with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  );

-- ---------------------------------------------------------------------------
-- Seed (idempotent)
-- ---------------------------------------------------------------------------
insert into public.laser_types (name, description, sort_order)
select v.name, v.description, v.sort_order
from (
  values
    ('CO2 fractional'::text, 'Fractional CO2 resurfacing'::text, 10),
    ('Er:YAG', 'Erbium YAG laser', 20),
    ('Nd:YAG', 'Nd:YAG (vascular / deeper)', 30),
    ('IPL / BBL', 'Broadband light', 40),
    ('Diode hair removal', 'Diode laser hair reduction', 50)
) as v(name, description, sort_order)
where not exists (select 1 from public.laser_types t where t.name = v.name);

insert into public.service_types (name, description, applies_to, sort_order)
select v.name, v.description, v.applies_to, v.sort_order
from (
  values
    ('Botulinum toxin'::text, 'Neuromodulator injectable'::text, 'injectable'::text, 10),
    ('Hyaluronic acid filler', 'Dermal filler', 'injectable', 20),
    ('Kybella / fat dissolving', 'Injectable fat reduction', 'injectable', 30),
    ('IPL photofacial', 'Intense pulsed light facial', 'laser', 40),
    ('Laser resurfacing', 'Ablative / fractional resurfacing', 'laser', 50),
    ('Microneedling (RF)', 'RF microneedling session', 'both', 60),
    ('Chemical peel', 'Superficial / medium peel', 'both', 70)
) as v(name, description, applies_to, sort_order)
where not exists (select 1 from public.service_types t where t.name = v.name);

insert into public.treatment_areas (name, category, sort_order)
select v.name, v.category, v.sort_order
from (
  values
    ('Forehead'::text, 'Upper face'::text, 10),
    ('Glabella / frown', 'Upper face', 20),
    ('Crow''s feet', 'Upper face', 30),
    ('Cheeks', 'Mid face', 40),
    ('Nasolabial folds', 'Mid face', 50),
    ('Lips / perioral', 'Lower face', 60),
    ('Chin', 'Lower face', 70),
    ('Jawline', 'Lower face', 80),
    ('Neck', 'Neck', 90),
    ('Décolletage', 'Body', 100)
) as v(name, category, sort_order)
where not exists (select 1 from public.treatment_areas t where t.name = v.name);

insert into public.provider_service_catalog (name, description, sort_order)
select v.name, v.description, v.sort_order
from (
  values
    ('Injectables'::text, 'Botulinum toxin, fillers'::text, 10),
    ('Laser & light', 'IPL, laser resurfacing', 20),
    ('Skin tightening', 'RF / ultrasound', 30),
    ('Body contouring', 'Non-surgical body', 40),
    ('Medical aesthetics', 'Clinical cosmetic', 50),
    ('Dermatology', 'Medical skin care', 60)
) as v(name, description, sort_order)
where not exists (select 1 from public.provider_service_catalog t where t.name = v.name);
