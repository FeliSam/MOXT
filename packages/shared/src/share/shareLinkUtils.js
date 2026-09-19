export const DEFAULT_SHARE_OG_IMAGE = 'https://moxtapp.ru/assets/logos/X.png'

/** Public app origin (deep links humans open after the OG redirect). */
export const CANONICAL_APP_SITE = 'https://moxtapp.ru'

/**
 * Host that returns real Open Graph HTML for `/share/{kind}/{id}`.
 * Custom domain share.moxtapp.ru (Let's Encrypt) on Yandex API Gateway moxt-share.
 */
export const CANONICAL_SHARE_SITE =
  'https://share.moxtapp.ru'

const SHARE_KINDS = new Set(['listing', 'parcel', 'job', 'event', 'post', 'video', 'p2p', 'business', 'user'])

/** Aliases callers may pass (ContactButton "profile", plurals, etc.). */
const SHARE_KIND_ALIASES = {
  profile: 'user',
  profiles: 'user',
  users: 'user',
  listings: 'listing',
  videos: 'video',
  posts: 'post',
  parcels: 'parcel',
  jobs: 'job',
  events: 'event',
  businesses: 'business',
}

/** Normalize UI relatedType / kind to a singular SHARE_KINDS value. */
export function normalizeShareKind(kind) {
  const raw = String(kind || '').trim()
  if (!raw) return ''
  return SHARE_KIND_ALIASES[raw] || raw
}

/** DÃ©tail accessible sans connexion (PublicationShell). */
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
  const safeKind = normalizeShareKind(kind)
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
  return SHARE_KINDS.has(normalizeShareKind(kind))
}

/** Path served by the OG gateway / share.moxtapp.ru custom domain. */
export function buildShareOgPath(kind, entityId) {
  const safeKind = normalizeShareKind(kind)
  const safeId = String(entityId || '').trim()
  if (!isSharePreviewKind(safeKind) || !safeId) return ''
  return `/share/${encodeURIComponent(safeKind)}/${encodeURIComponent(safeId)}`
}

/**
 * Absolute URL crawlers (WhatsApp, Facebook, Telegram) should fetch.
 * Always uses CANONICAL_SHARE_SITE so entity og:title / og:image are present.
 */
export function buildShareOgUrl({ kind, entityId, siteUrl } = {}) {
  const path = buildShareOgPath(kind, entityId)
  if (!path) return ''
  const site = String(siteUrl || CANONICAL_SHARE_SITE).replace(/\/$/, '')
  return `${site}${path}`
}

/** @deprecated Prefer buildShareOgUrl â€” kept for direct Edge Function debugging. */
export function resolveSharePreviewBaseUrl(supabaseUrl) {
  const base = String(supabaseUrl || '').replace(/\/$/, '')
  if (!base) return ''
  return `${base}/functions/v1/share-preview`
}

export function buildSharePreviewPath(kind, entityId) {
  const safeKind = normalizeShareKind(kind)
  const safeId = String(entityId || '').trim()
  if (!isSharePreviewKind(safeKind) || !safeId) return ''
  return `/functions/v1/share-preview/${encodeURIComponent(safeKind)}/${encodeURIComponent(safeId)}`
}

export function buildSharePreviewUrl({ kind, entityId, supabaseUrl }) {
  const base = resolveSharePreviewBaseUrl(supabaseUrl)
  const safeKind = normalizeShareKind(kind)
  const safeId = String(entityId || '').trim()
  if (!base || !isSharePreviewKind(safeKind) || !safeId) return ''
  return `${base}/${encodeURIComponent(safeKind)}/${encodeURIComponent(safeId)}`
}

/** Chemin in-app ouvert aprÃ¨s le clic (marketplace, fil, etc.). */
export function resolveInAppShareTarget({ kind, entityId, href, feedHref } = {}) {
  const direct = String(href || '').trim()
  if (direct) return direct
  const feed = String(feedHref || '').trim()
  if (feed) return feed
  if (kind && entityId) return buildFeedSharePath(kind, entityId)
  return '/feed'
}

/**
 * Cible de partage copiÃ©e / envoyÃ©e â€” toujours ouvrable sans compte :
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
  const site = String(siteUrl || CANONICAL_APP_SITE).replace(/\/$/, '')
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
  return `${text.slice(0, max - 1).trim()}â€¦`
}
