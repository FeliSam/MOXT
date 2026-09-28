import { formatShortDate } from '../../utils/formatters'

// Règles colis : source unique partagée web + mobile.
import { readParcelDepartureDate } from '@moxt/shared/domain/parcelRules.js'

export {
  countAvailableBrowseParcels,
  isAvailableBrowseParcel,
  isParcelBrowseArchived,
  readParcelDepartureDate,
} from '@moxt/shared/domain/parcelRules.js'

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
