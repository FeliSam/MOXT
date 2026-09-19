/**
 * Parse / rewrite Supabase Storage public URLs → Yandex CDN object keys.
 */
import {
  legacyPathToObjectKey,
  buildPublicMediaUrl,
} from '../../packages/shared/src/media/objectKeys.js'
import { SUPABASE_STORAGE_BUCKETS } from '../../packages/shared/src/media/storageAudit.js'

const KNOWN_BUCKETS = new Set(SUPABASE_STORAGE_BUCKETS.map((b) => b.id))

/** Match public (and render/image/public) Supabase Storage URLs. */
const PUBLIC_URL_RE =
  /^(https?:\/\/[^/]+)\/storage\/v1\/(?:object|render\/image)\/public\/([^/?#]+)\/([^?#]*)(?:[?#].*)?$/i

export function parseSupabasePublicStorageUrl(url) {
  if (!url || typeof url !== 'string') return null
  const trimmed = url.trim()
  if (!trimmed) return null
  const m = trimmed.match(PUBLIC_URL_RE)
  if (!m) return null
  const bucket = decodeURIComponent(m[2])
  const objectPath = decodeURIComponent(m[3]).replace(/^\/+/, '')
  if (!KNOWN_BUCKETS.has(bucket) || !objectPath) return null
  return { origin: m[1], bucket, objectPath }
}

export function supabasePublicUrlToCdnUrl(url, cdnBase) {
  const parsed = parseSupabasePublicStorageUrl(url)
  if (!parsed) return null
  try {
    const objectKey = legacyPathToObjectKey(parsed.bucket, parsed.objectPath)
    return buildPublicMediaUrl(objectKey, cdnBase)
  } catch {
    return null
  }
}

export function rewriteUrlValue(value, cdnBase, { onMapped } = {}) {
  if (value == null) return { next: value, changed: false, mapped: null }
  if (typeof value === 'string') {
    const mapped = supabasePublicUrlToCdnUrl(value, cdnBase)
    if (!mapped || mapped === value) return { next: value, changed: false, mapped: null }
    onMapped?.(mapped, value)
    return { next: mapped, changed: true, mapped }
  }
  if (Array.isArray(value)) {
    let changed = false
    const mappedKeys = []
    const next = value.map((item) => {
      if (typeof item === 'string') {
        const r = rewriteUrlValue(item, cdnBase, { onMapped })
        if (r.changed) {
          changed = true
          if (r.mapped) mappedKeys.push(r.mapped)
        }
        return r.next
      }
      if (item && typeof item === 'object') {
        const urlField = item.url || item.publicUrl || item.src || item.path
        if (typeof urlField === 'string') {
          const mapped = supabasePublicUrlToCdnUrl(urlField, cdnBase)
          if (mapped && mapped !== urlField) {
            changed = true
            mappedKeys.push(mapped)
            onMapped?.(mapped, urlField)
            const copy = { ...item }
            if (item.url) copy.url = mapped
            else if (item.publicUrl) copy.publicUrl = mapped
            else if (item.src) copy.src = mapped
            else copy.path = mapped
            return copy
          }
        }
      }
      return item
    })
    return { next, changed, mapped: mappedKeys[0] || null }
  }
  return { next: value, changed: false, mapped: null }
}

export { KNOWN_BUCKETS, PUBLIC_URL_RE }
