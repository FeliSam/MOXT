import { categoriesForType, LISTING_TYPES_META } from '../../config/listingConfig'
import { activityByValue } from '../../config/businessActivities'
import { phase3Text } from '../../i18n/phase3I18n'
import { formatMoney } from '../transfers/transferUtils'

export const FAVORITE_CATEGORIES = [
  { id: 'listing', labelKey: 'favorites.categories.listing', types: ['listing'] },
  { id: 'parcel', labelKey: 'favorites.categories.parcel', types: ['parcel'] },
  { id: 'job', labelKey: 'favorites.categories.job', types: ['job'] },
  { id: 'other', labelKey: 'favorites.categories.other', types: ['business', 'event'] },
]

export function favoriteCategoryForType(relatedType) {
  return FAVORITE_CATEGORIES.find((category) => category.types.includes(relatedType))?.id || 'other'
}

export function groupFavoritesByCategory(items) {
  const groups = Object.fromEntries(FAVORITE_CATEGORIES.map((category) => [category.id, []]))
  for (const item of items) {
    const categoryId = favoriteCategoryForType(item.relatedType)
    groups[categoryId].push(item)
  }
  return FAVORITE_CATEGORIES.map((category) => ({
    ...category,
    items: groups[category.id],
  })).filter((category) => category.items.length > 0)
}

export function buildListingFavoriteSnapshot(listing) {
  if (!listing) return null
  return {
    image: listing.images?.[0] || null,
    title: listing.title,
    price: listing.price ?? null,
    currency: listing.currency || 'XOF',
    city: listing.city || '',
    type: listing.type || '',
    category: listing.category || '',
  }
}

export function buildJobFavoriteSnapshot(job) {
  if (!job) return null
  return {
    title: job.title,
    publisherName: job.publisherName || '',
    location: job.location || '',
    salary: job.salary || '',
    contractType: job.contractType || '',
    sector: job.sector || '',
  }
}

export function buildParcelFavoriteSnapshot(parcel) {
  if (!parcel) return null
  return {
    origin: parcel.origin || '',
    destination: parcel.destination || '',
    departureDate: parcel.departureDate || '',
    pricePerKg: parcel.pricePerKg ?? null,
    currency: parcel.currency || 'XOF',
    remainingKg: parcel.remainingKg ?? null,
  }
}

export function buildBusinessFavoriteSnapshot(business) {
  if (!business) return null
  return {
    title: business.name,
    image: business.logoUrl || business.coverUrl || null,
    subtitle: activityByValue(business.primaryActivity)?.label || business.primaryActivity || '',
    city: business.city || '',
  }
}

export function buildEventFavoriteSnapshot(event) {
  if (!event) return null
  return {
    title: event.title,
    image: event.coverUrl || event.imageUrl || null,
    date: event.startDate || event.date || '',
    location: event.location || '',
    price: event.price ?? null,
    currency: event.currency || 'XOF',
  }
}

export function buildFavoriteSnapshot(relatedType, entity) {
  switch (relatedType) {
    case 'listing':
      return buildListingFavoriteSnapshot(entity)
    case 'job':
      return buildJobFavoriteSnapshot(entity)
    case 'parcel':
      return buildParcelFavoriteSnapshot(entity)
    case 'business':
      return buildBusinessFavoriteSnapshot(entity)
    case 'event':
      return buildEventFavoriteSnapshot(entity)
    default:
      return entity?.title || entity?.name
        ? { title: entity.title || entity.name }
        : null
  }
}

function lookupEntity(favorite, state) {
  switch (favorite.relatedType) {
    case 'listing':
      return state.marketplace.items.find((item) => item.id === favorite.relatedId)
    case 'job':
      return state.jobs.items.find((item) => item.id === favorite.relatedId)
    case 'parcel':
      return state.parcels.items.find((item) => item.id === favorite.relatedId)
    case 'business':
      return state.businesses.items.find((item) => item.id === favorite.relatedId)
    case 'event':
      return state.events.items.find((item) => item.id === favorite.relatedId)
    default:
      return null
  }
}

export function resolveFavoriteItem(favorite, state) {
  const entity = lookupEntity(favorite, state)
  const snapshot = favorite.snapshot || {}

  if (favorite.relatedType === 'listing') {
    const listing = entity || {}
    const typeLabel =
      LISTING_TYPES_META.find((option) => option.value === (snapshot.type || listing.type))?.label ||
      snapshot.type ||
      listing.type
    const categoryLabel =
      categoriesForType(snapshot.type || listing.type).find(
        (option) => option.value === (snapshot.category || listing.category),
      )?.label ||
      snapshot.category ||
      listing.category
    return {
      ...favorite,
      display: {
        image: snapshot.image || listing.images?.[0] || null,
        title: favorite.title || snapshot.title || listing.title,
        price: snapshot.price ?? listing.price ?? null,
        currency: snapshot.currency || listing.currency || 'XOF',
        city: snapshot.city || listing.city || '',
        typeLabel,
        categoryLabel,
      },
    }
  }

  if (favorite.relatedType === 'job') {
    const job = entity || {}
    return {
      ...favorite,
      display: {
        title: favorite.title || snapshot.title || job.title,
        publisherName: snapshot.publisherName || job.publisherName || '',
        location: snapshot.location || job.location || '',
        salary: snapshot.salary || job.salary || '',
        contractType: snapshot.contractType || job.contractType || '',
        sector: snapshot.sector || job.sector || '',
      },
    }
  }

  if (favorite.relatedType === 'parcel') {
    const parcel = entity || {}
    return {
      ...favorite,
      display: {
        origin: snapshot.origin || parcel.origin || '',
        destination: snapshot.destination || parcel.destination || '',
        departureDate: snapshot.departureDate || parcel.departureDate || '',
        pricePerKg: snapshot.pricePerKg ?? parcel.pricePerKg ?? null,
        currency: snapshot.currency || parcel.currency || 'XOF',
        remainingKg: snapshot.remainingKg ?? parcel.remainingKg ?? null,
      },
    }
  }

  if (favorite.relatedType === 'business') {
    const business = entity || {}
    return {
      ...favorite,
      display: {
        image: snapshot.image || business.logoUrl || business.coverUrl || null,
        title: favorite.title || snapshot.title || business.name,
        subtitle:
          snapshot.subtitle ||
          activityByValue(business.primaryActivity)?.label ||
          business.primaryActivity ||
          '',
        city: snapshot.city || business.city || '',
      },
    }
  }

  if (favorite.relatedType === 'event') {
    const event = entity || {}
    return {
      ...favorite,
      display: {
        image: snapshot.image || event.coverUrl || event.imageUrl || null,
        title: favorite.title || snapshot.title || event.title,
        date: snapshot.date || event.startDate || event.date || '',
        location: snapshot.location || event.location || '',
        price: snapshot.price ?? event.price ?? null,
        currency: snapshot.currency || event.currency || 'XOF',
      },
    }
  }

  return {
    ...favorite,
    display: {
      title: favorite.title,
    },
  }
}

export function mergeUserFavorites(state, userId) {
  const accountFavorites = state.account.favorites.filter((item) => item.userId === userId)
  const accountListingIds = new Set(
    accountFavorites.filter((item) => item.relatedType === 'listing').map((item) => item.relatedId),
  )
  const legacyListingFavorites = state.marketplace.items
    .filter((item) => item.favorites?.includes(userId) && !accountListingIds.has(item.id))
    .map((item) => ({
      id: `listing-${item.id}`,
      relatedId: item.id,
      relatedType: 'listing',
      title: item.title,
      path: `/marketplace/${item.id}`,
      legacy: true,
      snapshot: buildListingFavoriteSnapshot(item),
    }))

  return [...accountFavorites, ...legacyListingFavorites].map((item) =>
    resolveFavoriteItem(item, state),
  )
}

export function formatListingPrice(price, currency, t) {
  return price ? formatMoney(price, currency) : phase3Text(t, 'favorites.onQuote')
}
