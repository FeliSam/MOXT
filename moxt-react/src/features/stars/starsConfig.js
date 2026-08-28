export const STARS_CATEGORIES = ['marketplace', 'jobs', 'events', 'parcel', 'video', 'status']

export const PUBLISH_FORMULAS = ['standard', 'featured_24h', 'featured_7d']

export const BONUS_POOL_CATEGORY = 'pool'

/** Quotas Personal vs Business — config centralisée. enabled + rolloutPercent=100 = actif pour tous. */
export const DEFAULT_QUOTA_CONFIG = {
  enabled: true,
  rolloutPercent: 100,
  pilotUserIds: [],
  monthlyBonusPool: { personal: 30, business: 100 },
  publish: {
    marketplace: 20,
    jobs: 20,
    events: 20,
    parcel: 20,
    video: 25,
  },
  publishFormulas: {
    standard: { boostHours: 0 },
    featured_24h: {
      boostHours: 24,
      cost: { default: 45, video: 55 },
    },
    featured_7d: {
      boostHours: 168,
      cost: { default: 90, video: 110 },
    },
  },
  boostFormulas: {
    '24h': { hours: 24, cost: { default: 25, video: 35 } },
    '3d': { hours: 72, cost: { default: 55, video: 75 } },
    '7d': { hours: 168, cost: { default: 95, video: 125 } },
  },
  statusDurations: {
    '24h': { hours: 24, cost: 15 },
    '3d': { hours: 72, cost: 28 },
    '7d': { hours: 168, cost: 40 },
  },
}

export function planKeyForOwnerType(ownerType) {
  return ownerType === 'business' ? 'business' : 'personal'
}

export function monthlyBonusPoolForPlan(ownerType, config = DEFAULT_QUOTA_CONFIG) {
  const plan = planKeyForOwnerType(ownerType)
  return Number(config.monthlyBonusPool?.[plan] ?? 0)
}

export function statusExpiresAt(durationKey, from = new Date(), config = DEFAULT_QUOTA_CONFIG) {
  const hours = Number(config.statusDurations?.[durationKey]?.hours || 24)
  return new Date(from.getTime() + hours * 60 * 60 * 1000).toISOString()
}
