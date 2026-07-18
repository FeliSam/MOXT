alter table public.posts
  add column if not exists images jsonb not null default '[]'::jsonb;

update public.posts
set images = jsonb_build_array(image_url)
where image_url is not null
  and image_url <> ''
  and (images is null or images = '[]'::jsonb or jsonb_typeof(images) <> 'array' or jsonb_array_length(images) = 0);

notify pgrst, 'reload schema';
