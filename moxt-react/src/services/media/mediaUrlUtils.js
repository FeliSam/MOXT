import { buildPublicMediaUrl } from '@moxt/shared/media/objectKeys.js'
import { mediaConfig } from '../../config/mediaConfig.js'

/** Même URL après upsert — le navigateur garde l’ancienne image sans version. */
export function appendCacheBust(url) {
  if (!url || typeof url !== 'string') return url
  const base = url.split('?')[0]
  return `${base}?v=${Date.now()}`
}

export function isCdnMediaUrl(url) {
  if (!url || typeof url !== 'string') return false
  const cdn = mediaConfig.cdnBase
  if (cdn && url.startsWith(cdn)) return true
  return url.includes('.storage.yandexcloud.net/')
}

export function isSupabaseStorageUrl(url) {
  return typeof url === 'string' && url.includes('/storage/v1/object/')
}

/**
 * Résout une URL d’affichage : CDN Yandex, legacy Supabase, ou chemin relatif listings.
 */
export function resolveMediaDisplayUrl(value, { legacyBucket = 'listings' } = {}) {
  if (!value) return null
  const raw = typeof value === 'string' ? value : value?.url || value?.publicUrl || value?.src || value?.path || ''
  const trimmed = String(raw).trim()
  if (!trimmed) return null
  if (/^(https?:)?\/\//i.test(trimmed) || trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
    return trimmed.startsWith('//') ? `https:${trimmed}` : trimmed
  }
  if (trimmed.startsWith('/')) return trimmed
  if (mediaConfig.cdnBase) {
    const key = trimmed.startsWith('public/') || trimmed.startsWith('private/')
      ? trimmed
      : `public/${legacyBucket}/${trimmed.replace(/^\/+/, '')}`
    return buildPublicMediaUrl(key, mediaConfig.cdnBase)
  }
  return trimmed
}
