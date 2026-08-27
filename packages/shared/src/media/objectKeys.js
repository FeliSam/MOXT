import { SUPABASE_STORAGE_BUCKETS } from './storageAudit.js'

const BUCKET_META = Object.fromEntries(SUPABASE_STORAGE_BUCKETS.map((b) => [b.id, b]))

/**
 * Convertit un chemin Supabase Storage legacy vers une clé Yandex S3.
 * @param {string} legacyBucket - avatars | listings | documents | …
 * @param {string} legacyPath - chemin relatif dans le bucket Supabase
 */
export function legacyPathToObjectKey(legacyBucket, legacyPath) {
  const meta = BUCKET_META[legacyBucket]
  if (!meta) {
    throw new Error(`Bucket Supabase inconnu: ${legacyBucket}`)
  }
  const normalized = String(legacyPath || '')
    .replace(/^\/+/, '')
    .replace(/\\/g, '/')
  if (!normalized) throw new Error('Chemin objet vide')
  if (legacyBucket === 'avatars') {
    return `${meta.yandexPrefix}/${normalized}`
  }
  if (legacyBucket === 'app-releases') {
    return `${meta.yandexPrefix}/${normalized}`
  }
  return `${meta.yandexPrefix}/${normalized}`
}

export function objectKeyVisibility(objectKey) {
  return String(objectKey || '').startsWith('private/') ? 'private' : 'public'
}

export function yandexBucketForObjectKey(objectKey, { publicBucket, privateBucket } = {}) {
  const pub = publicBucket || 'moxt-public'
  const priv = privateBucket || 'moxt-private'
  return objectKeyVisibility(objectKey) === 'private' ? priv : pub
}

export function buildPublicMediaUrl(objectKey, cdnBase) {
  const base = String(cdnBase || '').replace(/\/+$/, '')
  if (!base) return null
  const key = String(objectKey || '').replace(/^\/+/, '')
  return `${base}/${encodeURI(key)}`
}

export function inferKindFromMime(mimeType = '') {
  const mime = String(mimeType).toLowerCase()
  if (mime.startsWith('video/')) return 'video'
  if (mime.startsWith('image/')) return 'image'
  if (mime === 'application/pdf') return 'document'
  return 'document'
}

export function inferEntityFromLegacyBucket(legacyBucket, legacyPath = '') {
  if (legacyBucket === 'avatars') return { entityType: 'profile', entityId: legacyPath.split('/')[0] || null }
  if (legacyBucket === 'businesses') {
    const parts = legacyPath.split('/')
    return { entityType: 'business', entityId: parts[1] || parts[0] || null }
  }
  if (legacyBucket === 'documents') return { entityType: 'document', entityId: null }
  if (legacyBucket === 'parcels') {
    const parts = legacyPath.split('/')
    return { entityType: 'parcel', entityId: parts[1] || null }
  }
  if (legacyBucket === 'transfers') {
    const parts = legacyPath.split('/')
    return { entityType: 'transfer', entityId: parts[1] || null }
  }
  if (legacyPath.includes('/statuses/')) return { entityType: 'status', entityId: null }
  if (legacyPath.includes('/messages/')) return { entityType: 'message', entityId: null }
  if (legacyPath.includes('/jobs/')) return { entityType: 'job', entityId: null }
  if (legacyPath.includes('/events/')) return { entityType: 'event', entityId: null }
  if (legacyPath.includes('/posts/')) return { entityType: 'post', entityId: null }
  return { entityType: 'listing', entityId: null }
}
