-- Public logo URL for global (directory) providers. Set via SQL/ops, not the mobile app.
alter table public.providers
  add column if not exists logo_url text;

comment on column public.providers.logo_url is
  'Optional HTTPS URL to a PNG/JPEG logo; intended for is_global directory entries.';
