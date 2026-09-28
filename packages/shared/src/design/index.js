/**
 * Jetons de design MOXT partagés web ↔ mobile.
 *
 * `tokens.json` est la source de vérité (lisible en CommonJS par
 * `apps/mobile/tailwind.config.js`). Les valeurs sont extraites de
 * `moxt-react/src/index.css` et vérifiées par `tokens.test.js`.
 */
import tokens from './tokens.json'

export const designTokens = tokens
export const brandScale = tokens.brand
export const themeColors = tokens.colors
export const themeShadows = tokens.shadows
export const radiusTokens = tokens.radiusPx
export const spacingTokens = tokens.spacing
export const fontTokens = tokens.fonts
export const typographyTokens = tokens.typography
export const layoutTokens = tokens.layout
export const palettes = tokens.palettes

/** Couleurs résolues d’un thème, avec palette optionnelle (`prune` | `warm`). */
export function resolveThemeColors(mode = 'light', palette = null) {
  const base = tokens.colors[mode === 'dark' ? 'dark' : 'light']
  const overlay = palette ? tokens.palettes[palette]?.[mode === 'dark' ? 'dark' : 'light'] : null
  return overlay ? { ...base, ...overlay } : { ...base }
}

/** `#rrggbb` → `"r g b"` (format attendu par `rgb(var(--x) / <alpha-value>)`). */
export function hexToRgbTriplet(hex) {
  const value = String(hex).replace('#', '')
  const full = value.length === 3 ? value.split('').map((c) => c + c).join('') : value
  const int = Number.parseInt(full, 16)
  return `${(int >> 16) & 255} ${(int >> 8) & 255} ${int & 255}`
}

/** `#rrggbb` + alpha (0–1) → `rgba(...)`. */
export function withAlpha(hex, alpha) {
  const [r, g, b] = hexToRgbTriplet(hex).split(' ')
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

/**
 * Ombre CSS (`0 4px 16px rgba(0,0,0,0.04), …`) → style React Native.
 * Repli pour l’ancienne architecture : une seule couche (la plus diffuse).
 */
export function cssShadowToNative(shadow) {
  const layers = String(shadow)
    .split(/,(?![^(]*\))/)
    .map((layer) => layer.trim())
    .filter(Boolean)
    .map((layer) => {
      const color = layer.match(/rgba?\([^)]*\)/)?.[0] ?? 'rgba(0,0,0,0.1)'
      const nums = layer
        .replace(color, '')
        .trim()
        .split(/\s+/)
        .map((n) => Number.parseFloat(n))
      const [x = 0, y = 0, blur = 0, spread = 0] = nums
      const parts = color.match(/[\d.]+/g)?.map(Number) ?? [0, 0, 0, 0.1]
      return { x, y, blur, spread, rgb: parts.slice(0, 3), alpha: parts[3] ?? 1 }
    })
    .filter((layer) => layer.spread === 0 || layer.blur > 0)
  const main = layers.reduce((best, layer) => (layer.blur > (best?.blur ?? -1) ? layer : best), null)
  if (!main) return {}
  const [r, g, b] = main.rgb
  return {
    shadowColor: `rgb(${r}, ${g}, ${b})`,
    shadowOffset: { width: main.x, height: main.y },
    shadowOpacity: main.alpha,
    shadowRadius: main.blur / 2,
    elevation: Math.max(1, Math.round(main.y / 2)),
  }
}

/**
 * Style d’ombre fidèle au web : `boxShadow` CSS multi-couches (React Native ≥ 0.76,
 * nouvelle architecture, et react-native-web).
 */
export function boxShadowStyle(shadow) {
  return shadow ? { boxShadow: shadow } : {}
}
