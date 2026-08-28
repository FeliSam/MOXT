import { DEFAULT_QUOTA_CONFIG } from '../stars/starsConfig'

export const ADMIN_PUBLISH_KEYS = ['marketplace', 'jobs', 'events', 'parcel', 'video']
export const ADMIN_DURATION_KEYS = ['24h', '3d', '7d']

function parseStars(value, fallback) {
  const parsed = Number.parseInt(String(value ?? '').trim(), 10)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback
}

export function pricingFormFromConfig(config = {}) {
  const base = { ...DEFAULT_QUOTA_CONFIG, ...config }
  return {
    poolPersonal: String(base.monthlyBonusPool?.personal ?? DEFAULT_QUOTA_CONFIG.monthlyBonusPool.personal),
    poolBusiness: String(base.monthlyBonusPool?.business ?? DEFAULT_QUOTA_CONFIG.monthlyBonusPool.business),
    publish: Object.fromEntries(
      ADMIN_PUBLISH_KEYS.map((key) => [key, String(base.publish?.[key] ?? DEFAULT_QUOTA_CONFIG.publish[key])]),
    ),
    featured24hDefault: String(
      base.publishFormulas?.featured_24h?.cost?.default ?? DEFAULT_QUOTA_CONFIG.publishFormulas.featured_24h.cost.default,
    ),
    featured24hVideo: String(
      base.publishFormulas?.featured_24h?.cost?.video ?? DEFAULT_QUOTA_CONFIG.publishFormulas.featured_24h.cost.video,
    ),
    featured7dDefault: String(
      base.publishFormulas?.featured_7d?.cost?.default ?? DEFAULT_QUOTA_CONFIG.publishFormulas.featured_7d.cost.default,
    ),
    featured7dVideo: String(
      base.publishFormulas?.featured_7d?.cost?.video ?? DEFAULT_QUOTA_CONFIG.publishFormulas.featured_7d.cost.video,
    ),
    status: Object.fromEntries(
      ADMIN_DURATION_KEYS.map((key) => [
        key,
        String(base.statusDurations?.[key]?.cost ?? DEFAULT_QUOTA_CONFIG.statusDurations[key].cost),
      ]),
    ),
    boostDefault: Object.fromEntries(
      ADMIN_DURATION_KEYS.map((key) => [
        key,
        String(base.boostFormulas?.[key]?.cost?.default ?? DEFAULT_QUOTA_CONFIG.boostFormulas[key].cost.default),
      ]),
    ),
    boostVideo: Object.fromEntries(
      ADMIN_DURATION_KEYS.map((key) => [
        key,
        String(base.boostFormulas?.[key]?.cost?.video ?? DEFAULT_QUOTA_CONFIG.boostFormulas[key].cost.video),
      ]),
    ),
  }
}

export function mergePricingIntoConfig(baseConfig, form) {
  const base = { ...(baseConfig || DEFAULT_QUOTA_CONFIG) }
  const defaults = DEFAULT_QUOTA_CONFIG

  return {
    ...base,
    monthlyBonusPool: {
      personal: parseStars(form.poolPersonal, defaults.monthlyBonusPool.personal),
      business: parseStars(form.poolBusiness, defaults.monthlyBonusPool.business),
    },
    publish: {
      ...base.publish,
      ...Object.fromEntries(
        ADMIN_PUBLISH_KEYS.map((key) => [key, parseStars(form.publish?.[key], defaults.publish[key])]),
      ),
    },
    publishFormulas: {
      standard: { boostHours: 0 },
      featured_24h: {
        boostHours: defaults.publishFormulas.featured_24h.boostHours,
        cost: {
          default: parseStars(form.featured24hDefault, defaults.publishFormulas.featured_24h.cost.default),
          video: parseStars(form.featured24hVideo, defaults.publishFormulas.featured_24h.cost.video),
        },
      },
      featured_7d: {
        boostHours: defaults.publishFormulas.featured_7d.boostHours,
        cost: {
          default: parseStars(form.featured7dDefault, defaults.publishFormulas.featured_7d.cost.default),
          video: parseStars(form.featured7dVideo, defaults.publishFormulas.featured_7d.cost.video),
        },
      },
    },
    statusDurations: {
      '24h': { hours: 24, cost: parseStars(form.status?.['24h'], defaults.statusDurations['24h'].cost) },
      '3d': { hours: 72, cost: parseStars(form.status?.['3d'], defaults.statusDurations['3d'].cost) },
      '7d': { hours: 168, cost: parseStars(form.status?.['7d'], defaults.statusDurations['7d'].cost) },
    },
    boostFormulas: {
      '24h': {
        hours: 24,
        cost: {
          default: parseStars(form.boostDefault?.['24h'], defaults.boostFormulas['24h'].cost.default),
          video: parseStars(form.boostVideo?.['24h'], defaults.boostFormulas['24h'].cost.video),
        },
      },
      '3d': {
        hours: 72,
        cost: {
          default: parseStars(form.boostDefault?.['3d'], defaults.boostFormulas['3d'].cost.default),
          video: parseStars(form.boostVideo?.['3d'], defaults.boostFormulas['3d'].cost.video),
        },
      },
      '7d': {
        hours: 168,
        cost: {
          default: parseStars(form.boostDefault?.['7d'], defaults.boostFormulas['7d'].cost.default),
          video: parseStars(form.boostVideo?.['7d'], defaults.boostFormulas['7d'].cost.video),
        },
      },
    },
  }
}
