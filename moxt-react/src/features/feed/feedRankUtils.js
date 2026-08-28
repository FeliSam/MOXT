import { isSubscribedToPublisher } from '@moxt/shared/utils/subscriptionUtils.js'
import {
  buildListingAffinity,
  hoursSince,
  scoreMarketplaceListing,
} from '../marketplace/marketplaceFeed.js'

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

  return score
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
        b.feedScore - a.feedScore || String(b.createdAt || '').localeCompare(String(a.createdAt || '')),
    )
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
    now: Date.now(),
  }
}
