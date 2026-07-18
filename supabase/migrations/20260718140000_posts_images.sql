-- Posts: up to 4 images in the news feed (keep image_url as cover = images[0])

alter table public.posts
  add column if not exists images jsonb not null default '[]'::jsonb;

-- Backfill from legacy single image_url
update public.posts
set images = jsonb_build_array(image_url)
where image_url is not null
  and image_url <> ''
  and (images is null or images = '[]'::jsonb or jsonb_typeof(images) <> 'array' or jsonb_array_length(images) = 0);

comment on column public.posts.images is 'Public image URLs for the post (max 4). image_url mirrors images[0].';

notify pgrst, 'reload schema';
