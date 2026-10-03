import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import tokens from './tokens.json'
import { boxShadowStyle, cssShadowToNative, hexToRgbTriplet, resolveThemeColors, withAlpha } from './index.js'

const here = dirname(fileURLToPath(import.meta.url))
const css = readFileSync(resolve(here, '../../../../moxt-react/src/index.css'), 'utf8')

/** Contenu du premier bloc `selector { … }` (accolades équilibrées). */
function block(selectorPattern) {
  const match = new RegExp(`(?:^|\\n)${selectorPattern}\\s*\\{`).exec(css)
  if (!match) throw new Error(`Bloc introuvable : ${selectorPattern}`)
  let depth = 1
  let index = match.index + match[0].length
  const start = index
  while (depth > 0 && index < css.length) {
    if (css[index] === '{') depth += 1
    if (css[index] === '}') depth -= 1
    index += 1
  }
  return css.slice(start, index - 1)
}

function cssVars(body) {
  const out = {}
  for (const [, name, value] of body.matchAll(/--([\w-]+)\s*:\s*([^;]+);/g)) out[name] = value.trim()
  return out
}

const camel = (name) => name.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase())

function appColors(vars) {
  return Object.fromEntries(
    Object.entries(vars)
      .filter(([name]) => name.startsWith('app-'))
      .map(([name, value]) => [camel(name.slice(4)), value]),
  )
}

function brandOf(vars) {
  return Object.fromEntries(
    Object.entries(vars)
      .filter(([name]) => name.startsWith('color-brand-'))
      .map(([name, value]) => [name.slice('color-brand-'.length), value]),
  )
}

const normalizeShadow = (value) => value.replace(/\s+/g, ' ').replace(/,\s*/g, ',')

const rootVars = cssVars(block(':root'))
const darkVars = cssVars(block('\\.dark'))
const themeVars = cssVars(block('@theme'))

describe('design tokens ↔ moxt-react/src/index.css', () => {
  it('échelle brand identique à @theme', () => {
    expect(tokens.brand).toEqual(brandOf(themeVars))
  })

  it('couleurs clair identiques à :root', () => {
    expect(tokens.colors.light).toEqual(appColors(rootVars))
  })

  it('couleurs sombre identiques à .dark', () => {
    expect(tokens.colors.dark).toEqual(appColors(darkVars))
  })

  it('ombres clair / sombre identiques', () => {
    for (const [mode, vars] of [
      ['light', rootVars],
      ['dark', darkVars],
    ]) {
      const expected = Object.fromEntries(
        Object.entries(vars)
          .filter(([name]) => name.startsWith('shadow-'))
          .map(([name, value]) => [camel(name.slice(7)), normalizeShadow(value)]),
      )
      const actual = Object.fromEntries(
        Object.entries(tokens.shadows[mode]).map(([name, value]) => [name, normalizeShadow(value)]),
      )
      expect(actual).toEqual(expected)
    }
  })

  it('rayons identiques (rem) et conversion px cohérente (16px = 1rem)', () => {
    const expected = Object.fromEntries(
      Object.entries(rootVars)
        .filter(([name]) => name.startsWith('radius-'))
        .map(([name, value]) => [camel(name.slice(7)), value]),
    )
    expect(tokens.radius).toEqual(expected)
    for (const [name, rem] of Object.entries(tokens.radius)) {
      expect(tokens.radiusPx[name]).toBe(Number.parseFloat(rem) * 16)
    }
    expect(tokens.radiusPx.card).toBe(16)
    expect(tokens.radiusPx.btn).toBe(12)
  })

  it('palette prune identique à [data-profile-kind=personal]', () => {
    const light = cssVars(block("\\[data-profile-kind='personal'\\]"))
    const dark = cssVars(block("\\.dark \\[data-profile-kind='personal'\\]"))
    expect(tokens.palettes.prune.brand).toEqual(brandOf(light))
    expect(tokens.palettes.prune.light).toEqual(appColors(light))
    expect(tokens.palettes.prune.dark).toEqual(appColors(dark))
  })

  it('palette chaude identique à .theme-community + --app-warm', () => {
    const light = appColors(cssVars(block('\\.theme-community')))
    const dark = appColors(cssVars(block('\\.dark \\.theme-community')))
    expect(tokens.palettes.warm.light).toEqual({
      warm: rootVars['app-warm'],
      warmSoft: rootVars['app-warm-soft'],
      ...light,
    })
    expect(tokens.palettes.warm.dark).toEqual({
      warm: darkVars['app-warm'],
      warmSoft: darkVars['app-warm-soft'],
      ...dark,
    })
  })

  it('polices : Inter (texte) et Manrope (titres)', () => {
    expect(themeVars['font-sans']).toMatch(/^'Inter'/)
    expect(themeVars['font-display']).toMatch(/^'Manrope'/)
    expect(tokens.fonts.sans.family).toBe('Inter')
    expect(tokens.fonts.display.family).toBe('Manrope')
    expect(css).toMatch(/h1, h2, h3 \{\s*font-family: var\(--font-display\);\s*letter-spacing: -0\.01em;/)
  })

  it('gabarits en-tête et barre du bas alignés sur le CSS', () => {
    expect(css).toContain(`width: ${tokens.layout.headerHeightRem};`)
    expect(css).toContain(`font-size: ${tokens.layout.headerIconRem};`)
    expect(css).toContain(`--bottom-nav-pad: ${tokens.layout.bottomNavPadRem};`)
    expect(css).toMatch(/\.bottom-nav-indicator \{\s*box-shadow: inset 0 3px 0 var\(--app-accent\);/)
  })
})

describe('helpers', () => {
  it('hexToRgbTriplet / withAlpha', () => {
    expect(hexToRgbTriplet('#08705f')).toBe('8 112 95')
    expect(hexToRgbTriplet('#fff')).toBe('255 255 255')
    expect(withAlpha('#ffffff', 0.65)).toBe('rgba(255, 255, 255, 0.65)')
  })

  it('resolveThemeColors applique les palettes', () => {
    expect(resolveThemeColors('light').accent).toBe('#08705f')
    expect(resolveThemeColors('dark', 'prune').accent).toBe('#c77db3')
    expect(resolveThemeColors('light', 'warm').surfaceMuted).toBe('#fff4ec')
  })

  it('ombres natives', () => {
    expect(boxShadowStyle(tokens.shadows.light.card)).toEqual({ boxShadow: tokens.shadows.light.card })
    const native = cssShadowToNative(tokens.shadows.light.bottomNav)
    expect(native.shadowOffset).toEqual({ width: 0, height: 6 })
    expect(native.shadowRadius).toBe(10)
    expect(native.shadowOpacity).toBeCloseTo(0.07)
  })
})
