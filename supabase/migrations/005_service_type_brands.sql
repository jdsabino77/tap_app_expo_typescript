-- Per–service-type brand lists for injectable / both treatments (laser uses laser_types + optional "Other").
-- Run after 002_reference_catalogs.sql.

-- ---------------------------------------------------------------------------
-- laser_types.is_other — "Other" row opens free-text device name in the app
-- ---------------------------------------------------------------------------
alter table public.laser_types
  add column if not exists is_other boolean not null default false;

-- ---------------------------------------------------------------------------
-- service_type_brands
-- ---------------------------------------------------------------------------
create table if not exists public.service_type_brands (
  id uuid primary key default gen_random_uuid(),
  service_type_id uuid not null references public.service_types (id) on delete cascade,
  name text not null,
  is_other boolean not null default false,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists service_type_brands_type_active_order_idx
  on public.service_type_brands (service_type_id, is_active, sort_order);

create unique index if not exists service_type_brands_type_name_uidx
  on public.service_type_brands (service_type_id, name);

alter table public.service_type_brands enable row level security;

create policy "service_type_brands_select_active" on public.service_type_brands
  for select using (
    auth.uid() is not null
    and is_active = true
    and exists (
      select 1 from public.service_types st
      where st.id = service_type_id and st.is_active = true
    )
  );

create policy "service_type_brands_admin_write" on public.service_type_brands
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  )
  with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  );

-- ---------------------------------------------------------------------------
-- Seed: laser "Other"
-- ---------------------------------------------------------------------------
insert into public.laser_types (name, description, sort_order, is_other)
select 'Other'::text, 'Device or brand not listed — specify in notes if needed'::text, 999, true
where not exists (select 1 from public.laser_types t where t.name = 'Other');

-- ---------------------------------------------------------------------------
-- Seed: brands per service type (idempotent)
-- ---------------------------------------------------------------------------
insert into public.service_type_brands (service_type_id, name, is_other, sort_order)
select st.id, v.name, v.is_other, v.sort_order
from public.service_types st
cross join (values
  ('Botox (onabotulinumtoxinA)'::text, false, 10),
  ('Dysport (abobotulinumtoxinA)', false, 20),
  ('Xeomin (incobotulinumtoxinA)', false, 30),
  ('Jeuveau (prabotulinumtoxinA-xvfs)', false, 40),
  ('Daxxify (daxibotulinumtoxinA)', false, 50),
  ('Other', true, 100)
) as v(name, is_other, sort_order)
where st.name = 'Botulinum toxin'
  and not exists (
    select 1 from public.service_type_brands b
    where b.service_type_id = st.id and b.name = v.name
  );

-- Hyaluronic acid filler stubs + Other
insert into public.service_type_brands (service_type_id, name, is_other, sort_order)
select st.id, v.name, v.is_other, v.sort_order
from public.service_types st
cross join (values
  ('brand-a'::text, false, 10),
  ('brand-b', false, 20),
  ('Other', true, 30)
) as v(name, is_other, sort_order)
where st.name = 'Hyaluronic acid filler'
  and not exists (
    select 1 from public.service_type_brands b
    where b.service_type_id = st.id and b.name = v.name
  );

-- Kybella / fat dissolving — placeholder brands + Other
insert into public.service_type_brands (service_type_id, name, is_other, sort_order)
select st.id, v.name, v.is_other, v.sort_order
from public.service_types st
cross join (values
  ('brand-stub-1'::text, false, 10),
  ('Other', true, 20)
) as v(name, is_other, sort_order)
where st.name = 'Kybella / fat dissolving'
  and not exists (
    select 1 from public.service_type_brands b
    where b.service_type_id = st.id and b.name = v.name
  );
