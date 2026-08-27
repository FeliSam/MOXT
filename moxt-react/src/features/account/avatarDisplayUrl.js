/**
 * Variantes d’affichage avatar — Supabase render (legacy) ou CDN Yandex (Phase 1).
 */
import { mediaConfig } from '../../config/mediaConfig.js'
import { isCdnMediaUrl, isSupabaseStorageUrl } from '../../services/media/mediaUrlUtils.js'

export function avatarDisplayUrl(url, { width = 96, height } = {}) {
  if (!url || typeof url !== 'string') return url
  if (url.includes('/render/image/')) return url
  if (isCdnMediaUrl(url)) {
    const h = height || width
    const base = url.split('?')[0]
    return `${base}?w=${width}&h=${h}&fit=cover`
  }
  const h = height || width

  let base = url
  let query = ''
  const queryIndex = url.indexOf('?')
  if (queryIndex >= 0) {
    base = url.slice(0, queryIndex)
    query = url.slice(queryIndex + 1)
  }

  if (isSupabaseStorageUrl(base) && base.includes('/object/public/')) {
    const transformed = base.replace('/object/public/', '/render/image/public/')
    const transformParams = `width=${width}&height=${h}&resize=cover`
    const combined = query ? `${query}&${transformParams}` : transformParams
    return `${transformed}?${combined}`
  }
  return url
}

export function avatarThumbBaseUrl() {
  return mediaConfig.cdnBase || null
}
