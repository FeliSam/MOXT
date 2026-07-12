import { describe, expect, it } from 'vitest'
import {
  buildTranslationBundle,
  diffTranslationBundle,
  validateTranslationBundle,
} from './translationBundle.js'

describe('translationBundle', () => {
  it('exporte phrases UI et clés structurées', () => {
    const bundle = buildTranslationBundle()
    expect(bundle.meta.format).toBe('moxt-i18n-v1')
    expect(bundle.uiPhrases.length).toBeGreaterThan(100)
    expect(bundle.keys.length).toBeGreaterThan(10)
    expect(bundle.uiPhrases.some((row) => row.fr === 'Accueil' && row.en === 'Home')).toBe(true)
    expect(bundle.keys.some((row) => row.key === 'auth.login.title')).toBe(true)
  })

  it('détecte les différences entre deux bundles', () => {
    const current = buildTranslationBundle()
    const incoming = structuredClone(current)
    incoming.uiPhrases.find((row) => row.fr === 'Accueil').en = 'Homepage'
    incoming.keys.find((row) => row.key === 'auth.login.title').en = 'Log in to MOXT'

    const { uiChanges, keyChanges } = diffTranslationBundle(current, incoming)
    expect(uiChanges).toEqual([
      expect.objectContaining({ fr: 'Accueil', lang: 'en', to: 'Homepage' }),
    ])
    expect(keyChanges).toEqual([
      expect.objectContaining({ key: 'auth.login.title', lang: 'en', to: 'Log in to MOXT' }),
    ])
  })

  it('valide la structure du JSON importé', () => {
    expect(() => validateTranslationBundle(null)).toThrow(/invalide/i)
    expect(() => validateTranslationBundle({ uiPhrases: [] })).toThrow(/uiPhrases/)
    expect(validateTranslationBundle({ uiPhrases: [], keys: [] })).toEqual({
      uiPhrases: [],
      keys: [],
    })
  })
})
