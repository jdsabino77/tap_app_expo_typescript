begin;

do $$
begin
  if not exists (
    select 1
    from public.providers
    where id = '68e8c3ca-b2d5-4cf9-a3a1-ab40c925c283'
  ) then
    raise exception 'Default provider id 68e8c3ca-b2d5-4cf9-a3a1-ab40c925c283 not found in public.providers';
  end if;
end
$$;

update public.treatments
set provider_id = '68e8c3ca-b2d5-4cf9-a3a1-ab40c925c283'
where provider_id is null;

alter table public.treatments
  alter column provider_id set not null;

alter table public.treatments
  drop constraint if exists treatments_provider_id_fkey;

alter table public.treatments
  add constraint treatments_provider_id_fkey
  foreign key (provider_id)
  references public.providers (id)
  on delete restrict;

commit;
