-- Issue #27: Top-level treatment modalities as reference data + Skin Treatments slug.
-- `treatments.treatment_type` / `appointments.treatment_type` reference `treatment_types.slug`.
-- `service_types.applies_to`: free text — `both` = injectable+laser only; `all` = every type; else slug match.

-- ---------------------------------------------------------------------------
-- treatment_types
-- ---------------------------------------------------------------------------
create table if not exists public.treatment_types (
  slug text primary key,
  name text not null,
  sort_order int not null default 0,
  is_active boolean not null default true,
  use_ebd_service_flow boolean not null default false,
  use_laser_device_brand_picker boolean not null default false,
  show_units_field boolean not null default false,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists treatment_types_active_order_idx
  on public.treatment_types (is_active, sort_order);

comment on table public.treatment_types is
  'Top-level treatment modality slugs stored on treatments/appointments; flags drive app UX (EBD flow, laser brand picker, units).';
comment on column public.treatment_types.use_ebd_service_flow is
  'When true and EBD rows exist, app uses indication + modality flow.';
comment on column public.treatment_types.use_laser_device_brand_picker is
  'When true, brand/device picker uses laser_types catalog.';
comment on column public.treatment_types.show_units_field is
  'When true, app shows injectable-style units field.';

-- Seed (idempotent)
insert into public.treatment_types (
  slug,
  name,
  sort_order,
  use_ebd_service_flow,
  use_laser_device_brand_picker,
  show_units_field
)
select v.slug, v.name, v.sort_order, v.use_ebd, v.laser_brand, v.show_units
from (
  values
    ('injectable'::text, 'Injectable'::text, 10, false, false, true),
    ('laser', 'Energy Based Devices', 20, true, true, false),
    ('skin_treatments', 'Skin Treatments', 30, false, false, false)
) as v(slug, name, sort_order, use_ebd, laser_brand, show_units)
where not exists (select 1 from public.treatment_types t where t.slug = v.slug);

-- ---------------------------------------------------------------------------
-- Referential integrity: treatments
-- ---------------------------------------------------------------------------
alter table public.treatments drop constraint if exists treatments_treatment_type_fk;
alter table public.treatments
  add constraint treatments_treatment_type_fk
  foreign key (treatment_type) references public.treatment_types (slug);

-- ---------------------------------------------------------------------------
-- Appointments: replace enum checks with FK + kind/modality rule
-- ---------------------------------------------------------------------------
alter table public.appointments drop constraint if exists appointments_treatment_type_check;
alter table public.appointments drop constraint if exists appointments_kind_modality_match;
alter table public.appointments drop constraint if exists appointments_treatment_type_fk;

alter table public.appointments
  add constraint appointments_treatment_type_fk
  foreign key (treatment_type) references public.treatment_types (slug);

alter table public.appointments
  add constraint appointments_kind_modality_match check (
    (appointment_kind = 'consult' and treatment_type is null)
    or (appointment_kind = 'treatment' and treatment_type is not null)
  );

-- ---------------------------------------------------------------------------
-- service_types.applies_to — allow any slug / all / both (app interprets)
-- ---------------------------------------------------------------------------
alter table public.service_types drop constraint if exists service_types_applies_to_check;

comment on column public.service_types.applies_to is
  'injectable | laser | both (injectable+laser) | all (every treatment type) | or treatment_types.slug';

-- ---------------------------------------------------------------------------
-- Skin-oriented service types (idempotent)
-- ---------------------------------------------------------------------------
insert into public.service_types (name, description, applies_to, sort_order)
select v.name, v.description, v.applies_to, v.sort_order
from (
  values
    ('Hydrafacial / facial'::text, 'Medical-grade facial or Hydrafacial-style treatment'::text, 'skin_treatments'::text, 110),
    ('Medical-grade skincare session', 'Clinical skincare treatment', 'skin_treatments', 120),
    ('Microneedling (skin)', 'Collagen induction / microneedling as skin treatment', 'skin_treatments', 130)
) as v(name, description, applies_to, sort_order)
where not exists (select 1 from public.service_types t where t.name = v.name);

-- ---------------------------------------------------------------------------
-- RLS (mirror reference catalogs)
-- ---------------------------------------------------------------------------
alter table public.treatment_types enable row level security;

create policy "treatment_types_select_active" on public.treatment_types
  for select using (auth.uid() is not null and is_active = true);

create policy "treatment_types_admin_write" on public.treatment_types
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  )
  with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  );
