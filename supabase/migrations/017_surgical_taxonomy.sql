-- Issue #52: Surgical treatment modality, Implants service type, implant procedure catalog, structured details.

-- ---------------------------------------------------------------------------
-- treatment_types — Surgical
-- ---------------------------------------------------------------------------
insert into public.treatment_types (
  slug,
  name,
  sort_order,
  use_ebd_service_flow,
  use_laser_device_brand_picker,
  show_units_field
)
select 'surgical'::text, 'Surgical'::text, 40, false, false, false
where not exists (select 1 from public.treatment_types t where t.slug = 'surgical');

-- ---------------------------------------------------------------------------
-- service_types — Implants (applies only to surgical modality)
-- ---------------------------------------------------------------------------
insert into public.service_types (name, description, applies_to, sort_order)
select
  'Implants'::text,
  'Surgical implant procedures'::text,
  'surgical'::text,
  210
where not exists (select 1 from public.service_types t where t.name = 'Implants');

-- ---------------------------------------------------------------------------
-- surgical_procedures — implant type options per service_types row (Implants)
-- ---------------------------------------------------------------------------
create table if not exists public.surgical_procedures (
  id uuid primary key default gen_random_uuid(),
  service_type_id uuid not null references public.service_types (id) on delete cascade,
  name text not null,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint surgical_procedures_service_name_uid unique (service_type_id, name)
);

create index if not exists surgical_procedures_service_active_order_idx
  on public.surgical_procedures (service_type_id, is_active, sort_order);

comment on table public.surgical_procedures is
  'Implant procedure labels for Surgical → Implants; FK from treatments.surgical_procedure_id.';

alter table public.surgical_procedures enable row level security;

create policy "surgical_procedures_select_active" on public.surgical_procedures
  for select using (
    auth.uid() is not null
    and is_active = true
    and exists (
      select 1 from public.service_types st
      where st.id = service_type_id and st.is_active = true
    )
  );

create policy "surgical_procedures_admin_write" on public.surgical_procedures
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  )
  with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  );

insert into public.surgical_procedures (service_type_id, name, sort_order)
select st.id, v.name, v.sort_order
from public.service_types st
cross join (
  values
    ('Breast Implants'::text, 10),
    ('Buttock Implants', 20),
    ('Chin Implant', 30),
    ('Cheek Implants', 40),
    ('Jaw Implant', 50),
    ('Pectoral Implants', 60),
    ('Calf Implants', 70),
    ('Testicular Implants', 80),
    ('Custom Facial Implant', 90),
    ('Other Implant', 100)
) as v(name, sort_order)
where st.name = 'Implants'
  and not exists (
    select 1 from public.surgical_procedures p
    where p.service_type_id = st.id and p.name = v.name
  );

-- ---------------------------------------------------------------------------
-- treatments — surgical procedure link + structured implant payload (JSONB)
-- ---------------------------------------------------------------------------
alter table public.treatments
  add column if not exists surgical_procedure_id uuid references public.surgical_procedures (id) on delete set null;

alter table public.treatments
  add column if not exists surgical_details jsonb;

comment on column public.treatments.surgical_details is
  'Optional structured implant fields (core, implant-specific, follow-up/history) per issue #52; see app domain surgicalDetailsSchema.';

create index if not exists treatments_surgical_procedure_idx
  on public.treatments (surgical_procedure_id)
  where surgical_procedure_id is not null;
