export const SEARCH_TYPE_META = {
  parcel: { label: 'Colis', tone: 'warning' },
  business: { label: 'Entreprise', tone: 'success' },
  listing: { label: 'Marketplace', tone: 'violet' },
  job: { label: 'Job', tone: 'info' },
  event: { label: 'Événement', tone: 'rose' },
  page: { label: 'Page', tone: 'slate' },
  profile: { label: 'Profil', tone: 'brand' },
}

export function searchTypeMeta(type, fallbackLabel = type) {
  return SEARCH_TYPE_META[type] || { label: fallbackLabel, tone: 'brand' }
}
