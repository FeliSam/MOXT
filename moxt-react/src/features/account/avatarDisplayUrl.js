/**
 * URL d’avatar réduite pour listes (Supabase image transform si disponible).
 * Ne casse pas les URLs non-Supabase / déjà transformées.
 */
export function avatarDisplayUrl(url, { width = 96, height } = {}) {
  if (!url || typeof url !== 'string') return url
  if (url.includes('/render/image/')) return url
  const h = height || width

  let base = url
  let query = ''
  const queryIndex = url.indexOf('?')
  if (queryIndex >= 0) {
    base = url.slice(0, queryIndex)
    query = url.slice(queryIndex + 1)
  }

  if (base.includes('/storage/v1/object/public/')) {
    const transformed = base.replace('/object/public/', '/render/image/public/')
    const transformParams = `width=${width}&height=${h}&resize=cover`
    const combined = query ? `${query}&${transformParams}` : transformParams
    return `${transformed}?${combined}`
  }
  return url
}

