import { formatShortDate } from '../../utils/formatters'

export function readParcelDepartureDate(parcel) {
  return parcel?.departureDate ?? parcel?.departure_date ?? null
}

export function formatParcelDepartureLabel(parcel) {
  const raw = readParcelDepartureDate(parcel)
  if (!raw) return null
  const formatted = formatShortDate(raw)
  return formatted === 'Date indisponible' ? `Départ ${raw}` : `Départ ${formatted}`
}
