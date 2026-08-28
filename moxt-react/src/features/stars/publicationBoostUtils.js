import { PUBLISH_FORMULAS } from './starsConfig'

const DURATION_TO_FORMULA = {
  '24h': 'featured_24h',
  '3d': 'featured_3d',
  '7d': 'featured_7d',
}

/** Types publication UI → catégorie Stars / entity_type Supabase. */
const PUBLICATION_TO_ENTITY = {
  listing: 'marketplace',
  job: 'jobs',
  event: 'events',
  parcel: 'parcel',
  video: 'video',
}

export const BOOST_DURATIONS = ['24h', '3d', '7d']

export function publicationTypeToEntityType(publicationType) {
  return PUBLICATION_TO_ENTITY[String(publicationType || '').trim()] || null
}

export function boostDurationToFormulaKey(durationKey) {
  return DURATION_TO_FORMULA[durationKey] || `featured_${durationKey}`
}

export function isBoostablePublicationType(publicationType) {
  return Boolean(publicationTypeToEntityType(publicationType))
}

export function activeBoostForEntity(feedBoosts = [], entityType, entityId) {
  const target = `${entityType}:${entityId}`
  const now = Date.now()
  return (feedBoosts || []).find((row) => {
    if (String(row?.status || 'active').toLowerCase() !== 'active') return false
    if (new Date(row.expires_at || row.expiresAt).getTime() <= now) return false
    return `${row.entity_type}:${row.entity_id}` === target
  })
}

export function isFeaturedFormula(formulaKey) {
  return PUBLISH_FORMULAS.includes(formulaKey) && formulaKey !== 'standard'
}
