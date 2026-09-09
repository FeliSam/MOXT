import { isSubscribedToPublisher } from '@moxt/shared/utils/subscriptionUtils.js'
import { selectDashboardBusinesses } from '../dashboard/dashboardBrowseUtils.js'
import { isActiveListing } from '../marketplace/listingCatalogUtils.js'
import { buildMarketplaceDiscovery } from '../marketplace/marketplaceFeed.js'
import { formatMoney } from '../transfers/transferUtils.js'
import { feedItemKey } from './feedItemUtils.js'

export const FEED_DISCOVERY_EVERY = 5

export const FEED_DISCOVERY_VARIANTS = [
  'forYou',
  'trending',
  'fresh',
  'businesses',
  'subscriptions',
  'spotlight',
]

/** Mélange déterministe (sel de session) pour ne pas répéter le même ordre. */
export function seededShuffle(list, salt) {
  const arr = [...(list || [])]
  let hash = 2166136261
  const seed = String(salt || '')
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  for (let i = arr.length - 1; i > 0; i -= 1) {
    hash = Math.imul(hash, 1664525) + 1013904223
    hash >>>= 0
    const j = hash % (i + 1)
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export function pickShuffledWindow(list, salt, offset, size) {
  const shuffled = seededShuffle(list, salt)
  if (!shuffled.length) return []
  const count = Math.min(size, shuffled.length)
  const start = ((offset % shuffled.length) + shuffled.length) % shuffled.length
  const out = []
  for (let i = 0; i < count; i += 1) {
    out.push(shuffled[(start + i) % shuffled.length])
  }
  return out
}

export function discoveryFeedItemId(slotIndex, variant) {
  return feedItemKey('discovery', `${slotIndex}-${variant}`)
}

export function listingToDiscoveryCard(listing) {
  if (!listing?.id) return null
  const images = (listing.images || []).filter(Boolean)
  const price =
    listing.price != null ? formatMoney(listing.price, listing.currency || 'RUB') : null
  return {
    type: 'listing',
    id: String(listing.id),
    title: listing.title || '',
    subtitle: price || listing.city || listing.businessName || '',
    image: images[0] || '',
    href: `/marketplace/${listing.id}`,
    badgeKey: null,
  }
}

export function businessToDiscoveryCard(business) {
  if (!business?.id) return null
  return {
    type: 'business',
    id: String(business.id),
    title: business.name || business.tradeName || '',
    subtitle: business.city || business.category || '',
    image: business.bannerUrl || business.logoUrl || '',
    href: `/businesses/${business.id}`,
    badgeKey: 'feed.discovery.badge.business',
  }
}

export function feedItemToDiscoveryCard(item) {
  if (!item?.entityId) return null
  const image = item.media?.poster || item.media?.images?.[0] || ''
  let badgeKey = null
  if (item.isFeatured) badgeKey = 'feed.featured'
  else if (item.isTrending) badgeKey = 'feed.trending'
  else if (item.isPromoted) badgeKey = 'feed.promo'

  return {
    type: item.kind,
    id: String(item.entityId),
    title: item.title || '',
    subtitle: item.publisher?.name || '',
    image,
    href: item.href || item.feedHref || '/feed',
    badgeKey,
  }
}

function takeUniqueCards(source, limit, seen) {
  const picked = []
  for (const card of source) {
    if (!card?.id) continue
    const key = `${card.type}:${card.id}`
    if (seen.has(key)) continue
    seen.add(key)
    picked.push(card)
    if (picked.length >= limit) break
  }
  return picked
}

function activeBusinesses(feedState) {
  return (feedState?.businesses?.items || []).filter(
    (row) => row?.id && String(row.status || 'active') === 'active',
  )
}

/**
 * Prépare les jeux de cartes pour chaque variante de page découverte.
 */
export function buildDiscoveryPayloads(feedState, rankCtx, user, organicItems = []) {
  const listings = (feedState?.marketplace?.items || []).filter(isActiveListing)
  const marketplaceCtx = {
    userId: user?.id,
    favorites: feedState?.account?.favorites,
    viewedListings: feedState?.account?.viewedListings,
    impressionListings: feedState?.account?.impressionListings,
    subscriptions: feedState?.account?.subscriptions,
    userCity: user?.city,
    feedBoosts: rankCtx?.feedBoosts,
    searchTerms: rankCtx?.searchTerms,
    now: rankCtx?.now,
    railSize: 8,
    showRails: listings.length >= 4,
  }
  const rails = buildMarketplaceDiscovery(listings, marketplaceCtx)
  const subscriptions = feedState?.account?.subscriptions || []
  const subscribedCards = takeUniqueCards(
    organicItems
      .filter((item) => {
        const publisher = item?.publisher
        if (!publisher?.id || !user?.id) return false
        const publisherType = publisher.type === 'business' ? 'business' : 'user'
        return isSubscribedToPublisher(subscriptions, user.id, publisherType, publisher.id)
      })
      .map(feedItemToDiscoveryCard),
    8,
    new Set(),
  )

  const businessCards = activeBusinesses(feedState).map(businessToDiscoveryCard).filter(Boolean)
  const businessItems = selectDashboardBusinesses(feedState?.businesses?.items || [], user, {
    ownerId: user?.id,
    limit: 8,
  })
  const spotlightPool = [
    ...rails.forYou.map(listingToDiscoveryCard),
    ...businessCards,
    ...organicItems.filter((item) => item.kind === 'video').map(feedItemToDiscoveryCard),
    ...rails.trending.map(listingToDiscoveryCard),
  ].filter(Boolean)

  const listingCards = takeUniqueCards(
    [...rails.forYou.map(listingToDiscoveryCard), ...listings.map(listingToDiscoveryCard)],
    24,
    new Set(),
  )

  return {
    forYou: listingCards,
    trending: takeUniqueCards(rails.trending.map(listingToDiscoveryCard), 16, new Set()),
    fresh: takeUniqueCards(rails.fresh.map(listingToDiscoveryCard), 16, new Set()),
    businesses: businessItems,
    subscriptions: subscribedCards,
    spotlight: takeUniqueCards(spotlightPool, 16, new Set()),
  }
}

export function buildDiscoveryFeedItem(variant, slotIndex, cards, businesses = []) {
  const safeCards = (cards || []).filter(Boolean)
  const safeBusinesses = (businesses || []).filter(Boolean)
  return {
    id: discoveryFeedItemId(slotIndex, variant),
    kind: 'discovery',
    entityId: `slot-${slotIndex}`,
    variant,
    cards: safeCards,
    businesses: safeBusinesses,
    createdAt: '',
    publisher: null,
    media: { images: [], videoUrl: '', poster: '' },
    title: '',
    caption: '',
    href: '/feed',
    feedHref: '/feed',
    stats: {},
    source: null,
  }
}

/**
 * Insère une page découverte tous les `every` éléments organiques du fil.
 */
export function injectFeedDiscoverySlides(
  items,
  { feedState, rankCtx, user, every = FEED_DISCOVERY_EVERY } = {},
) {
  if (!Array.isArray(items) || items.length < every || every < 2) return items

  const payloads = buildDiscoveryPayloads(feedState, rankCtx, user, items)
  const salt = rankCtx?.suggestionSalt || 'disc'
  const variants = seededShuffle(FEED_DISCOVERY_VARIANTS, `${salt}:variants`)
  const out = []
  let organicCount = 0
  let slotIndex = 0

  for (const item of items) {
    if (item.kind === 'discovery') continue
    out.push(item)
    organicCount += 1
    if (organicCount % every !== 0) continue

    const variant = variants[slotIndex % variants.length]
    let inserted = false
    if (variant === 'businesses') {
      const businesses = pickShuffledWindow(
        payloads.businesses || [],
        `${salt}:biz:${slotIndex}`,
        slotIndex * 2,
        8,
      )
      if (businesses.length >= 2) {
        out.push(buildDiscoveryFeedItem(variant, slotIndex, [], businesses))
        inserted = true
      }
    } else {
      const cards = pickShuffledWindow(
        payloads[variant] || [],
        `${salt}:${variant}:${slotIndex}`,
        slotIndex * 3,
        8,
      )
      if (cards.length >= 2) {
        out.push(buildDiscoveryFeedItem(variant, slotIndex, cards))
        inserted = true
      }
    }
    if (inserted) slotIndex += 1
    else if ((payloads.forYou || []).length >= 2) {
      const cards = pickShuffledWindow(
        payloads.forYou,
        `${salt}:fallback:${slotIndex}`,
        slotIndex * 5,
        8,
      )
      if (cards.length >= 2) {
        out.push(buildDiscoveryFeedItem('forYou', slotIndex, cards))
        slotIndex += 1
      }
    }
  }

  return out
}
