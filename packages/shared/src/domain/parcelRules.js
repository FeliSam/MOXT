/**
 * Règles colis partagées web + mobile (source unique).
 * Le web réexporte ces fonctions depuis features/parcels/parcelUtils.js.
 */

export const todayIsoDate = () => new Date().toISOString().slice(0, 10)

export function readParcelDepartureDate(parcel) {
  return parcel?.departureDate ?? parcel?.departure_date ?? null
}

/** Aligné sur la liste Colis (onglet principal) : terminé ou départ passé. */
export function isParcelBrowseArchived(parcel, today = todayIsoDate()) {
  const departure = readParcelDepartureDate(parcel)
  return parcel?.status === 'completed' || Boolean(departure && departure < today)
}

/** Trajets encore proposés (liste Colis, onglet Actifs). */
export function isAvailableBrowseParcel(parcel, today = todayIsoDate()) {
  if (!parcel || isParcelBrowseArchived(parcel, today)) return false
  if (parcel.status && parcel.status !== 'active') return false
  const kg = Number(parcel.remainingKg ?? parcel.remaining_kg ?? parcel.capacityKg ?? parcel.capacity_kg ?? 0)
  return Number.isFinite(kg) && kg > 0
}

export function countAvailableBrowseParcels(parcels = [], today) {
  return parcels.filter((parcel) => isAvailableBrowseParcel(parcel, today)).length
}

/** Décompte des onglets de la page Colis (web ParcelsPage) : archivés = terminé ou départ passé. */
export function countBrowseParcelTabs(parcels = [], today = todayIsoDate()) {
  let archived = 0
  for (const parcel of parcels) {
    if (isParcelBrowseArchived(parcel, today)) archived += 1
  }
  return { active: parcels.length - archived, archived, total: parcels.length }
}

function parcelMatchesCountry(parcel, countryCode) {
  if (!countryCode) return true
  const from = parcel?.fromCountry || parcel?.originCountry
  const to = parcel?.toCountry || parcel?.destinationCountry
  return from === countryCode || to === countryCode
}

/**
 * Onglets de la page Colis web (ParcelsPage) :
 * - Actifs : non archivés, statut filtré (défaut « active »), pays de l’utilisateur (départ ou arrivée) ;
 * - Archives : tous les trajets archivés du catalogue chargé (sans filtre pays).
 */
export function splitBrowseParcels(parcels = [], { countryCode = '', status = 'active', today = todayIsoDate() } = {}) {
  const archived = []
  const active = []
  for (const parcel of parcels) {
    if (isParcelBrowseArchived(parcel, today)) {
      archived.push(parcel)
      continue
    }
    if (status && parcel?.status !== status) continue
    if (!parcelMatchesCountry(parcel, countryCode)) continue
    active.push(parcel)
  }
  return { active, archived }
}
