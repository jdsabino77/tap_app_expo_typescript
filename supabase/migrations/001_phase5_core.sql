-- T.A.P Phase 5 — run in Supabase SQL Editor (or supabase db push).
-- Creates core tables + RLS + profile trigger for new auth users.

-- ---------------------------------------------------------------------------
-- profiles (1:1 with auth.users)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  first_name text,
  last_name text,
  display_name text,
  photo_url text,
  treatment_count int not null default 0,
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_login_at timestamptz
);

-- ---------------------------------------------------------------------------
-- medical_profiles (one row per user)
-- ---------------------------------------------------------------------------
create table if not exists public.medical_profiles (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  date_of_birth date not null,
  gender text not null,
  ethnicity text not null,
  skin_type text not null,
  allergies text[] not null default '{}',
  medications text[] not null default '{}',
  medical_conditions text[] not null default '{}',
  previous_treatments text[] not null default '{}',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- providers
-- ---------------------------------------------------------------------------
create table if not exists public.providers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text not null default '',
  city text not null default '',
  province text not null default '',
  postal_code text not null default '',
  phone text not null default '',
  email text not null default '',
  website text not null default '',
  specialties text[] not null default '{}',
  is_verified boolean not null default false,
  is_global boolean not null default false,
  user_id uuid references public.profiles (id) on delete set null,
  created_by uuid references public.profiles (id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists providers_global_name_idx on public.providers (is_global, name);
create index if not exists providers_user_name_idx on public.providers (user_id, name);

-- ---------------------------------------------------------------------------
-- treatments
-- ---------------------------------------------------------------------------
create table if not exists public.treatments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  treatment_type text not null,
  service_type text not null,
  brand text not null default '',
  treatment_areas text[] not null default '{}',
  units int not null default 0,
  provider_id uuid references public.providers (id) on delete set null,
  treatment_date timestamptz not null,
  notes text not null default '',
  cost numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists treatments_user_date_idx on public.treatments (user_id, treatment_date desc);

-- ---------------------------------------------------------------------------
-- New user → profiles row
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  fn text := coalesce(new.raw_user_meta_data->>'first_name', '');
  ln text := coalesce(new.raw_user_meta_data->>'last_name', '');
  dn text := trim(both ' ' from (fn || ' ' || ln));
begin
  insert into public.profiles (id, email, first_name, last_name, display_name)
  values (
    new.id,
    new.email,
    nullif(fn, ''),
    nullif(ln, ''),
    nullif(dn, '')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.medical_profiles enable row level security;
alter table public.providers enable row level security;
alter table public.treatments enable row level security;

create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

create policy "medical_profiles_all_own" on public.medical_profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "treatments_all_own" on public.treatments
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "providers_select_visible" on public.providers
  for select using (is_global = true or user_id = auth.uid());
create policy "providers_insert_own" on public.providers
  for insert with check (
    auth.uid() = created_by
    and is_global = false
    and (user_id = auth.uid() or user_id is null)
  );
create policy "providers_update_own" on public.providers
  for update using (user_id = auth.uid());
create policy "providers_delete_own" on public.providers
  for delete using (user_id = auth.uid());
