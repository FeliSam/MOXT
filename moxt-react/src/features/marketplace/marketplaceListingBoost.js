import { boostPriority, buildBoostLookup } from '../feed/feedBoostUtils.js'

export function marketplaceBoostLookup(feedBoosts = [], now = Date.now()) {
  return buildBoostLookup(feedBoosts, now)
}

export function listingBoostBonus(listingId, boostLookup, now = Date.now()) {
  const boost = boostLookup?.get?.(`listing:${listingId}`)
  if (!boost) return 0
  return boostPriority(boost, now) * 0.07
}

export function listingIsBoosted(listingId, boostLookup) {
  return Boolean(boostLookup?.has?.(`listing:${listingId}`))
}
