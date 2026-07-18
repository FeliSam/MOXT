alter table public.business_documents add column if not exists category text not null default 'company';
