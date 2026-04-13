-- Many-to-many: which laser_types (devices) apply to each ebd_indications category.
-- Editorial seeds only — tune via Catalog admin or SQL. Run after 008_ebd_indications.sql.

-- ---------------------------------------------------------------------------
-- ebd_indication_laser_types
-- ---------------------------------------------------------------------------
create table if not exists public.ebd_indication_laser_types (
  id uuid primary key default gen_random_uuid(),
  ebd_indication_id uuid not null references public.ebd_indications (id) on delete cascade,
  laser_type_id uuid not null references public.laser_types (id) on delete cascade,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  constraint ebd_indication_laser_types_pair_uidx unique (ebd_indication_id, laser_type_id)
);

create index if not exists ebd_indication_laser_types_ebd_order_idx
  on public.ebd_indication_laser_types (ebd_indication_id, sort_order);

create index if not exists ebd_indication_laser_types_laser_idx
  on public.ebd_indication_laser_types (laser_type_id);

comment on table public.ebd_indication_laser_types is
  'Maps EBD treatment categories to allowed device/brand rows (laser_types); mirrors service_type_brands → service_types for injectables.';

alter table public.ebd_indication_laser_types enable row level security;

create policy "ebd_indication_laser_types_select_active" on public.ebd_indication_laser_types
  for select using (
    auth.uid() is not null
    and exists (
      select 1 from public.ebd_indications ei
      where ei.id = ebd_indication_id and ei.is_active = true
    )
    and exists (
      select 1 from public.laser_types lt
      where lt.id = laser_type_id and lt.is_active = true
    )
  );

create policy "ebd_indication_laser_types_admin_write" on public.ebd_indication_laser_types
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  )
  with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  );

-- ---------------------------------------------------------------------------
-- Seed (idempotent): link by stable names
-- ---------------------------------------------------------------------------

-- "Other" on every active indication so users can always enter a custom device.
insert into public.ebd_indication_laser_types (ebd_indication_id, laser_type_id, sort_order)
select ei.id, lt.id, 999
from public.ebd_indications ei
cross join public.laser_types lt
where lt.name = 'Other'
  and lt.is_active = true
  and ei.is_active = true
  and not exists (
    select 1 from public.ebd_indication_laser_types x
    where x.ebd_indication_id = ei.id and x.laser_type_id = lt.id
  );

-- IPL / BBL → all photofacial categories
insert into public.ebd_indication_laser_types (ebd_indication_id, laser_type_id, sort_order)
select ei.id, lt.id, coalesce(lt.sort_order, 0)
from public.ebd_indications ei
cross join public.laser_types lt
where ei.modality = 'photofacial'
  and lt.name = 'IPL / BBL'
  and lt.is_active = true
  and ei.is_active = true
  and not exists (
    select 1 from public.ebd_indication_laser_types x
    where x.ebd_indication_id = ei.id and x.laser_type_id = lt.id
  );

-- Diode hair removal → laser Hair Removal + photofacial Hair Reduction
insert into public.ebd_indication_laser_types (ebd_indication_id, laser_type_id, sort_order)
select ei.id, lt.id, coalesce(lt.sort_order, 0)
from public.ebd_indications ei
cross join public.laser_types lt
where lt.name = 'Diode hair removal'
  and lt.is_active = true
  and ei.is_active = true
  and (
    (ei.modality = 'laser' and ei.name = 'Hair Removal')
    or (ei.modality = 'photofacial' and ei.name = 'Hair Reduction')
  )
  and not exists (
    select 1 from public.ebd_indication_laser_types x
    where x.ebd_indication_id = ei.id and x.laser_type_id = lt.id
  );

-- CO2 fractional → common resurfacing / scar categories
insert into public.ebd_indication_laser_types (ebd_indication_id, laser_type_id, sort_order)
select ei.id, lt.id, coalesce(lt.sort_order, 0)
from public.ebd_indications ei
cross join public.laser_types lt
where lt.name = 'CO2 fractional'
  and lt.is_active = true
  and ei.modality = 'laser'
  and ei.is_active = true
  and ei.name in (
    'Ablative Resurfacing',
    'Fractional Resurfacing',
    'Acne Scar Treatment',
    'Scar Revision',
    'Non-Ablative Resurfacing',
    'Skin Tightening / Collagen Remodeling'
  )
  and not exists (
    select 1 from public.ebd_indication_laser_types x
    where x.ebd_indication_id = ei.id and x.laser_type_id = lt.id
  );

-- Er:YAG → ablative / fractional / scar-related laser categories
insert into public.ebd_indication_laser_types (ebd_indication_id, laser_type_id, sort_order)
select ei.id, lt.id, coalesce(lt.sort_order, 0)
from public.ebd_indications ei
cross join public.laser_types lt
where lt.name = 'Er:YAG'
  and lt.is_active = true
  and ei.modality = 'laser'
  and ei.is_active = true
  and ei.name in (
    'Ablative Resurfacing',
    'Fractional Resurfacing',
    'Acne Scar Treatment',
    'Scar Revision'
  )
  and not exists (
    select 1 from public.ebd_indication_laser_types x
    where x.ebd_indication_id = ei.id and x.laser_type_id = lt.id
  );

-- Nd:YAG → laser pigment / vascular / tattoo / tightening + several photofacial targets
insert into public.ebd_indication_laser_types (ebd_indication_id, laser_type_id, sort_order)
select ei.id, lt.id, coalesce(lt.sort_order, 0)
from public.ebd_indications ei
cross join public.laser_types lt
where lt.name = 'Nd:YAG'
  and lt.is_active = true
  and ei.is_active = true
  and (
    (
      ei.modality = 'laser'
      and ei.name in (
        'Pigment / Sun Spots',
        'Vascular / Redness',
        'Tattoo Removal',
        'Skin Tightening / Collagen Remodeling'
      )
    )
    or (
      ei.modality = 'photofacial'
      and ei.name in (
        'Sun Damage',
        'Brown Spots / Pigment',
        'Diffuse Redness',
        'Rosacea',
        'Broken Capillaries / Telangiectasia',
        'Acne / Acne Redness',
        'Poikiloderma / Chest Redness'
      )
    )
  )
  and not exists (
    select 1 from public.ebd_indication_laser_types x
    where x.ebd_indication_id = ei.id and x.laser_type_id = lt.id
  );
