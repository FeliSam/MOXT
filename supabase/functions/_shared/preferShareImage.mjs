/**
 * Share OG image choice.
 * Legacy rows can keep Supabase Storage URLs in `images[]` after `image_url`
 * (or another field) already points at the CDN. Crawlers should use the CDN
 * URL when one is present, and keep a Storage URL only when nothing else exists.
 */

function asRecord(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  return value
}

function parseMaybeJson(value) {
  if (typeof value !== 'string') return value
  const trimmed = value.trim()
  if (!trimmed || (trimmed[0] !== '{' && trimmed[0] !== '[')) return value
  try {
    return JSON.parse(trimmed)
  } catch {
    return value
  }
}

export function collectImageUrls(value, out = []) {
  if (value == null) return out
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return out
    const parsed = parseMaybeJson(trimmed)
    if (parsed !== trimmed) return collectImageUrls(parsed, out)
    if (trimmed.startsWith('https://') || trimmed.startsWith('http://')) out.push(trimmed)
    return out
  }
  if (Array.isArray(value)) {
    for (const item of value) collectImageUrls(item, out)
    return out
  }
  const obj = asRecord(value)
  if (!obj) return out
  for (const key of ['url', 'src', 'image', 'image_url', 'thumbnail_url', 'href']) {
    if (obj[key] != null) collectImageUrls(obj[key], out)
  }
  if (obj.images != null) collectImageUrls(obj.images, out)
  return out
}

/** Public object still served from Supabase Storage (not yet the CDN copy). */
export function isLegacySupabaseStorageUrl(url) {
  try {
    const parsed = new URL(String(url || ''))
    const host = parsed.hostname.toLowerCase()
    if (host !== 'supabase.co' && !host.endsWith('.supabase.co')) return false
    return parsed.pathname.toLowerCase().includes('/storage/v1/')
  } catch {
    return false
  }
}

export function isCdnShareImageUrl(url) {
  try {
    const host = new URL(String(url || '')).hostname.toLowerCase()
    if (host === 'cdn.moxtapp.ru' || host.endsWith('.cdn.moxtapp.ru')) return true
    if (host === 'storage.yandexcloud.net' || host.endsWith('.storage.yandexcloud.net')) return true
    return false
  } catch {
    return false
  }
}

/**
 * First non-Storage URL in candidate order (CDN, Yandex, or any other https).
 * Storage URLs are used only when every candidate is still on Supabase Storage.
 */
export function preferShareImageUrl(urls, fallback = '') {
  const ordered = []
  const seen = new Set()
  for (const raw of urls || []) {
    const url = String(raw || '').trim()
    if (!url || seen.has(url)) continue
    if (!url.startsWith('https://') && !url.startsWith('http://')) continue
    seen.add(url)
    ordered.push(url)
  }
  const fresh = ordered.find((url) => !isLegacySupabaseStorageUrl(url))
  if (fresh) return fresh
  return ordered[0] || fallback
}

function pushUrls(bucket, value) {
  collectImageUrls(value, bucket)
}

function pushKeyed(bucket, row, keys) {
  if (!row) return
  for (const key of keys) pushUrls(bucket, row[key])
}

function pushProgram(bucket, row) {
  const program = parseMaybeJson(row?.program)
  const asObj = asRecord(program)
  if (asObj) {
    pushKeyed(bucket, asObj, ['images', 'image_url', 'cover_url', 'thumbnail_url'])
    return
  }
  pushUrls(bucket, program)
}

function pushPayload(bucket, row) {
  const payload = asRecord(parseMaybeJson(row?.payload))
  if (!payload) return
  pushKeyed(bucket, payload, ['images', 'image_url', 'thumbnail_url', 'cover_url', 'photo_url'])
}

/**
 * Same field order share-preview used before, with one change: a CDN (or any
 * non-Storage) photo beats leftover Supabase Storage URLs in images[].
 * Avatar/logo stay a fallback so they do not replace a gallery that is still
 * only on Storage.
 */
export function selectEntityShareImage(kind, data, fallback = '') {
  const row = asRecord(data) || {}
  const primary = []
  if (kind === 'parcel') pushUrls(primary, row.travel_proof_url)
  if (kind === 'event') pushProgram(primary, row)
  if (kind === 'job' || kind === 'event' || kind === 'parcel') pushPayload(primary, row)
  pushKeyed(primary, row, ['images', 'image_url', 'thumbnail_url'])
  pushKeyed(primary, row, ['image_url'])
  pushProgram(primary, row)
  pushPayload(primary, row)
  const primaryPick = preferShareImageUrl(primary, '')
  if (primaryPick) return primaryPick

  const secondary = []
  pushKeyed(secondary, row, ['travel_proof_url', 'thumbnail_url', 'logo_url', 'avatar_url', 'cover_url'])
  return preferShareImageUrl(secondary, fallback)
}
