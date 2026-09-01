import { feedItemKey } from './feedItemUtils.js'
import {
  annotateTrendingItems,
  diversifyFeedItems,
  sortByFeedScore,
} from './feedRankUtils.js'
import { asArray } from './feedCollectionUtils.js'

/** Entre deux contenus boostés, au moins N items organiques. */
export const FEED_ORGANIC_BETWEEN_BOOSTS = 4

const ENTITY_TO_KIND = {
  marketplace: 'listing',
  listing: 'listing',
  video: 'video',
  parcel: 'parcel',
  job: 'job',
  jobs: 'job',
  event: 'event',
  events: 'event',
  post: 'post',
  p2p: 'p2p',
}

const BOOST_FORMULA_WEIGHT = {
  featured_7d: 300,
  featured_3d: 200,
  featured_24h: 100,
}

export function entityTypeToFeedKind(entityType) {
  return ENTITY_TO_KIND[String(entityType || '').trim().toLowerCase()] || null
}

export function feedItemIdFromBoost(boost) {
  const kind = entityTypeToFeedKind(boost?.entity_type)
  const entityId = boost?.entity_id
  if (!kind || !entityId) return null
  return feedItemKey(kind, entityId)
}

export function boostPriority(boost, now = Date.now()) {
  const formula = String(boost?.formula_key || boost?.formulaKey || '')
  const base = BOOST_FORMULA_WEIGHT[formula] ?? 50
  const expiresAt = boost?.expires_at || boost?.expiresAt
  const hoursLeft = expiresAt
    ? Math.max(0, (new Date(expiresAt).getTime() - now) / (60 * 60 * 1000))
    : 0
  return base + Math.min(48, hoursLeft)
}

function normalizeBoostList(boosts) {
  return asArray(boosts).filter((row) => row && typeof row === 'object')
}

function asBoostLookup(lookup, now = Date.now()) {
  if (lookup instanceof Map) return lookup
  return buildBoostLookup(normalizeBoostList(lookup), now)
}

/** Map feed item id → boost actif. */
export function buildBoostLookup(boosts = [], now = Date.now()) {
  const map = new Map()
  for (const boost of normalizeBoostList(boosts)) {
    if (String(boost?.status || 'active').toLowerCase() !== 'active') continue
    const expiresAt = boost?.expires_at || boost?.expiresAt
    if (expiresAt && new Date(expiresAt).getTime() <= now) continue
    const itemId = feedItemIdFromBoost(boost)
    if (!itemId) continue
    const existing = map.get(itemId)
    if (!existing || boostPriority(boost, now) > boostPriority(existing, now)) {
      map.set(itemId, boost)
    }
  }
  return map
}

function sortByRecency(items) {
  return [...items].sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')))
}

function sortByBoostPriority(items, now = Date.now()) {
  return [...items].sort((a, b) => {
    const diff = boostPriority(b.boost, now) - boostPriority(a.boost, now)
    if (diff !== 0) return diff
    return String(b.createdAt || '').localeCompare(String(a.createdAt || ''))
  })
}

/**
 * Vedette Stars en tête (priorité formule), contenu organique scoré (tendance/promo/abos),
 * puis intercalage 1 boosté / N organiques.
 */
export function sortFeedItemsWithBoosts(items, boostLookup = new Map(), rankCtx = {}) {
  if (!items.length) return items

  const now = rankCtx.now || Date.now()
  const lookup = asBoostLookup(boostLookup, now)
  const annotated = items.map((item) =>
    lookup.has(item.id)
      ? { ...item, isFeatured: true, boost: lookup.get(item.id) }
      : { ...item, isFeatured: false, boost: null },
  )

  if (!lookup.size) {
    const organic = diversifyFeedItems(sortByFeedScore(annotated, rankCtx))
    return annotateTrendingItems(organic)
  }

  const boosted = sortByBoostPriority(
    annotated.filter((item) => item.isFeatured),
    now,
  )
  const organic = diversifyFeedItems(sortByFeedScore(
    annotated.filter((item) => !item.isFeatured),
    rankCtx,
  ))

  const result = []

  if (boosted.length) {
    result.push(boosted[0])
  }

  let boostIndex = 1
  let organicIndex = 0
  let organicSinceBoost = 0

  while (organicIndex < organic.length || boostIndex < boosted.length) {
    const canInsertBoost =
      boostIndex < boosted.length &&
      (organicSinceBoost >= FEED_ORGANIC_BETWEEN_BOOSTS || organicIndex >= organic.length)

    if (canInsertBoost) {
      result.push(boosted[boostIndex++])
      organicSinceBoost = 0
    } else if (organicIndex < organic.length) {
      result.push(organic[organicIndex++])
      organicSinceBoost += 1
    } else if (boostIndex < boosted.length) {
      result.push(boosted[boostIndex++])
      organicSinceBoost = 0
    }
  }

  return annotateTrendingItems(result)
}

/** @deprecated use sortByFeedScore via sortFeedItemsWithBoosts */
export function sortByRecencyOnly(items) {
  return sortByRecency(items)
}
