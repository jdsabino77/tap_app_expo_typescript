-- Treatment photo paths (private bucket). Paths are `{user_id}/{treatment_id}/{uuid}.ext`.

alter table public.treatments
  add column if not exists photo_urls text[] not null default '{}';

-- ---------------------------------------------------------------------------
-- Storage: private bucket + policies (first path segment = auth.uid())
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('treatment-photos', 'treatment-photos', false)
on conflict (id) do nothing;

create policy "treatment_photos_select_own"
on storage.objects for select
to authenticated
using (
  bucket_id = 'treatment-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "treatment_photos_insert_own"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'treatment-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "treatment_photos_update_own"
on storage.objects for update
to authenticated
using (
  bucket_id = 'treatment-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'treatment-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "treatment_photos_delete_own"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'treatment-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);
