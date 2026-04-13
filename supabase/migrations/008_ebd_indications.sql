-- EBD (Energy Based Devices) clinical hierarchy: modality (laser | photofacial) + treatment category.
-- Issue #22. Run after 007_condition_service_map.sql.

-- ---------------------------------------------------------------------------
-- ebd_indications
-- ---------------------------------------------------------------------------
create table if not exists public.ebd_indications (
  id uuid primary key default gen_random_uuid(),
  modality text not null check (modality in ('laser', 'photofacial')),
  name text not null,
  description text,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ebd_indications_modality_name_uidx unique (modality, name)
);

create index if not exists ebd_indications_active_modality_order_idx
  on public.ebd_indications (is_active, modality, sort_order);

comment on table public.ebd_indications is
  'EBD treatment categories per modality (laser vs photofacial); aligns with clinical master lists.';

alter table public.ebd_indications enable row level security;

create policy "ebd_indications_select_active" on public.ebd_indications
  for select using (auth.uid() is not null and is_active = true);

create policy "ebd_indications_admin_write" on public.ebd_indications
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  )
  with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  );

-- ---------------------------------------------------------------------------
-- treatments / appointments — optional link to EBD category (laser modality in app)
-- ---------------------------------------------------------------------------
alter table public.treatments
  add column if not exists ebd_indication_id uuid references public.ebd_indications (id) on delete set null;

alter table public.appointments
  add column if not exists ebd_indication_id uuid references public.ebd_indications (id) on delete set null;

create index if not exists treatments_ebd_indication_idx
  on public.treatments (ebd_indication_id)
  where ebd_indication_id is not null;

create index if not exists appointments_ebd_indication_idx
  on public.appointments (ebd_indication_id)
  where ebd_indication_id is not null;

-- ---------------------------------------------------------------------------
-- Seed 20 categories (idempotent)
-- ---------------------------------------------------------------------------
insert into public.ebd_indications (modality, name, description, sort_order)
select v.modality, v.name, v.description, v.sort_order
from (
  values
    ('laser'::text, 'Hair Removal'::text, 'EBD laser — hair removal'::text, 10),
    ('laser', 'Pigment / Sun Spots', 'EBD laser — pigment / sun spots', 20),
    ('laser', 'Vascular / Redness', 'EBD laser — vascular / redness', 30),
    ('laser', 'Ablative Resurfacing', 'EBD laser — ablative resurfacing', 40),
    ('laser', 'Non-Ablative Resurfacing', 'EBD laser — non-ablative resurfacing', 50),
    ('laser', 'Fractional Resurfacing', 'EBD laser — fractional resurfacing', 60),
    ('laser', 'Acne Scar Treatment', 'EBD laser — acne scar treatment', 70),
    ('laser', 'Scar Revision', 'EBD laser — scar revision', 80),
    ('laser', 'Tattoo Removal', 'EBD laser — tattoo removal', 90),
    ('laser', 'Skin Tightening / Collagen Remodeling', 'EBD laser — tightening / collagen', 100),
    ('photofacial', 'General Rejuvenation', 'EBD photofacial — general rejuvenation', 10),
    ('photofacial', 'Sun Damage', 'EBD photofacial — sun damage', 20),
    ('photofacial', 'Brown Spots / Pigment', 'EBD photofacial — brown spots / pigment', 30),
    ('photofacial', 'Freckles', 'EBD photofacial — freckles', 40),
    ('photofacial', 'Diffuse Redness', 'EBD photofacial — diffuse redness', 50),
    ('photofacial', 'Rosacea', 'EBD photofacial — rosacea', 60),
    ('photofacial', 'Broken Capillaries / Telangiectasia', 'EBD photofacial — telangiectasia', 70),
    ('photofacial', 'Acne / Acne Redness', 'EBD photofacial — acne / acne redness', 80),
    ('photofacial', 'Poikiloderma / Chest Redness', 'EBD photofacial — poikiloderma', 90),
    ('photofacial', 'Hair Reduction', 'EBD photofacial — hair reduction', 100)
) as v(modality, name, description, sort_order)
where not exists (
  select 1 from public.ebd_indications e where e.modality = v.modality and e.name = v.name
);

-- ---------------------------------------------------------------------------
-- Deactivate legacy laser-only service_types (injectable UX unchanged)
-- ---------------------------------------------------------------------------
update public.service_types
set is_active = false, updated_at = now()
where applies_to = 'laser'
  and name in ('IPL photofacial', 'Laser resurfacing')
  and is_active = true;

-- ---------------------------------------------------------------------------
-- Backfill existing laser rows (best-effort)
-- ---------------------------------------------------------------------------
update public.treatments t
set
  ebd_indication_id = ei.id,
  service_type = ei.name,
  updated_at = now()
from public.ebd_indications ei
where t.treatment_type = 'laser'
  and t.service_type = 'IPL photofacial'
  and ei.modality = 'photofacial'
  and ei.name = 'General Rejuvenation';

update public.treatments t
set
  ebd_indication_id = ei.id,
  service_type = ei.name,
  updated_at = now()
from public.ebd_indications ei
where t.treatment_type = 'laser'
  and t.service_type = 'Laser resurfacing'
  and ei.modality = 'laser'
  and ei.name = 'Fractional Resurfacing';

update public.treatments t
set
  ebd_indication_id = ei.id,
  service_type = ei.name,
  updated_at = now()
from public.ebd_indications ei
where t.treatment_type = 'laser'
  and t.service_type = 'Microneedling (RF)'
  and ei.modality = 'laser'
  and ei.name = 'Non-Ablative Resurfacing';

update public.treatments t
set
  ebd_indication_id = ei.id,
  service_type = ei.name,
  updated_at = now()
from public.ebd_indications ei
where t.treatment_type = 'laser'
  and t.service_type = 'Chemical peel'
  and ei.modality = 'laser'
  and ei.name = 'Non-Ablative Resurfacing';

-- ---------------------------------------------------------------------------
-- Appointments: mirror backfill for same legacy labels
-- ---------------------------------------------------------------------------
update public.appointments a
set
  ebd_indication_id = ei.id,
  service_type = ei.name,
  updated_at = now()
from public.ebd_indications ei
where a.appointment_kind = 'treatment'
  and a.treatment_type = 'laser'
  and a.service_type = 'IPL photofacial'
  and ei.modality = 'photofacial'
  and ei.name = 'General Rejuvenation';

update public.appointments a
set
  ebd_indication_id = ei.id,
  service_type = ei.name,
  updated_at = now()
from public.ebd_indications ei
where a.appointment_kind = 'treatment'
  and a.treatment_type = 'laser'
  and a.service_type = 'Laser resurfacing'
  and ei.modality = 'laser'
  and ei.name = 'Fractional Resurfacing';

-- ---------------------------------------------------------------------------
-- condition_service_map — optional EBD category for recommendations
-- ---------------------------------------------------------------------------
alter table public.condition_service_map
  add column if not exists ebd_indication_id uuid references public.ebd_indications (id) on delete set null;

create index if not exists condition_service_map_ebd_idx
  on public.condition_service_map (ebd_indication_id)
  where ebd_indication_id is not null;

-- Map stub rows to EBD categories (per condition + catalog row)
update public.condition_service_map m
set ebd_indication_id = ei.id, updated_at = now()
from public.service_types st, public.ebd_indications ei
where m.service_type_id = st.id
  and m.ebd_indication_id is null
  and m.condition_key = 'solar_lentigines'
  and st.name = 'Laser resurfacing'
  and m.laser_type_id is null
  and ei.modality = 'laser'
  and ei.name = 'Pigment / Sun Spots';

update public.condition_service_map m
set ebd_indication_id = ei.id, updated_at = now()
from public.service_types st, public.ebd_indications ei
where m.service_type_id = st.id
  and m.ebd_indication_id is null
  and m.condition_key = 'melasma'
  and st.name = 'Laser resurfacing'
  and ei.modality = 'laser'
  and ei.name = 'Fractional Resurfacing';

update public.condition_service_map m
set ebd_indication_id = ei.id, updated_at = now()
from public.service_types st, public.ebd_indications ei
where m.service_type_id = st.id
  and m.ebd_indication_id is null
  and st.name = 'IPL photofacial'
  and ei.modality = 'photofacial'
  and ei.name = 'General Rejuvenation';

update public.condition_service_map m
set ebd_indication_id = ei.id, updated_at = now()
from public.service_types st, public.ebd_indications ei
where m.service_type_id = st.id
  and m.ebd_indication_id is null
  and st.name = 'Chemical peel'
  and ei.modality = 'laser'
  and ei.name = 'Non-Ablative Resurfacing';

update public.condition_service_map m
set ebd_indication_id = ei.id, updated_at = now()
from public.service_types st, public.ebd_indications ei
where m.service_type_id = st.id
  and m.ebd_indication_id is null
  and st.name = 'Microneedling (RF)'
  and ei.modality = 'laser'
  and ei.name = 'Non-Ablative Resurfacing';

-- Freckles + IPL photofacial (+ optional device) → photofacial Freckles
update public.condition_service_map m
set ebd_indication_id = ei.id, updated_at = now()
from public.service_types st, public.ebd_indications ei
where m.service_type_id = st.id
  and m.ebd_indication_id is null
  and m.condition_key = 'freckles'
  and st.name = 'IPL photofacial'
  and ei.modality = 'photofacial'
  and ei.name = 'Freckles';

-- Solar lentigines + IPL / BBL device row → photofacial Brown Spots / Pigment
update public.condition_service_map m
set ebd_indication_id = ei.id, updated_at = now()
from public.laser_types lt, public.ebd_indications ei
where m.laser_type_id = lt.id
  and m.ebd_indication_id is null
  and lt.name = 'IPL / BBL'
  and m.condition_key = 'solar_lentigines'
  and ei.modality = 'photofacial'
  and ei.name = 'Brown Spots / Pigment';
