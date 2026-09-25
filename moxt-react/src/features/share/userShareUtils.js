import { buildAbsoluteUrl } from '../../utils/siteUrl'

/** Chemin public in-app du profil membre (même route que le scan QR et les liens de partage). */
export function userPublicProfilePath(userId) {
  const safeId = String(userId || '').trim()
  if (!safeId) return ''
  return `/users/${encodeURIComponent(safeId)}/publications`
}

/**
 * URL absolue encodée dans le QR du profil perso : lien direct vers le profil public
 * sur le domaine canonique (https://moxtapp.ru en prod / natif, origine courante en preview).
 */
export function buildUserProfileShareUrl(userId) {
  const path = userPublicProfilePath(userId)
  return path ? buildAbsoluteUrl(path) : ''
}
