import { isParcelBrowseArchived } from '../parcels/parcelUtils'

/** Éléments visibles sur l’accueil — mêmes règles que les listes principales. */
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
