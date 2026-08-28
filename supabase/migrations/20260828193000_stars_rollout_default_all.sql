-- Activer les bonus Stars pour tous les utilisateurs (rollout 100 %).

update public.stars_quota_config
set config = coalesce(config, '{}'::jsonb)
  || jsonb_build_object('enabled', true, 'rolloutPercent', 100),
    updated_at = now()
where id = 1;
