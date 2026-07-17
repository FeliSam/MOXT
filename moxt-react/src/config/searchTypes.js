export const SEARCH_TYPE_META = {
  parcel: { label: 'Colis', labelKey: 'discover.types.parcel', tone: 'warning' },
  business: { label: 'Entreprise', labelKey: 'discover.types.business', tone: 'success' },
  listing: { label: 'Marketplace', labelKey: 'discover.types.listing', tone: 'violet' },
  job: { label: 'Job', labelKey: 'discover.types.job', tone: 'info' },
  event: { label: 'Événement', labelKey: 'discover.types.event', tone: 'rose' },
  page: { label: 'Page', labelKey: 'discover.types.page', tone: 'slate' },
  profile: { label: 'Profil', labelKey: 'nav.profile', tone: 'brand' },
}

/**
 * @param {string} type
 * @param {((key: string) => string) | string} [tOrFallback] translator, or legacy fallback label
 * @param {string} [fallbackLabel]
 */
export function searchTypeMeta(type, tOrFallback, fallbackLabel) {
  const t = typeof tOrFallback === 'function' ? tOrFallback : null
  const fallback =
    typeof tOrFallback === 'function'
      ? (fallbackLabel ?? type)
      : (tOrFallback ?? type)
  const meta = SEARCH_TYPE_META[type]
  if (!meta) return { label: fallback, tone: 'brand' }
  if (t && meta.labelKey) {
    const translated = t(meta.labelKey)
    if (translated && translated !== meta.labelKey) {
      return { ...meta, label: translated }
    }
  }
  return meta
}
