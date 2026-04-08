-- Maps skin analyzer condition keys (exclusive-class ML labels) to catalog rows for
-- in-app "recommended treatments". Run after 002_reference_catalogs.sql.
--
-- Rationale: treatments in-app use `service_types` names for booking UX; `laser_types`
-- captures device-level catalog. A row can reference one or both so recommendations
-- can show e.g. service "Laser resurfacing" plus optional device row "CO2 fractional".

create table if not exists public.condition_service_map (
  id uuid primary key default gen_random_uuid(),
  -- Stable key aligned with model/app: melasma | solar_lentigines | freckles | pih
  condition_key text not null,
  service_type_id uuid references public.service_types (id) on delete cascade,
  laser_type_id uuid references public.laser_types (id) on delete set null,
  sort_order int not null default 0,
  severity_band text check (severity_band is null or severity_band in ('mild', 'moderate', 'severe')),
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint condition_service_map_target_chk check (
    service_type_id is not null or laser_type_id is not null
  )
);

create index if not exists condition_service_map_condition_idx
  on public.condition_service_map (condition_key, is_active, sort_order);

create index if not exists condition_service_map_service_type_idx
  on public.condition_service_map (service_type_id)
  where service_type_id is not null;

create index if not exists condition_service_map_laser_type_idx
  on public.condition_service_map (laser_type_id)
  where laser_type_id is not null;

comment on table public.condition_service_map is
  'Editorial mapping from skin_condition_key to service_types / laser_types for analyzer recommendations';

alter table public.condition_service_map enable row level security;

create policy "condition_service_map_select_active" on public.condition_service_map
  for select using (auth.uid() is not null and is_active = true);

create policy "condition_service_map_admin_write" on public.condition_service_map
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  )
  with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  );

-- Example seeds (idempotent): link solar lentigines → Laser resurfacing + IPL; freckles → IPL; etc.
insert into public.condition_service_map (condition_key, service_type_id, laser_type_id, sort_order, notes)
select v.condition_key, st.id, lt.id, v.sort_order, v.notes
from (
  values
    ('solar_lentigines'::text, 'Laser resurfacing'::text, null::text, 0, 'Stub: strong pigment / sun spots'::text),
    ('solar_lentigines', 'IPL photofacial', 'IPL / BBL', 1, 'Stub: light-based option'),
    ('freckles', 'IPL photofacial', 'IPL / BBL', 0, 'Stub: ephelides often light-based'),
    ('melasma', 'Chemical peel', null, 0, 'Stub: adjunct; clinical plan varies — review with provider'),
    ('melasma', 'Laser resurfacing', null, 1, 'Stub: selected fractional protocols only — provider-dependent'),
    ('pih', 'Chemical peel', null, 0, 'Stub: gentle resurfacing options / time'),
    ('pih', 'Microneedling (RF)', null, 1, 'Stub: example adjunct')
) as v(condition_key, service_name, laser_name, sort_order, notes)
left join public.service_types st on st.name = v.service_name and st.is_active = true
left join public.laser_types lt on lt.name = v.laser_name and lt.is_active = true
where st.id is not null
  and not exists (
    select 1 from public.condition_service_map m
    where m.condition_key = v.condition_key
      and m.service_type_id = st.id
      and (m.laser_type_id is not distinct from lt.id)
  );
