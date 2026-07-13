import { supabase } from '../../services/supabaseClient'

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
  if (!value) return null
  const raw = typeof value === 'string' ? value : value?.url || value?.src || value?.path || ''
  const trimmed = String(raw).trim()
  if (!trimmed) return null
  if (/^(https?:)?\/\//i.test(trimmed) || trimmed.startsWith('data:') || trimmed.startsWith('/')) {
    return trimmed.startsWith('//') ? `https:${trimmed}` : trimmed
  }
  if (!supabase) return trimmed
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
