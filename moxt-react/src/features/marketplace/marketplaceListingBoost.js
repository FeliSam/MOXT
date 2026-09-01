import { boostPriority, buildBoostLookup } from '../feed/feedBoostUtils.js'
import { mapGet, mapHas } from '../feed/feedCollectionUtils.js'

export function marketplaceBoostLookup(feedBoosts = [], now = Date.now()) {
  return buildBoostLookup(feedBoosts, now)
}

export function listingBoostBonus(listingId, boostLookup, now = Date.now()) {
  const boost = mapGet(boostLookup, `listing:${listingId}`)
  if (!boost) return 0
  return boostPriority(boost, now) * 0.07
}

export function listingIsBoosted(listingId, boostLookup) {
  return mapHas(boostLookup, `listing:${listingId}`)
}
