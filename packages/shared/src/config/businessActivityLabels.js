/**
 * Libellés des activités d'entreprise (mêmes valeurs/libellés que moxt-react
 * src/config/businessActivities.js, sans les icônes web).
 * Migration web à faire : faire dériver BUSINESS_ACTIVITIES de cette liste.
 */
export const BUSINESS_ACTIVITY_LABELS = Object.freeze({
  transfer: 'Transfert',
  logistics: 'Colis et logistique',
  commerce: 'Commerce et marketplace',
  recruitment: 'Jobs et recrutement',
  events: 'Evenementiel',
  education: 'Formation',
  real_estate: 'Immobilier',
  services: 'Services administratifs',
})

/** Libellé lisible d'une activité (valeur inconnue → valeur brute, vide → ''). */
export function businessActivityLabel(value) {
  if (!value) return ''
  return BUSINESS_ACTIVITY_LABELS[value] || String(value)
}
