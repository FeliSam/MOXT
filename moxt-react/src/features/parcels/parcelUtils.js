import { formatShortDate } from '../../utils/formatters'

export function readParcelDepartureDate(parcel) {
  return parcel?.departureDate ?? parcel?.departure_date ?? null
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
