import { categoriesForType, LISTING_TYPES_META } from '../../config/listingConfig'

const ARCHIVED_STATUSES = new Set(['archived', 'sold', 'expired', 'draft'])

export function isActiveListing(listing) {
  return listing?.status === 'active'
}

export function isArchivedListing(listing) {
  return ARCHIVED_STATUSES.has(listing?.status)
}

export function listingTypeLabel(type) {
  return LISTING_TYPES_META.find((option) => option.value === type)?.label || type || 'Autre'
}

export function listingCategoryLabel(type, category) {
  return categoriesForType(type).find((option) => option.value === category)?.label || category || ''
}

export function groupListingsByType(listings) {
  const groups = new Map()
  for (const listing of listings) {
    const key = listing.type || 'other'
    if (!groups.has(key)) {
      groups.set(key, {
        type: key,
        label: listingTypeLabel(key),
        items: [],
      })
    }
    groups.get(key).items.push(listing)
  }
  return LISTING_TYPES_META.map((meta) => groups.get(meta.value)).filter(Boolean)
}

export function buildPublisherProfile(userId, listings, fallbackName = 'Membre MOXT') {
  const sample = listings[0]
  const active = listings.filter(isActiveListing)
  const archived = listings.filter(isArchivedListing)
  const totalViews = listings.reduce((sum, item) => sum + (Number(item.views) || 0), 0)
  return {
    userId,
    name: sample?.sellerName || fallbackName,
    city: sample?.city || '',
    country: sample?.country || 'RU',
    activeCount: active.length,
    archivedCount: archived.length,
    totalViews,
    listingCount: listings.length,
  }
}

export function resolveListingCountry(listing) {
  return listing?.country || 'RU'
}

export function resolveParcelCountry(parcel) {
  return parcel?.fromCountry || parcel?.originCountry || parcel?.toCountry || parcel?.destinationCountry || 'RU'
}

export function resolveEventCountry(event) {
  return event?.country || (event?.currency === 'XOF' ? 'BJ' : 'RU')
}

export function resolveJobCountry(job) {
  return job?.country || 'RU'
}

export function resolvePostCountry(post, state) {
  if (post?.country) return post.country
  const { sourceType, sourceId } = post || {}
  if (!sourceId || !state) return null
  switch (sourceType) {
    case 'listing':
      return resolveListingCountry(state.marketplace?.items?.find((item) => item.id === sourceId))
    case 'parcel':
      return resolveParcelCountry(state.parcels?.items?.find((item) => item.id === sourceId))
    case 'event':
      return resolveEventCountry(state.events?.items?.find((item) => item.id === sourceId))
    case 'job':
      return resolveJobCountry(state.jobs?.items?.find((item) => item.id === sourceId))
    default:
      return null
  }
}
