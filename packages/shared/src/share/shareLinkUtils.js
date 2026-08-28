export const DEFAULT_SHARE_OG_IMAGE = 'https://moxtapp.ru/assets/logos/X.png'
export const CANONICAL_SHARE_SITE = 'https://moxtapp.ru'

const SHARE_KINDS = new Set(['listing', 'parcel', 'job', 'event', 'post', 'video', 'p2p'])

export function isSharePreviewKind(kind) {
  return SHARE_KINDS.has(String(kind || '').trim())
}

export function resolveSharePreviewBaseUrl(supabaseUrl) {
  const base = String(supabaseUrl || '').replace(/\/$/, '')
  if (!base) return ''
  return `${base}/functions/v1/share-preview`
}

export function buildSharePreviewPath(kind, entityId) {
  const safeKind = String(kind || '').trim()
  const safeId = String(entityId || '').trim()
  if (!isSharePreviewKind(safeKind) || !safeId) return ''
  return `/functions/v1/share-preview/${encodeURIComponent(safeKind)}/${encodeURIComponent(safeId)}`
}

export function buildSharePreviewUrl({ kind, entityId, supabaseUrl }) {
  const base = resolveSharePreviewBaseUrl(supabaseUrl)
  const safeKind = String(kind || '').trim()
  const safeId = String(entityId || '').trim()
  if (!base || !isSharePreviewKind(safeKind) || !safeId) return ''
  return `${base}/${encodeURIComponent(safeKind)}/${encodeURIComponent(safeId)}`
}

/** Chemin in-app ouvert après le clic (marketplace, fil, etc.). */
export function resolveInAppShareTarget({ kind, entityId, href, feedHref } = {}) {
  const direct = String(href || '').trim()
  if (direct && !direct.startsWith('/feed')) return direct
  const feed = String(feedHref || '').trim()
  if (feed) return feed
  if (kind && entityId) return `/feed?item=${encodeURIComponent(`${kind}:${entityId}`)}`
  return '/feed'
}

export function buildAbsoluteShareTarget(siteUrl, targetPath) {
  const site = String(siteUrl || CANONICAL_SHARE_SITE).replace(/\/$/, '')
  const path = String(targetPath || '/').startsWith('/') ? targetPath : `/${targetPath}`
  return `${site}${path}`
}

export function pickShareImage(candidates = [], fallback = DEFAULT_SHARE_OG_IMAGE) {
  for (const value of candidates) {
    const url = String(value || '').trim()
    if (url.startsWith('https://') || url.startsWith('http://')) return url
  }
  return fallback
}

export function truncateShareText(value, max = 180) {
  const text = String(value || '').replace(/\s+/g, ' ').trim()
  if (text.length <= max) return text
  return `${text.slice(0, max - 1).trim()}…`
}
