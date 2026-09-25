/**
 * Bibliothèque de portraits Moxt (CDN) — helpers légers, sans le manifeste,
 * utilisables partout (badge « Avatar », variantes d’affichage).
 */

export const PORTRAIT_LIBRARY_PREFIX = 'https://cdn.moxtapp.ru/avatars/portraits/'
/** Même objet servi en direct par Object Storage (resolveMediaDisplayUrl réécrit le CDN). */
const PORTRAIT_STORAGE_PREFIX = 'https://storage.yandexcloud.net/moxt-public/avatars/portraits/'

const PORTRAIT_PATH_RE = /\/avatars\/portraits\/(v\d+)\/(?:thumbs\/)?([a-z0-9-]+)\.jpg(?:[?#].*)?$/i

/** true si l’URL pointe vers un portrait de la bibliothèque (et non une photo perso). */
export function isLibraryPortrait(url) {
  if (!url || typeof url !== 'string') return false
  const value = url.trim()
  return value.startsWith(PORTRAIT_LIBRARY_PREFIX) || value.startsWith(PORTRAIT_STORAGE_PREFIX)
}

/** { version, id } d’un portrait de la bibliothèque, ou null. */
export function parseLibraryPortraitUrl(url) {
  if (!isLibraryPortrait(url)) return null
  const match = url.trim().match(PORTRAIT_PATH_RE)
  return match ? { version: match[1], id: match[2] } : null
}

/**
 * Variante d’affichage : vignette 256 px pour les petits avatars, 512 px sinon.
 * Fichiers statiques immuables → pas de paramètres de redimensionnement.
 */
export function libraryPortraitDisplayUrl(url, { width = 96 } = {}) {
  const parsed = parseLibraryPortraitUrl(url)
  if (!parsed) return url
  const base = url.trim().split(/[?#]/)[0]
  const root = base.slice(0, base.indexOf(`/avatars/portraits/${parsed.version}/`))
  const folder = `${root}/avatars/portraits/${parsed.version}/`
  return width <= 256 ? `${folder}thumbs/${parsed.id}.jpg` : `${folder}${parsed.id}.jpg`
}

/** Avatar illustré (Lorelei) enregistré par l’éditeur : avatars/{userId}/lorelei.png. */
const LORELEI_PATH_RE = /\/avatars\/[^/?#]+\/lorelei\.(?:png|jpe?g)(?:[?#]|$)/i

export function isLoreleiAvatarUrl(url) {
  return typeof url === 'string' && LORELEI_PATH_RE.test(url.trim())
}

function baseOf(url) {
  return String(url || '')
    .trim()
    .split(/[?#]/)[0]
}

/**
 * Avatar généré par l’éditeur Moxt (portrait de la bibliothèque ou illustré Lorelei) —
 * jamais une photo perso. `loreleiUrl` (preferences.avatarDicebear.avatarUrl) couvre les
 * avatars illustrés enregistrés avant le chemin dédié `lorelei.png`.
 */
export function isGeneratedAvatar(url, { loreleiUrl } = {}) {
  if (!url || typeof url !== 'string') return false
  if (isLibraryPortrait(url) || isLoreleiAvatarUrl(url)) return true
  return Boolean(loreleiUrl) && baseOf(loreleiUrl) === baseOf(url)
}
