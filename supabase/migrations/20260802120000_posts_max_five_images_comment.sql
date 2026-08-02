-- Posts feed: raise documented image cap to 5 (enforced in app + storage upload).
comment on column public.posts.images is 'Public image URLs for the post (max 5). image_url mirrors images[0].';
