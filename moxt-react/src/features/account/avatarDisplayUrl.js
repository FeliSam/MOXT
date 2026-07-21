/**
 * URL d’avatar réduite pour listes (Supabase image transform si disponible).
 * Ne casse pas les URLs non-Supabase / déjà transformées.
 */
export function avatarDisplayUrl(url, { width = 96, height } = {}) {
  if (!url || typeof url !== 'string') return url
  if (url.includes('/render/image/')) return url
  const h = height || width
  if (url.includes('/storage/v1/object/public/')) {
    const transformed = url.replace('/object/public/', '/render/image/public/')
    const sep = transformed.includes('?') ? '&' : '?'
    return `${transformed}${sep}width=${width}&height=${h}&resize=cover`
  }
  return url
}

const SIZE_PX = {
  sm: 72,
  md: 96,
  lg: 128,
}
