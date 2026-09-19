import { buildPublicMediaUrl } from '@moxt/shared/media/objectKeys.js'
import { mediaConfig } from '../../config/mediaConfig.js'

/** Direct Object Storage — preferred over cdn.moxtapp.ru (CDN lags on new objects). */
export const YANDEX_PUBLIC_STORAGE_BASE = 'https://storage.yandexcloud.net/moxt-public'
const LEGACY_CDN_BASE = 'https://cdn.moxtapp.ru'

/** Rewrite legacy CDN host to Object Storage so fresh uploads are readable immediately. */
export function rewriteCdnToStorageUrl(url) {
  if (!url || typeof url !== 'string') return url
  const trimmed = url.trim()
  if (trimmed.startsWith(LEGACY_CDN_BASE)) {
    return `${YANDEX_PUBLIC_STORAGE_BASE}${trimmed.slice(LEGACY_CDN_BASE.length)}`
  }
  return trimmed
}

/** Même URL après upsert — le navigateur garde l’ancienne image sans version. */
export function appendCacheBust(url) {
  if (!url || typeof url !== 'string') return url
  const base = rewriteCdnToStorageUrl(url.split('?')[0])
  return `${base}?v=${Date.now()}`
}

export function isCdnMediaUrl(url) {
  if (!url || typeof url !== 'string') return false
  const resolved = rewriteCdnToStorageUrl(url)
  const cdn = mediaConfig.cdnBase
  if (cdn && resolved.startsWith(cdn)) return true
  return resolved.includes('.storage.yandexcloud.net/')
}

export function isSupabaseStorageUrl(url) {
  return typeof url === 'string' && url.includes('/storage/v1/object/')
}

/**
 * Résout une URL d’affichage : Object Storage Yandex, legacy Supabase, ou chemin relatif listings.
 * Force storage.yandexcloud.net (pas cdn.moxtapp.ru) pour les médias publics.
 */
export function resolveMediaDisplayUrl(value, { legacyBucket = 'listings' } = {}) {
  if (!value) return null
  const raw = typeof value === 'string' ? value : value?.url || value?.publicUrl || value?.src || value?.path || ''
  const trimmed = String(raw).trim()
  if (!trimmed) return null
  if (/^(https?:)?\/\//i.test(trimmed) || trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
    const absolute = trimmed.startsWith('//') ? `https:${trimmed}` : trimmed
    return rewriteCdnToStorageUrl(absolute)
  }
  if (trimmed.startsWith('/')) return trimmed
  const configured = (mediaConfig.cdnBase || '').replace(/\/+$/, '')
  const storageBase =
    !configured || configured.includes('cdn.moxtapp.ru')
      ? YANDEX_PUBLIC_STORAGE_BASE
      : configured
  const key =
    trimmed.startsWith('public/') || trimmed.startsWith('private/')
      ? trimmed
      : `public/${legacyBucket}/${trimmed.replace(/^\/+/, '')}`
  return rewriteCdnToStorageUrl(buildPublicMediaUrl(key, storageBase))
}
