import {
  isBusinessDeletedByUser,
} from '../businesses/businessVisibility'
import { isBusinessPublishReady } from '../businesses/businessPublishUtils'
import { isParcelBrowseArchived } from '../parcels/parcelUtils'

/** Éléments visibles sur l’accueil — mêmes règles que les listes principales. */
export function selectDashboardP2POffers(offers = [], { currencies, limit = 8 } = {}) {
  const list = Array.isArray(offers) ? offers : []
  return list
    .filter((offer) => offer?.status === 'active')
    .filter(
      (offer) =>
        !currencies?.length ||
        (currencies.includes(offer.fromCurrency) && currencies.includes(offer.toCurrency)),
    )
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0, limit)
}

export function selectDashboardParcels(items = [], limit = 5) {
  return items
    .filter((parcel) => parcel.status === 'active' && !isParcelBrowseArchived(parcel))
    .slice(0, limit)
}

export function selectDashboardJobs(items = [], limit = 5) {
  return items.filter((job) => job.status === 'active').slice(0, limit)
}

export function selectDashboardEvents(items = [], limit = 5) {
  return items.filter((event) => event.status === 'published').slice(0, limit)
}

export function selectDashboardListings(items = [], limit = 4) {
  return items.filter((listing) => listing.status === 'active').slice(0, limit)
}

export function isDashboardBusinessPublic(business) {
  if (!business || isBusinessDeletedByUser(business)) return false
  if (!isBusinessPublishReady(business)) return false
  return (business.activityVisibility || 'public') === 'public'
}

export function selectDashboardBusinesses(items = [], _viewer, { ownerId, limit = 24 } = {}) {
  const visible = items.filter(isDashboardBusinessPublic)
  const own = ownerId ? visible.filter((business) => business.ownerId === ownerId) : []
  const others = ownerId ? visible.filter((business) => business.ownerId !== ownerId) : visible
  return [...own, ...others].slice(0, limit)
}
