export const DEFAULT_SHARE_OG_IMAGE = 'https://moxtapp.ru/assets/logos/X.png'
export const CANONICAL_SHARE_SITE = 'https://www.moxtapp.ru'

const SHARE_KINDS = new Set(['listing', 'parcel', 'job', 'event', 'post', 'video', 'p2p', 'business', 'user'])

/** Detail accessible sans connexion (PublicationShell). */
const PUBLIC_SHARE_PATH_PREFIXES = [
  '/marketplace/',
  '/businesses/',
  '/users/',
  '/parcels/',
  '/jobs/',
  '/events/',
  '/p2p/',
]

export function isPublicSharePath(path) {
  const value = String(path || '').trim()
  return PUBLIC_SHARE_PATH_PREFIXES.some((prefix) => value.startsWith(prefix))
}

export function buildFeedSharePath(kind, entityId, { typeFilter = '' } = {}) {
  const safeKind = String(kind || '').trim()
  const safeId = String(entityId || '').trim()
  if (!safeKind || !safeId) return '/feed'
  if (safeKind === 'listing') return `/marketplace/${safeId}`
  if (safeKind === 'business') return `/businesses/${safeId}`
  if (safeKind === 'user') return `/users/${safeId}/publications`
  if (safeKind === 'parcel') return `/parcels/${safeId}`
  if (safeKind === 'job') return `/jobs/${safeId}`
  if (safeKind === 'event') return `/events/${safeId}`
  if (safeKind === 'p2p') return `/p2p/${safeId}`
  const params = new URLSearchParams()
  if (typeFilter && typeFilter !== 'all') params.set('type', typeFilter)
  params.set('item', `${safeKind}:${safeId}`)
  return `/feed?${params.toString()}`
}

export function isSharePreviewKind(kind) {
  return SHARE_KINDS.has(String(kind || '').trim())
}

/** Base publique des previews OG (proxy Netlify /share → Edge Function). */
export function resolveSharePreviewBaseUrl(siteUrl) {
  const base = String(siteUrl || CANONICAL_SHARE_SITE).replace(/\/$/, '')
  if (!base) return ''
  return `${base}/share`
}

export function buildSharePreviewPath(kind, entityId) {
  const safeKind = String(kind || '').trim()
  const safeId = String(entityId || '').trim()
  if (!isSharePreviewKind(safeKind) || !safeId) return ''
  return `/share/${encodeURIComponent(safeKind)}/${encodeURIComponent(safeId)}`
}

/**
 * URL OG partagee sur le domaine du site (www.moxtapp.ru/share/...).
 * Netlify proxy /share/* vers l Edge Function share-preview.
 * supabaseUrl est ignore (compat ancienne signature).
 */
export function buildSharePreviewUrl({ kind, entityId, siteUrl, supabaseUrl: _legacySupabaseUrl } = {}) {
  const base = resolveSharePreviewBaseUrl(siteUrl)
  const safeKind = String(kind || '').trim()
  const safeId = String(entityId || '').trim()
  if (!base || !isSharePreviewKind(safeKind) || !safeId) return ''
  return `${base}/${encodeURIComponent(safeKind)}/${encodeURIComponent(safeId)}`
}

/** Chemin in-app ouvert apres le clic (marketplace, fil, etc.). */
export function resolveInAppShareTarget({ kind, entityId, href, feedHref } = {}) {
  const direct = String(href || '').trim()
  if (direct) return direct
  const feed = String(feedHref || '').trim()
  if (feed) return feed
  if (kind && entityId) return buildFeedSharePath(kind, entityId)
  return '/feed'
}

/**
 * Cible de partage copiee / envoyee — toujours ouvrable sans compte :
 * fiche publique (marketplace, entreprise) ou deep link fil.
 */
export function resolvePublicShareTarget({ kind, entityId, href, feedHref } = {}) {
  const direct = String(href || '').trim()
  if (direct && isPublicSharePath(direct)) return direct
  if (direct.startsWith('/feed')) return direct
  const feed = String(feedHref || '').trim()
  if (feed) return feed
  if (kind && entityId) {
    const typeFilter = kind === 'video' ? 'video' : ''
    return buildFeedSharePath(kind, entityId, { typeFilter })
  }
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
