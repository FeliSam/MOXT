/**
 * Résolution média avec cache natif SQLite + Filesystem.
 * Web : passe-plat (URL réseau).
 * Native : hit local → sinon fetch → saveBlobToDisk → URI locale.
 */
import { legacyPathToObjectKey } from '@moxt/shared/media/objectKeys.js'
import { isNative } from '../../platform/capacitor.js'
import { mobileMediaCache } from './mobileMediaCache.js'

const inflight = new Map()

const DEFAULT_TTL_MS = {
  video: 24 * 60 * 60 * 1000,
  image: 7 * 24 * 60 * 60 * 1000,
  document: 7 * 24 * 60 * 60 * 1000,
  proof: 14 * 24 * 60 * 60 * 1000,
  avatar: 30 * 24 * 60 * 60 * 1000,
}

/** Identifiant stable pour le cache (pas l’URL signée expirable). */
export function deriveMediaCacheId({
  mediaId,
  objectKey,
  url,
  legacyBucket,
  legacyPath,
} = {}) {
  if (mediaId) return String(mediaId).trim()
  if (objectKey) return sanitizeId(objectKey)
  if (legacyBucket && legacyPath) {
    return sanitizeId(legacyPathToObjectKey(legacyBucket, legacyPath))
  }
  if (url) return sanitizeId(stripQuery(url))
  return null
}

function stripQuery(url) {
  return String(url || '').split('?')[0]
}

function sanitizeId(value) {
  return String(value || '')
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/[^a-zA-Z0-9._/-]+/g, '_')
    .replace(/\/+/g, '_')
    .slice(0, 180)
}

function inferKind({ kind, mimeType, objectKey, url } = {}) {
  if (kind) return kind
  const mime = String(mimeType || '').toLowerCase()
  if (mime.startsWith('video/')) return 'video'
  if (mime.startsWith('image/')) return 'image'
  if (mime === 'application/pdf') return 'document'
  const hay = `${objectKey || ''} ${url || ''}`.toLowerCase()
  if (/\.(mp4|webm|mov)(\?|$)/.test(hay) || hay.includes('/videos/')) return 'video'
  if (/\.(jpe?g|png|gif|webp|heic|avif)(\?|$)/.test(hay)) return 'image'
  if (/\.pdf(\?|$)/.test(hay) || hay.includes('/documents/') || hay.includes('/proof')) {
    return hay.includes('proof') ? 'proof' : 'document'
  }
  return 'image'
}

function ttlForKind(kind) {
  return DEFAULT_TTL_MS[kind] || DEFAULT_TTL_MS.image
}

/**
 * Retourne une URI affichable : cache local si native + hit, sinon remoteUrl.
 * Sur miss native, télécharge et enregistre (best-effort).
 */
export async function resolveCachedMediaUrl({
  mediaId,
  objectKey,
  url,
  remoteUrl,
  legacyBucket,
  legacyPath,
  kind,
  mimeType,
  entityType,
  entityId,
  cache = true,
} = {}) {
  const remote = remoteUrl || url || null
  if (!cache || !isNative) return remote

  const id = deriveMediaCacheId({ mediaId, objectKey, url: remote, legacyBucket, legacyPath })
  if (!id) return remote

  const key =
    objectKey ||
    (legacyBucket && legacyPath ? legacyPathToObjectKey(legacyBucket, legacyPath) : stripQuery(remote || id))

  try {
    const hit = await mobileMediaCache.getByMediaId(id)
    if (hit?.local_uri || hit?.localUri) {
      await mobileMediaCache.touchAccess(id)
      return hit.local_uri || hit.localUri
    }
  } catch (error) {
    console.warn('[cachedMedia] lookup failed', error)
  }

  if (!remote) return null

  if (inflight.has(id)) return inflight.get(id)

  const task = (async () => {
    try {
      const response = await fetch(remote)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const blob = await response.blob()
      const resolvedKind = inferKind({ kind, mimeType: mimeType || blob.type, objectKey: key, url: remote })
      const localUri = await mobileMediaCache.saveBlobToDisk({
        mediaId: id,
        objectKey: key,
        blob,
        kind: resolvedKind,
        entityType,
        entityId,
        expiresAt: Date.now() + ttlForKind(resolvedKind),
      })
      return localUri || remote
    } catch (error) {
      console.warn('[cachedMedia] download/cache failed', error)
      return remote
    } finally {
      inflight.delete(id)
    }
  })()

  inflight.set(id, task)
  return task
}

/** Enregistre un blob déjà téléchargé (ex. preuve transfert) dans le cache natif. */
export async function cacheMediaBlob({
  mediaId,
  objectKey,
  blob,
  legacyBucket,
  legacyPath,
  kind,
  entityType,
  entityId,
}) {
  if (!isNative || !blob) return null
  const id = deriveMediaCacheId({ mediaId, objectKey, legacyBucket, legacyPath })
  const key =
    objectKey ||
    (legacyBucket && legacyPath ? legacyPathToObjectKey(legacyBucket, legacyPath) : id)
  if (!id || !key) return null
  const resolvedKind = inferKind({ kind, mimeType: blob.type, objectKey: key })
  try {
    return await mobileMediaCache.saveBlobToDisk({
      mediaId: id,
      objectKey: key,
      blob,
      kind: resolvedKind,
      entityType,
      entityId,
      expiresAt: Date.now() + ttlForKind(resolvedKind),
    })
  } catch (error) {
    console.warn('[cachedMedia] cacheMediaBlob failed', error)
    return null
  }
}

/** Lookup synchrone impossible — helper pour savoir si le cache natif est actif. */
export function isMediaDiskCacheEnabled() {
  return isNative
}
