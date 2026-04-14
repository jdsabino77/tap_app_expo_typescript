-- Private bucket for profile photos. Object paths: `{user_id}/avatar.{ext}` (first segment = auth.uid()).
-- `profiles.photo_url` stores the storage object path (same pattern as `treatment-photos`).

insert into storage.buckets (id, name, public)
values ('profile-avatars', 'profile-avatars', false)
on conflict (id) do nothing;

create policy "profile_avatars_select_own"
on storage.objects for select
to authenticated
using (
  bucket_id = 'profile-avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "profile_avatars_insert_own"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'profile-avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "profile_avatars_update_own"
on storage.objects for update
to authenticated
using (
  bucket_id = 'profile-avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'profile-avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "profile_avatars_delete_own"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'profile-avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Keep `profiles.email` aligned with `auth.users.email` after confirmation / updates.
create or replace function public.sync_profile_email_from_auth()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set
    email = new.email,
    updated_at = now()
  where id = new.id;
  return new;
end;
$$;

drop trigger if exists on_auth_user_updated_sync_profile_email on auth.users;
create trigger on_auth_user_updated_sync_profile_email
  after update of email on auth.users
  for each row
  when (old.email is distinct from new.email)
  execute function public.sync_profile_email_from_auth();
