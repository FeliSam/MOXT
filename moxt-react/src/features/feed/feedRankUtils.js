import { isSubscribedToPublisher } from '@moxt/shared/utils/subscriptionUtils.js'
import {
  buildListingAffinity,
  hoursSince,
  scoreMarketplaceListing,
} from '../marketplace/marketplaceFeed.js'
import { readWatchedVideoIds, watchedVideoIndex } from '../videos/videoWatchHistory.js'

/** Engagement unifié (vues, likes, commentaires, partages). */
export function feedEngagement(item) {
  const stats = item?.stats || {}
  return (
    Number(stats.views || 0) +
    Number(stats.likes || 0) * 4 +
    Number(stats.comments || 0) * 3 +
    Number(stats.shares || 0) * 3
  )
}

export function isPromotedListing(item) {
  if (item?.kind !== 'listing') return false
  const src = item.source || {}
  return Boolean(src.hasDiscount || Number(src.discountPercent) > 0)
}

function isSubscribedFeedPublisher(item, ctx) {
  if (!ctx?.userId || !item?.publisher?.id) return false
  const publisherType = item.publisher.type === 'business' ? 'business' : 'user'
  return isSubscribedToPublisher(ctx.subscriptions, ctx.userId, publisherType, item.publisher.id)
}

/** Score organique : récence + engagement + affinité + abonnements + promos. */
export function scoreFeedItem(item, ctx = {}) {
  const now = ctx.now || Date.now()
  const hours = hoursSince(item?.createdAt, now)
  const engagement = feedEngagement(item)

  let score = Math.max(0, 72 - hours) * 0.45
  score += Math.log10(1 + engagement) * 14

  if (item.kind === 'listing' && item.source) {
    score += scoreMarketplaceListing(item.source, ctx) * 0.3
    if (isPromotedListing(item)) score += 10
  }

  if (item.kind === 'video') {
    score += Math.min(Number(item.stats?.views || 0) / 8, 18)
    const likes = item.source?.likes
    if (ctx.userId && Array.isArray(likes) && likes.includes(ctx.userId)) {
      score += 22
    }
  }

  if (isSubscribedFeedPublisher(item, ctx)) {
    score += 16
  }

  if (ctx.userId) {
    const ownerId = item.publisher?.ownerId || item.publisher?.id
    if (ownerId && ownerId === ctx.userId) score -= 8
  }

  if (item.kind === 'listing' && ctx.viewedIds?.has(item.entityId)) {
    score -= 5
  }

  if (ctx.suggestionSalt) {
    score += suggestionJitter(item.id, ctx.suggestionSalt)
  }

  const haystack =
    `${item.title || ''} ${item.caption || ''} ${item.publisher?.name || ''}`.toLowerCase()
  for (const term of ctx.searchTerms || []) {
    const needle = String(term || '')
      .trim()
      .toLowerCase()
    if (needle.length >= 2 && haystack.includes(needle)) score += 14
  }

  return score
}

function suggestionJitter(id, salt) {
  const raw = `${id}:${salt}`
  let hash = 0
  for (let i = 0; i < raw.length; i += 1) {
    hash = (hash * 33 + raw.charCodeAt(i)) >>> 0
  }
  return (hash % 11) - 3
}

/** Top engagement du fil (hors vedettes Stars). */
export function annotateTrendingItems(items, { topRatio = 0.12, minEngagement = 6 } = {}) {
  if (!items.length) return items
  const engagements = items
    .filter((item) => !item.isFeatured)
    .map((item) => feedEngagement(item))
    .sort((a, b) => b - a)
  const slot = Math.max(0, Math.ceil(items.length * topRatio) - 1)
  const threshold = Math.max(minEngagement, engagements[slot] || minEngagement)

  return items.map((item) => ({
    ...item,
    isTrending: !item.isFeatured && feedEngagement(item) >= threshold,
    isPromoted: isPromotedListing(item),
  }))
}

export function sortByFeedScore(items, ctx = {}) {
  return [...items]
    .map((item) => ({ ...item, feedScore: scoreFeedItem(item, ctx) }))
    .sort(
      (a, b) =>
        b.feedScore - a.feedScore ||
        String(b.createdAt || '').localeCompare(String(a.createdAt || '')),
    )
}

function videoEntityId(item) {
  return String(item?.entityId || item?.source?.id || '').trim()
}

function userLikedVideo(item, ctx) {
  const userId = ctx?.userId
  if (!userId) return false
  const likes = item?.source?.likes
  if (Array.isArray(likes) && likes.map(String).includes(String(userId))) return true
  return false
}

/**
 * Slot #1 ranking: unseen + recency/engagement + follows/likes/search,
 * with a light salt so the opener is not always the same video.
 */
export function scoreLeadVideo(item, ctx = {}) {
  if (item?.kind !== 'video') return Number.NEGATIVE_INFINITY
  let score = scoreFeedItem(item, ctx)
  const videoId = videoEntityId(item)
  const watchedIds = ctx.watchedVideoIds || []
  const seenAt = watchedVideoIndex(videoId, watchedIds)
  if (seenAt < 0) {
    score += 16
  } else {
    score -= Math.max(6, 30 - seenAt)
  }
  if (userLikedVideo(item, ctx)) score += 12
  if (ctx.suggestionSalt) {
    score += leadSuggestionJitter(item.id, ctx.suggestionSalt)
  }
  return score
}

/** FNV-1a + avalanche so similar ids/salts do not stay in lockstep. */
function mixHash(raw) {
  let hash = 2166136261
  for (let i = 0; i < raw.length; i += 1) {
    hash ^= raw.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  hash = Math.imul(hash ^ (hash >>> 16), 2246822519)
  hash = Math.imul(hash ^ (hash >>> 13), 3266489917)
  return (hash ^ (hash >>> 16)) >>> 0
}

function leadSuggestionJitter(id, salt) {
  return (mixHash(`lead:${id}:${salt}`) % 47) - 23
}

export function pickLeadVideo(items, ctx = {}) {
  const videos = (items || []).filter((item) => item?.kind === 'video')
  if (!videos.length) return null
  return [...videos].sort((a, b) => {
    const diff = scoreLeadVideo(b, ctx) - scoreLeadVideo(a, ctx)
    if (diff !== 0) return diff
    return String(b.createdAt || '').localeCompare(String(a.createdAt || ''))
  })[0]
}

/** First organic slot is always a video when the mixed feed has any. */
export function ensureLeadVideo(items, ctx = {}) {
  if (!Array.isArray(items) || !items.length) return items
  const lead = pickLeadVideo(items, ctx)
  if (!lead) return items
  if (items[0]?.id === lead.id) return items
  return [lead, ...items.filter((item) => item.id !== lead.id)]
}

/** Évite d’empiler le même type / le même éditeur. */
export function diversifyFeedItems(items, { windowSize = 2 } = {}) {
  const remaining = [...items]
  const ordered = []

  while (remaining.length) {
    const recent = ordered.slice(-windowSize)
    const recentKinds = new Set(recent.map((item) => item.kind))
    const recentPublishers = new Set(recent.map((item) => item.publisher?.id).filter(Boolean))
    const pickIndex = remaining.findIndex(
      (item) => !recentKinds.has(item.kind) || !recentPublishers.has(item.publisher?.id),
    )
    const index = pickIndex === -1 ? 0 : pickIndex
    ordered.push(remaining.splice(index, 1)[0])
  }

  return ordered
}

export function buildFeedRankContext(state = {}, user = null) {
  const favorites = state.account?.favorites || []
  const viewedListings = state.account?.viewedListings || []
  const listingsById = new Map((state.marketplace?.items || []).map((row) => [row.id, row]))

  return {
    userId: user?.id || null,
    userCity: user?.city || user?.profile?.city || '',
    subscriptions: state.account?.subscriptions || [],
    favorites,
    viewedListings,
    viewedIds: new Set(
      viewedListings
        .filter((row) => !user?.id || row.userId === user.id)
        .map((row) => row.listingId),
    ),
    affinity: buildListingAffinity({
      listingsById,
      favorites,
      viewedListings,
      userId: user?.id,
    }),
    watchedVideoIds: readWatchedVideoIds(),
    now: Date.now(),
  }
}
