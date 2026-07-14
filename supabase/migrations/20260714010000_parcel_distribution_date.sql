-- Date à partir de laquelle les destinataires peuvent récupérer le colis
alter table public.parcels
  add column if not exists distribution_date text;
