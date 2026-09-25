import { isLibraryPortrait } from './portraitLibrary'

export const AVATAR_STYLES = ['portrait', 'lorelei']

function preferredAvatarStyle({ prefs, avatarUrl, defaultStyle }) {
  if (isLibraryPortrait(avatarUrl)) return 'portrait'
  const loreleiUrl = prefs?.avatarDicebear?.avatarUrl
  if (loreleiUrl && avatarUrl && loreleiUrl.split('?')[0] === avatarUrl.split('?')[0])
    return 'lorelei'
  if (prefs?.avatarStyle === 'lorelei') return 'lorelei'
  if (prefs?.avatarStyle === 'portrait') return 'portrait'
  return AVATAR_STYLES.includes(defaultStyle) ? defaultStyle : 'portrait'
}

/**
 * Style restauré à l’ouverture : celui de l’avatar actuel, sinon le style par défaut de l’admin
 * (portrait par défaut). `styles` = styles activés dans l’admin (module Avatar).
 */
export function initialAvatarStyle({
  prefs,
  avatarUrl,
  defaultStyle = 'portrait',
  styles = AVATAR_STYLES,
} = {}) {
  const preferred = preferredAvatarStyle({ prefs, avatarUrl, defaultStyle })
  if (!styles?.length || styles.includes(preferred)) return preferred
  return styles.includes(defaultStyle) ? defaultStyle : styles[0]
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
