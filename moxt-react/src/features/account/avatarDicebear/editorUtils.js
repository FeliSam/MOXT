import { isLibraryPortrait } from './portraitLibrary'

export const AVATAR_STYLES = ['portrait', 'lorelei']

/** Style restauré à l’ouverture : portrait par défaut, illustré si c’est l’avatar actuel. */
export function initialAvatarStyle({ prefs, avatarUrl } = {}) {
  if (isLibraryPortrait(avatarUrl)) return 'portrait'
  const loreleiUrl = prefs?.avatarDicebear?.avatarUrl
  if (loreleiUrl && avatarUrl && loreleiUrl.split('?')[0] === avatarUrl.split('?')[0])
    return 'lorelei'
  return prefs?.avatarStyle === 'lorelei' ? 'lorelei' : 'portrait'
}

/** Couleur claire → coche foncée (lisibilité sur teints clairs / fonds pastel). */
export function isLightColor(color) {
  if (!color || color === 'transparent') return true
  const n = Number.parseInt(String(color).replace('#', ''), 16)
  const r = (n >> 16) & 255
  const g = (n >> 8) & 255
  const b = n & 255
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 165
}
