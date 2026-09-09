import { isItemFromSubscribedPublisher } from '@moxt/shared/utils/subscriptionUtils.js'
import { listingBoostBonus, marketplaceBoostLookup } from './marketplaceListingBoost.js'
import { asArray, asIdLookup, mapGet } from '../feed/feedCollectionUtils.js'
import { isActiveVideo } from '../videos/videoUtils.js'

const MS_HOUR = 60 * 60 * 1000

export function listingEngagement(listing) {
  return (
    Number(listing?.views || 0) +
    Number(listing?.favorites?.length || 0) * 4 +
    Number(listing?.contactCount || 0) * 6 +
    Number(listing?.shareCount || 0) * 3
  )
}

export function hoursSince(iso, now = Date.now()) {
  const time = new Date(iso || 0).getTime()
  if (!Number.isFinite(time)) return 9999
  return Math.max(0, (now - time) / MS_HOUR)
}

export function listingAffinityKey(listing) {
  return `${listing?.type || 'other'}::${listing?.category || ''}`
}

export function hasListingPersonalization({
  favorites = [],
  viewedListings = [],
  impressionListings = [],
  userId,
  minSignals = 2,
} = {}) {
  if (!userId) return false
  let signals = 0
  for (const fav of favorites) {
    if (fav.userId && fav.userId !== userId) continue
    if (fav.relatedType === 'listing') signals += 1
  }
  for (const viewed of viewedListings) {
    if (viewed.userId && viewed.userId !== userId) continue
    signals += 1
  }
  for (const impression of impressionListings) {
    if (impression.userId && impression.userId !== userId) continue
    signals += 1
  }
  return signals >= minSignals
}

export function buildListingAffinity({
  listingsById,
  favorites = [],
  viewedListings = [],
  impressionListings = [],
  userId,
}) {
  const typeWeights = {}
  const categoryWeights = {}
  const byId = asIdLookup(listingsById)

  function bump(type, category, weight) {
    if (type) typeWeights[type] = (typeWeights[type] || 0) + weight
    if (category) categoryWeights[category] = (categoryWeights[category] || 0) + weight
  }

  for (const fav of asArray(favorites)) {
    if (fav.userId && fav.userId !== userId) continue
    if (fav.relatedType !== 'listing') continue
    const listing = mapGet(byId, fav.relatedId)
    bump(listing?.type || fav.snapshot?.type, listing?.category || fav.snapshot?.category, 3)
  }

  for (const viewed of asArray(viewedListings)) {
    if (viewed.userId && viewed.userId !== userId) continue
    const listing = mapGet(byId, viewed.listingId)
    bump(listing?.type, listing?.category, 1)
  }

  for (const impression of asArray(impressionListings)) {
    if (impression.userId && impression.userId !== userId) continue
    const listing = mapGet(byId, impression.listingId)
    bump(listing?.type, listing?.category, 0.45)
  }

  return { typeWeights, categoryWeights }
}

export function scoreMarketplaceListing(listing, ctx) {
  const now = ctx.now || Date.now()
  const hours = hoursSince(listing.createdAt || listing.updatedAt, now)
  const engagement = listingEngagement(listing)
  const affinity = ctx.affinity || { typeWeights: {}, categoryWeights: {} }
  const userCity = (ctx.userCity || '').trim().toLowerCase()
  const listingCity = `${listing.city || ''} ${listing.district || ''}`.toLowerCase()

  let score = 0
  score += Math.max(0, 72 - hours) * 0.35
  score += Math.log10(1 + engagement) * 14
  score += Math.min((listing.images || []).filter(Boolean).length, 5) * 1.6
  if (listing.hasDiscount || Number(listing.discountPercent) > 0) score += 4
  if (userCity && listingCity.includes(userCity)) score += 10
  score += Number(affinity.typeWeights[listing.type] || 0) * 2.2
  score += Number(affinity.categoryWeights[listing.category] || 0) * 3.4
  score += listingBoostBonus(listing.id, ctx.boostLookup, now)

  if (ctx.userId && isItemFromSubscribedPublisher(listing, ctx.subscriptions, ctx.userId)) {
    score += 16
  }

  if (ctx.viewedIds?.has(listing.id)) score -= 3
  if (ctx.impressionIds?.has(listing.id)) score -= 1.5
  if (listing.ownerId && listing.ownerId === ctx.userId) score -= 8

  const haystack =
    `${listing.title || ''} ${listing.category || ''} ${listing.city || ''} ${listing.description || ''} ${listing.businessName || ''}`.toLowerCase()
  for (const term of ctx.searchTerms || []) {
    const needle = String(term || '').trim().toLowerCase()
    if (needle.length >= 2 && haystack.includes(needle)) score += 18
  }

  if (ctx.userId) {
    for (const fav of ctx.favorites || []) {
      if (fav.userId && fav.userId !== ctx.userId) continue
      if (fav.relatedType !== 'listing') continue
      if (String(fav.relatedId) !== String(listing.id)) continue
      const likeHours = hoursSince(fav.createdAt || fav.updatedAt, now)
      score += Math.max(0, 72 - likeHours) * 0.55
    }
  }

  return score
}

export function diversifyMarketplaceFeed(scored, { windowSize = 2 } = {}) {
  const remaining = [...scored]
  const ordered = []

  while (remaining.length) {
    const recent = ordered.slice(-windowSize)
    const recentKeys = new Set(recent.map((item) => listingAffinityKey(item.listing)))
    const pickIndex = remaining.findIndex((item) => !recentKeys.has(listingAffinityKey(item.listing)))
    const index = pickIndex === -1 ? 0 : pickIndex
    ordered.push(remaining.splice(index, 1)[0])
  }

  return ordered.map((item) => item.listing)
}

function takeUnique(source, limit, excludeIds) {
  const picked = []
  for (const listing of source) {
    if (excludeIds.has(listing.id)) continue
    picked.push(listing)
    excludeIds.add(listing.id)
    if (picked.length >= limit) break
  }
  return picked
}

function resolveRailSize(listLength, railSize) {
  if (listLength >= 18) return railSize
  if (listLength >= 12) return Math.min(railSize, 6)
  return Math.min(railSize, Math.max(2, Math.floor(listLength / 3)))
}

export function buildMarketplaceDiscovery(listings, ctx = {}) {
  const now = ctx.now || Date.now()
  const railSize = resolveRailSize(listings?.length || 0, ctx.railSize || 8)
  const list = Array.isArray(listings) ? listings : []
  const listingsById = new Map(list.map((item) => [item.id, item]))
  const affinity =
    ctx.affinity ||
    buildListingAffinity({
      listingsById,
      favorites: ctx.favorites,
      viewedListings: ctx.viewedListings,
      impressionListings: ctx.impressionListings,
      userId: ctx.userId,
    })
  const viewedIds = new Set(
    (ctx.viewedListings || [])
      .filter((item) => !ctx.userId || item.userId === ctx.userId)
      .map((item) => item.listingId),
  )
  const impressionIds = new Set(
    (ctx.impressionListings || [])
      .filter((item) => !ctx.userId || item.userId === ctx.userId)
      .map((item) => item.listingId),
  )
  const boostLookup = ctx.boostLookup || marketplaceBoostLookup(ctx.feedBoosts, now)
  const scoreCtx = { ...ctx, now, affinity, viewedIds, impressionIds, boostLookup }
  const scored = list
    .map((listing) => ({ listing, score: scoreMarketplaceListing(listing, scoreCtx) }))
    .sort((a, b) => b.score - a.score || String(a.listing.id).localeCompare(String(b.listing.id)))

  const ranked = scored.map((item) => item.listing)
  const showRails = Boolean(ctx.showRails) && list.length >= 6 && !ctx.searching
  const railUsed = new Set()

  let forYou = []
  let trending = []
  let fresh = []
  if (showRails) {
    forYou = takeUnique(ranked, railSize, railUsed)
    const trendingSource = [...list].sort((a, b) => {
      const eng = listingEngagement(b) - listingEngagement(a)
      if (eng) return eng
      return hoursSince(a.createdAt, now) - hoursSince(b.createdAt, now)
    })
    trending = takeUnique(trendingSource, railSize, railUsed)
    fresh = takeUnique(
      [...list].sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime(),
      ),
      railSize,
      railUsed,
    )
  }

  const discoverScored = showRails
    ? scored.filter((item) => !railUsed.has(item.listing.id))
    : scored
  const discover = diversifyMarketplaceFeed(discoverScored.length ? discoverScored : scored)

  const personalized = hasListingPersonalization({
    favorites: ctx.favorites,
    viewedListings: ctx.viewedListings,
    impressionListings: ctx.impressionListings,
    userId: ctx.userId,
  })

  return {
    forYou,
    trending,
    fresh,
    discover,
    personalized,
    railListingIds: [...railUsed],
  }
}

/** Vidéos marketplace : likes, recherches, vues et récence. */
export function rankMarketplaceVideos(videos = [], ctx = {}) {
  const now = ctx.now || Date.now()
  const terms = (ctx.searchTerms || [])
    .map((term) => String(term || '').trim().toLowerCase())
    .filter((term) => term.length >= 2)
  const userId = ctx.userId

  return (videos || [])
    .filter(isActiveVideo)
    .map((video) => {
      const likes = Array.isArray(video.likes) ? video.likes.map(String) : []
      let score = Math.max(0, 72 - hoursSince(video.createdAt, now)) * 0.4
      score += Math.log10(1 + Number(video.viewCount || 0) + likes.length * 4) * 12
      const haystack = `${video.title || ''} ${video.caption || ''} ${video.businessName || ''}`.toLowerCase()
      for (const term of terms) {
        if (haystack.includes(term)) score += 18
      }
      if (userId && likes.includes(String(userId))) score += 20
      return { video, score }
    })
    .sort((a, b) => b.score - a.score || String(b.video.id).localeCompare(String(a.video.id)))
    .map((row) => row.video)
}
