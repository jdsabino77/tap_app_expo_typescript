-- Body region for treatment area picker UI (head | upper_body | lower_body).

alter table public.treatment_areas
  add column if not exists region text not null default 'head';

-- Backfill from legacy fine-grained category (002_reference_catalogs.sql).
update public.treatment_areas
set region = 'head'
where category in ('Upper face', 'Mid face', 'Lower face');

update public.treatment_areas
set region = 'upper_body'
where category in ('Neck', 'Body');

-- Uncategorized / admin-only names: treat as upper body (general body work, not face).
update public.treatment_areas
set region = 'upper_body'
where region = 'head'
  and (category is null or btrim(category) = '');

alter table public.treatment_areas
  drop constraint if exists treatment_areas_region_check;

alter table public.treatment_areas
  add constraint treatment_areas_region_check
  check (region in ('head', 'upper_body', 'lower_body'));

comment on column public.treatment_areas.region is 'UI grouping: head, upper_body, lower_body. Fine-grained label may remain in category for admin notes.';

-- New catalog rows (idempotent by name).
insert into public.treatment_areas (name, category, region, sort_order)
select v.name, v.category, v.region, v.sort_order
from (
  values
    ('Arms'::text, 'Upper body'::text, 'upper_body'::text, 200),
    ('Hands', 'Upper body', 'upper_body', 210),
    ('Chest', 'Upper body', 'upper_body', 220),
    ('Stomach', 'Upper body', 'upper_body', 230),
    ('Back', 'Upper body', 'upper_body', 240),
    ('Legs', 'Lower body', 'lower_body', 300),
    ('Feet', 'Lower body', 'lower_body', 310),
    ('Buttocks', 'Lower body', 'lower_body', 320)
) as v(name, category, region, sort_order)
where not exists (select 1 from public.treatment_areas t where t.name = v.name);
