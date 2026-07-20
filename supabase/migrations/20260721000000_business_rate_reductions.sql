-- Business FX: % reduction on Frankfurter rate per transfer direction.
alter table public.businesses
  add column if not exists rate_reduction_to_ru numeric not null default 0,
  add column if not exists rate_reduction_from_ru numeric not null default 0;

comment on column public.businesses.rate_reduction_to_ru is
  'Percent haircut on Frankfurter when transferring toward Russia (origin -> RU).';
comment on column public.businesses.rate_reduction_from_ru is
  'Percent haircut on Frankfurter when transferring from Russia (RU -> origin).';
