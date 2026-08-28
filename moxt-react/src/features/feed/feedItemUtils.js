import { buildBoostLookup, sortFeedItemsWithBoosts } from './feedBoostUtils.js'
import { buildFeedRankContext } from './feedRankUtils.js'

import { getPostImages } from '../posts/postMediaUtils.js'
import { newsPostPath } from '../posts/postFeedUtils.js'
import { isActiveListing } from '../marketplace/listingCatalogUtils.js'
import {
  isActiveEvent,
  isActiveJob,
  isActiveParcel,
  isActivePost,
  isActiveVideo,
} from '../publications/publicationCatalogUtils.js'
import { videoFeedPath } from '../videos/videoUtils.js'

export const FEED_KINDS = ['video', 'listing', 'parcel', 'job', 'event', 'post']

export const FEED_TYPE_FILTERS = [
  { id: 'all', labelKey: 'feed.filters.all' },
  { id: 'video', labelKey: 'feed.filters.video' },
  { id: 'listing', labelKey: 'feed.filters.listing' },
  { id: 'parcel', labelKey: 'feed.filters.parcel' },
  { id: 'job', labelKey: 'feed.filters.job' },
  { id: 'event', labelKey: 'feed.filters.event' },
  { id: 'post', labelKey: 'feed.filters.post' },
]

export function feedItemKey(kind, entityId) {
  return `${kind}:${entityId}`
}

export function parseFeedItemParam(raw) {
  const value = String(raw || '').trim()
  if (!value) return null
  const sep = value.indexOf(':')
  if (sep <= 0) return null
  const kind = value.slice(0, sep)
  const entityId = value.slice(sep + 1)
  if (!FEED_KINDS.includes(kind) || !entityId) return null
  return { kind, entityId, id: feedItemKey(kind, entityId) }
}

export function feedPath({ type, item } = {}) {
  const params = new URLSearchParams()
  if (type && type !== 'all') params.set('type', type)
  if (item) params.set('item', item)
  const qs = params.toString()
  return qs ? `/feed?${qs}` : '/feed'
}

const FEED_DESKTOP_FALLBACK_BY_KIND = {
  video: '/marketplace',
  listing: '/marketplace',
  parcel: '/parcels',
  job: '/jobs',
  event: '/events',
  post: '/news',
}

/** Cible de redirection quand `/feed` est ouvert sur grand écran. */
export function resolveFeedDesktopRedirect({
  typeFilter = 'all',
  itemParam = '',
  state = {},
  boosts = null,
  rankCtx = null,
  user = null,
} = {}) {
  const kindFallback =
    typeFilter !== 'all' ? FEED_DESKTOP_FALLBACK_BY_KIND[typeFilter] : null
  const defaultPath = kindFallback || '/dashboard'

  if (!itemParam) return defaultPath

  const items = buildUnifiedFeedItems(state, { typeFilter: 'all', boosts, rankCtx, user })
  const resolvedId = resolveFeedItemParam(itemParam, state) || parseFeedItemParam(itemParam)?.id
  const item = items.find((row) => row.id === resolvedId)
  if (!item) return defaultPath

  const href = String(item.href || '').trim()
  if (href && !href.startsWith('/feed')) return href

  return FEED_DESKTOP_FALLBACK_BY_KIND[item.kind] || defaultPath
}

/** Post profil lié à une fiche catalogue (marketplace, jobs, …) — pas un post libre. */
export function isLinkedCatalogPost(post) {
  const sourceType = String(post?.sourceType || '').trim()
  if (!sourceType || sourceType === 'free') return false
  return Boolean(post?.sourceId)
}

/**
 * Mappe un post lié vers la clé feed de la fiche d’origine (listing/job/…).
 * @returns {string|null}
 */
export function linkedPostToFeedItemId(post) {
  if (!isLinkedCatalogPost(post)) return null
  const sourceType = String(post.sourceType || '').trim()
  const kind =
    sourceType === 'marketplace' || sourceType === 'listing'
      ? 'listing'
      : sourceType === 'video'
        ? 'video'
        : sourceType === 'parcel'
          ? 'parcel'
          : sourceType === 'job'
            ? 'job'
            : sourceType === 'event'
              ? 'event'
              : null
  if (!kind || !FEED_KINDS.includes(kind)) return null
  return feedItemKey(kind, post.sourceId)
}

function likeIdSet(lists = []) {
  const set = new Set()
  for (const list of lists) {
    if (!Array.isArray(list)) continue
    for (const id of list) {
      if (id == null || id === '') continue
      set.add(String(id))
    }
  }
  return set
}

function uniqueCommentCount(lists = []) {
  const seen = new Set()
  let count = 0
  for (const list of lists) {
    if (!Array.isArray(list)) continue
    for (const comment of list) {
      if (!comment) continue
      const key =
        comment.id ||
        `${comment.authorId || ''}:${comment.createdAt || ''}:${String(comment.text || '').slice(0, 80)}`
      if (seen.has(key)) continue
      seen.add(key)
      count += 1
    }
  }
  return count
}

/**
 * Agrège likes / commentaires de la fiche + posts liés (Actualités / partage depuis la fiche).
 * Les likes sont dédupliqués par userId ; les commentaires par id (ou empreinte).
 */
export function aggregateEntitySocialStats(
  kind,
  entityId,
  state = {},
  { likes: ownLikes = [], comments: ownComments = [] } = {},
) {
  if (!kind || !entityId) {
    return {
      likes: likeIdSet([ownLikes]).size,
      comments: uniqueCommentCount([ownComments]),
    }
  }
  const targetId = feedItemKey(kind, entityId)
  const linkedLikeLists = []
  const linkedCommentLists = []
  for (const post of state.posts?.items || []) {
    if (!isActivePost(post)) continue
    if (linkedPostToFeedItemId(post) !== targetId) continue
    linkedLikeLists.push(post.likes)
    linkedCommentLists.push(post.comments)
  }
  return {
    likes: likeIdSet([ownLikes, ...linkedLikeLists]).size,
    comments: uniqueCommentCount([ownComments, ...linkedCommentLists]),
  }
}

/**
 * Résout `?item=` : un post lié redirige vers la fiche catalogue initiale.
 */
export function resolveFeedItemParam(raw, state = {}) {
  const parsed = parseFeedItemParam(raw)
  if (!parsed) return null
  if (parsed.kind !== 'post') return parsed.id
  const post = (state.posts?.items || []).find((row) => row.id === parsed.entityId)
  if (!post) return parsed.id
  return linkedPostToFeedItemId(post) || parsed.id
}

export function countFeedKinds(items = []) {
  const counts = Object.fromEntries(FEED_KINDS.map((kind) => [kind, 0]))
  for (const item of items) {
    if (counts[item.kind] != null) counts[item.kind] += 1
  }
  return counts
}

function asImages(list) {
  if (!Array.isArray(list)) return []
  return list.filter((url) => typeof url === 'string' && url.trim()).map((url) => url.trim())
}

/** Preuves privées (chemin stockage) ne sont pas affichables en feed public. */
function asPublicImages(list) {
  return asImages(list).filter(
    (url) =>
      /^(https?:)?\/\//i.test(url) ||
      url.startsWith('data:') ||
      url.startsWith('blob:') ||
      url.startsWith('/'),
  )
}

function resolveBusiness(state, businessId) {
  if (!businessId) return null
  return (state.businesses?.items || []).find((item) => item.id === businessId) || null
}

function publisherFromBusiness(business, fallbackName = '') {
  if (!business?.id) {
    return {
      type: 'business',
      id: '',
      name: fallbackName || 'Entreprise',
      avatarUrl: '',
      path: '',
      ownerId: '',
    }
  }
  return {
    type: 'business',
    id: business.id,
    name: business.name || fallbackName || 'Entreprise',
    avatarUrl: business.logoUrl || '',
    path: `/businesses/${business.id}`,
    ownerId: business.ownerId || '',
  }
}

function publisherFromUser(userId, name = '', avatarUrl = '') {
  return {
    type: 'user',
    id: userId || '',
    name: name || 'Membre MOXT',
    avatarUrl: avatarUrl || '',
    path: userId ? `/users/${userId}/publications` : '',
    ownerId: userId || '',
  }
}

export function normalizeVideoFeedItem(video, state = {}) {
  if (!video?.id || !isActiveVideo(video)) return null
  const business = resolveBusiness(state, video.businessId)
  const social = aggregateEntitySocialStats('video', video.id, state, {
    likes: video.likes,
    comments: video.comments,
  })
  return {
    id: feedItemKey('video', video.id),
    kind: 'video',
    entityId: video.id,
    createdAt: video.createdAt || '',
    publisher: publisherFromBusiness(business, video.businessName || ''),
    media: {
      images: video.thumbnailUrl ? [video.thumbnailUrl] : [],
      videoUrl: video.videoUrl || '',
      poster: video.thumbnailUrl || '',
      objectKey: video.objectKey || '',
    },
    title: video.title || '',
    caption: video.caption || '',
    href: videoFeedPath(video.id),
    feedHref: feedPath({ item: feedItemKey('video', video.id) }),
    stats: {
      views: Number(video.viewCount) || 0,
      likes: social.likes,
      comments: social.comments,
      shares: Number(video.shareCount) || 0,
    },
    source: video,
  }
}

export function normalizeListingFeedItem(listing, state = {}) {
  if (!listing?.id || !isActiveListing(listing)) return null
  const business = resolveBusiness(state, listing.businessId)
  const publisher = listing.businessId
    ? publisherFromBusiness(business, listing.businessName || listing.publisherName || '')
    : publisherFromUser(
        listing.ownerId,
        listing.ownerName || listing.publisherName || '',
        listing.ownerAvatarUrl || '',
      )
  const images = asImages(listing.images)
  const social = aggregateEntitySocialStats('listing', listing.id, state, {
    likes: listing.likes,
    comments: listing.comments,
  })
  return {
    id: feedItemKey('listing', listing.id),
    kind: 'listing',
    entityId: listing.id,
    createdAt: listing.createdAt || '',
    publisher,
    media: { images, videoUrl: '', poster: images[0] || '' },
    title: listing.title || '',
    caption: listing.description || listing.caption || '',
    href: `/marketplace/${listing.id}`,
    feedHref: feedPath({ item: feedItemKey('listing', listing.id) }),
    stats: {
      views: Number(listing.views) || 0,
      price: listing.price,
      currency: listing.currency,
      likes: social.likes,
      comments: social.comments,
    },
    source: listing,
  }
}

export function normalizeParcelFeedItem(parcel, state = {}) {
  if (!parcel?.id || !isActiveParcel(parcel)) return null
  const business = resolveBusiness(state, parcel.businessId)
  const publisher = parcel.businessId
    ? publisherFromBusiness(business, parcel.businessName || '')
    : publisherFromUser(parcel.ownerId, parcel.ownerName || '', parcel.ownerAvatarUrl || '')
  const images = asPublicImages(parcel.images || (parcel.travelProofUrl ? [parcel.travelProofUrl] : []))
  const origin =
    parcel.origin || parcel.originCity || parcel.fromCity || parcel.originCountry || parcel.fromCountry || ''
  const destination =
    parcel.destination ||
    parcel.destinationCity ||
    parcel.toCity ||
    parcel.destinationCountry ||
    parcel.toCountry ||
    ''
  const route = [origin, destination].filter(Boolean).join(' → ')
  const departureDate = parcel.departureDate || parcel.departure_date || ''
  const social = aggregateEntitySocialStats('parcel', parcel.id, state, {
    likes: parcel.likes,
    comments: parcel.comments,
  })
  return {
    id: feedItemKey('parcel', parcel.id),
    kind: 'parcel',
    entityId: parcel.id,
    createdAt: parcel.createdAt || '',
    publisher,
    media: { images, videoUrl: '', poster: images[0] || '' },
    title: route || destination || origin || '',
    caption: parcel.notes || parcel.description || parcel.conditions || '',
    href: `/parcels/${parcel.id}`,
    feedHref: feedPath({ item: feedItemKey('parcel', parcel.id) }),
    stats: {
      views: Number(parcel.views) || 0,
      pricePerKg: parcel.pricePerKg,
      currency: parcel.currency,
      remainingKg: parcel.remainingKg,
      origin,
      destination,
      departureDate,
      distributionDate: parcel.distributionDate || parcel.distribution_date || '',
      depositDeadline: parcel.depositDeadline || parcel.deposit_deadline || '',
      capacityKg: parcel.capacityKg,
      likes: social.likes,
      comments: social.comments,
    },
    source: parcel,
  }
}

export function normalizeJobFeedItem(job, state = {}) {
  if (!job?.id || !isActiveJob(job)) return null
  const business = resolveBusiness(state, job.businessId)
  const publisher = job.businessId
    ? publisherFromBusiness(business, job.businessName || job.companyName || '')
    : publisherFromUser(job.ownerId, job.ownerName || '', job.ownerAvatarUrl || '')
  const images = asImages(job.images || (job.imageUrl ? [job.imageUrl] : []))
  const social = aggregateEntitySocialStats('job', job.id, state, {
    likes: job.likes,
    comments: job.comments,
  })
  return {
    id: feedItemKey('job', job.id),
    kind: 'job',
    entityId: job.id,
    createdAt: job.createdAt || '',
    publisher,
    media: { images, videoUrl: '', poster: images[0] || '' },
    title: job.title || '',
    caption: job.description || '',
    href: `/jobs/${job.id}`,
    feedHref: feedPath({ item: feedItemKey('job', job.id) }),
    stats: {
      views: Number(job.views) || 0,
      city: job.city,
      contractType: job.contractType,
      likes: social.likes,
      comments: social.comments,
    },
    source: job,
  }
}

export function normalizeEventFeedItem(event, state = {}) {
  if (!event?.id || !isActiveEvent(event)) return null
  const business = resolveBusiness(state, event.businessId)
  const publisher = event.businessId
    ? publisherFromBusiness(business, event.businessName || event.organizerName || '')
    : publisherFromUser(event.ownerId, event.ownerName || event.organizerName || '', event.ownerAvatarUrl || '')
  const images = asImages(event.images || (event.imageUrl ? [event.imageUrl] : []))
  const social = aggregateEntitySocialStats('event', event.id, state, {
    likes: event.likes,
    comments: event.comments,
  })
  return {
    id: feedItemKey('event', event.id),
    kind: 'event',
    entityId: event.id,
    createdAt: event.createdAt || '',
    publisher,
    media: { images, videoUrl: '', poster: images[0] || '' },
    title: event.title || '',
    caption: event.description || '',
    href: `/events/${event.id}`,
    feedHref: feedPath({ item: feedItemKey('event', event.id) }),
    stats: {
      views: Number(event.views) || 0,
      city: event.city,
      startAt: event.startAt,
      likes: social.likes,
      comments: social.comments,
    },
    source: event,
  }
}

export function normalizePostFeedItem(post) {
  if (!post?.id || !isActivePost(post)) return null
  // Les posts profil issus d’une publication marketplace/jobs/… sont déjà
  // représentés par la fiche catalogue — on n’affiche que l’élément initial.
  if (isLinkedCatalogPost(post)) return null
  const images = getPostImages(post)
  return {
    id: feedItemKey('post', post.id),
    kind: 'post',
    entityId: post.id,
    createdAt: post.createdAt || '',
    publisher: publisherFromUser(post.authorId, post.authorName || '', post.authorAvatarUrl || ''),
    media: { images, videoUrl: '', poster: images[0] || '' },
    title: (post.message || '').trim().slice(0, 80) || 'Publication',
    caption: post.message || '',
    href: newsPostPath(post.id),
    feedHref: feedPath({ item: feedItemKey('post', post.id) }),
    stats: {
      views: 0,
      likes: Array.isArray(post.likes) ? post.likes.length : 0,
      comments: Array.isArray(post.comments) ? post.comments.length : 0,
    },
    source: post,
  }
}

/**
 * Construit le fil unifié depuis le state Redux.
 * @param {object} state
 * @param {{ typeFilter?: string, boosts?: array|null, rankCtx?: object|null, user?: object|null }} [options]
 */
export function buildUnifiedFeedItems(state, { typeFilter = 'all', boosts = null, rankCtx = null, user = null } = {}) {
  const items = []

  const pushAll = (list, normalize) => {
    for (const row of list) {
      const item = normalize(row, state)
      if (item) items.push(item)
    }
  }

  const want = (kind) => typeFilter === 'all' || typeFilter === kind

  if (want('video')) pushAll(state.videos?.items || [], normalizeVideoFeedItem)
  if (want('listing')) pushAll(state.marketplace?.items || [], normalizeListingFeedItem)
  if (want('parcel')) pushAll(state.parcels?.items || [], normalizeParcelFeedItem)
  if (want('job')) pushAll(state.jobs?.items || [], normalizeJobFeedItem)
  if (want('event')) pushAll(state.events?.items || [], normalizeEventFeedItem)
  if (want('post')) pushAll(state.posts?.items || [], normalizePostFeedItem)

  if (boosts === null) {
    const ctx = rankCtx || buildFeedRankContext(state, user)
    return sortFeedItemsWithBoosts(items, new Map(), ctx)
  }

  const boostLookup = buildBoostLookup(boosts)
  const ctx = rankCtx || buildFeedRankContext(state, user)
  return sortFeedItemsWithBoosts(items, boostLookup, ctx)
}

export function pickInitialFeedIndex(items, itemParam, state = {}) {
  if (!itemParam || !items?.length) return 0
  const resolvedId = resolveFeedItemParam(itemParam, state) || parseFeedItemParam(itemParam)?.id
  if (!resolvedId) return 0
  const index = items.findIndex((item) => item.id === resolvedId)
  return index >= 0 ? index : 0
}

/** Signature stable (ids + vedettes) — ignore le re-tri organique intra-session. */
export function feedOrderSignature(items = []) {
  const ids = items
    .map((item) => item.id)
    .sort()
    .join('|')
  const featured = items
    .filter((item) => item.isFeatured)
    .map((item) => item.id)
    .sort()
    .join('|')
  return `${ids}::${featured}`
}

/**
 * Garde l’ordre d’affichage tant que le set d’items / vedettes ne change pas
 * (évite le reset scroll quand viewCount ou likes mettent à jour le score).
 */
export function preserveFeedOrder(previous, nextItems, signature) {
  if (!Array.isArray(nextItems) || !nextItems.length) {
    return { signature: '', items: [] }
  }
  if (!previous?.items?.length || previous.signature !== signature) {
    return { signature, items: nextItems }
  }
  const byId = new Map(nextItems.map((item) => [item.id, item]))
  const merged = previous.items.map((item) => byId.get(item.id)).filter(Boolean)
  const mergedIds = new Set(merged.map((item) => item.id))
  for (const item of nextItems) {
    if (!mergedIds.has(item.id)) merged.push(item)
  }
  return { signature, items: merged }
}
