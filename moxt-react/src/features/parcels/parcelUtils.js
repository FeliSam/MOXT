import { formatShortDate } from '../../utils/formatters'

export function readParcelDepartureDate(parcel) {
  return parcel?.departureDate ?? parcel?.departure_date ?? null
}

/** Aligné sur la liste Colis (onglet principal) : terminé ou départ passé. */
export function isParcelBrowseArchived(parcel, today = new Date().toISOString().slice(0, 10)) {
  const departure = readParcelDepartureDate(parcel)
  return parcel?.status === 'completed' || Boolean(departure && departure < today)
}

/** Trajets encore proposés (liste Colis, onglet Actifs). */
export function isAvailableBrowseParcel(parcel, today = new Date().toISOString().slice(0, 10)) {
  if (!parcel || isParcelBrowseArchived(parcel, today)) return false
  if (parcel.status && parcel.status !== 'active') return false
  const kg = Number(parcel.remainingKg ?? parcel.capacityKg ?? 0)
  return Number.isFinite(kg) && kg > 0
}

export function countAvailableBrowseParcels(parcels = [], today) {
  return parcels.filter((parcel) => isAvailableBrowseParcel(parcel, today)).length
}

export function formatParcelDepartureLabel(parcel, t) {
  const raw = readParcelDepartureDate(parcel)
  if (!raw) return null
  const formatted = formatShortDate(raw)
  const date = formatted === 'Date indisponible' ? raw : formatted
  if (typeof t === 'function') {
    return t('parcels.meta.departure', { date })
  }
  return `Départ ${date}`
}
