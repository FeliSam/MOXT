import { supabase } from '../../services/supabaseClient'
import { resolveMediaDisplayUrl } from '../../services/media/mediaUrlUtils.js'

export const MAX_LISTING_PHOTOS = 8

function parseImagesValue(value) {
  if (!value) return []
  if (Array.isArray(value)) return value
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? parsed : [value]
    } catch {
      return value.trim() ? [value] : []
    }
  }
  return []
}

export function resolveListingImageUrl(value) {
  const resolved = resolveMediaDisplayUrl(value, { legacyBucket: 'listings' })
  if (resolved) return resolved
  if (!value) return null
  const raw = typeof value === 'string' ? value : value?.url || value?.src || value?.path || ''
  const trimmed = String(raw).trim()
  if (!trimmed || !supabase) return trimmed || null
  const { data } = supabase.storage.from('listings').getPublicUrl(trimmed)
  return data?.publicUrl || trimmed
}

export function normalizeListingImages(...sources) {
  for (const source of sources) {
    const urls = parseImagesValue(source)
      .map(resolveListingImageUrl)
      .filter(Boolean)
    if (urls.length) return urls
  }
  return []
}
