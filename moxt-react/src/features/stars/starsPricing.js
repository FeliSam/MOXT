import { DEFAULT_QUOTA_CONFIG, PUBLISH_FORMULAS } from './starsConfig'

export { PUBLISH_FORMULAS }

/**
 * Coût total d’une action Stars (publication, statut ou formule vedette).
 * Miroir client de `moxt_stars_resolve_cost` côté Supabase.
 */
export function resolveStarsActionCost({
  category,
  formulaKey = 'standard',
  durationKey = null,
  entityType = null,
  config = DEFAULT_QUOTA_CONFIG,
} = {}) {
  if (category === 'boost' && durationKey) {
    return resolveBoostCost({ entityType: entityType || 'marketplace', durationKey, config })
  }

  if (category === 'status' && durationKey) {
    return Number(config.statusDurations?.[durationKey]?.cost ?? 15)
  }

  if (!formulaKey || formulaKey === 'standard') {
    return Number(config.publish?.[category] ?? 20)
  }

  const formula = config.publishFormulas?.[formulaKey]
  const costs = formula?.cost
  if (typeof costs === 'number') return costs
  if (costs && typeof costs === 'object') {
    const resolved = costs[category] ?? costs.default
    if (resolved != null) return Number(resolved)
  }

  return Number(config.publish?.[category] ?? 20)
}

export function resolveBoostCost({
  entityType = 'marketplace',
  durationKey = '24h',
  config = DEFAULT_QUOTA_CONFIG,
} = {}) {
  const entry = config.boostFormulas?.[durationKey]
  const costs = entry?.cost
  if (typeof costs === 'number') return costs
  if (costs && typeof costs === 'object') {
    const key = entityType === 'video' ? 'video' : 'default'
    return Number(costs[key] ?? costs.default ?? 25)
  }
  return 25
}

export function publishFormulaMeta(formulaKey, config = DEFAULT_QUOTA_CONFIG) {
  const formula = config.publishFormulas?.[formulaKey] || {}
  return {
    key: formulaKey,
    boostHours: Number(formula.boostHours || 0),
  }
}
