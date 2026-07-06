export const SEARCH_TYPE_META = {
  parcel: { label: 'Colis', tone: 'warning' },
  business: { label: 'Entreprise', tone: 'success' },
  listing: { label: 'Marketplace', tone: 'violet' },
  job: { label: 'Job', tone: 'info' },
  event: { label: 'Événement', tone: 'rose' },
  page: { label: 'Page', tone: 'slate' },
}

export function searchTypeMeta(type, fallbackLabel = type) {
  return SEARCH_TYPE_META[type] || { label: fallbackLabel, tone: 'brand' }
}
