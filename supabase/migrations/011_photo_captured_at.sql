-- Per-photo capture timestamps, parallel to photo_urls (same index = same photo).

alter table public.treatments
  add column if not exists photo_captured_at timestamptz[] not null default '{}';

-- Legacy rows: one timestamp per path, using treatment_date for each slot.
update public.treatments t
set photo_captured_at = (
  select array_agg(t.treatment_date order by g.g)
  from generate_series(1, array_length(t.photo_urls, 1)) as g(g)
)
where coalesce(array_length(t.photo_urls, 1), 0) > 0
  and (
    photo_captured_at = '{}'::timestamptz[]
    or coalesce(array_length(photo_captured_at, 1), 0) <> coalesce(array_length(t.photo_urls, 1), 0)
  );
