-- Upcoming appointments / services (user-scoped). Can be inserted from the app or synced from clinic systems / EMR.

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  appointment_kind text not null check (appointment_kind in ('consult', 'treatment')),
  treatment_type text null check (treatment_type is null or treatment_type in ('injectable', 'laser')),
  service_type text not null default '',
  brand text not null default '',
  scheduled_at timestamptz not null,
  duration_minutes int null check (duration_minutes is null or duration_minutes > 0),
  provider_id uuid null references public.providers (id) on delete set null,
  notes text not null default '',
  status text not null default 'scheduled' check (status in ('scheduled', 'cancelled', 'completed')),
  external_ref text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint appointments_kind_modality_match check (
    (appointment_kind = 'consult' and treatment_type is null)
    or (appointment_kind = 'treatment' and treatment_type in ('injectable', 'laser'))
  )
);

create index if not exists appointments_user_scheduled_idx on public.appointments (user_id, scheduled_at desc);
create index if not exists appointments_user_status_scheduled_idx on public.appointments (user_id, status, scheduled_at);

alter table public.appointments enable row level security;

create policy "appointments_all_own" on public.appointments
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
