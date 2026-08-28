-- Packs Stars supplémentaires (entrée + intermédiaire + pro).

insert into public.stars_packages (id, stars, price_rub, bonus_stars, title, sort_order, active)
values
  ('pack-25', 25, 79, 0, '25 Stars', 5, true),
  ('pack-250', 250, 649, 25, '250 Stars + 25', 25, true),
  ('pack-1000', 1000, 1990, 150, '1000 Stars + 150', 40, true)
on conflict (id) do update set
  stars = excluded.stars,
  price_rub = excluded.price_rub,
  bonus_stars = excluded.bonus_stars,
  title = excluded.title,
  sort_order = excluded.sort_order,
  active = excluded.active,
  updated_at = now();

update public.stars_packages set sort_order = 10 where id = 'pack-50';
update public.stars_packages set sort_order = 20 where id = 'pack-150';
update public.stars_packages set sort_order = 30 where id = 'pack-400';
