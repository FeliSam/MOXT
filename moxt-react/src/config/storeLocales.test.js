import { describe, expect, it } from 'vitest'
import { localeForStore, normalizeStoreLocalesConfig } from './storeLocales'

describe('storeLocales', () => {
  it('applique FR par défaut iOS / Play / web et RU sur RuStore', () => {
    const locales = normalizeStoreLocalesConfig({})
    expect(locales.ios).toBe('fr')
    expect(locales.play).toBe('fr')
    expect(locales.web).toBe('fr')
    expect(locales.rustore).toBe('ru')
  })

  it('ignore une langue inconnue', () => {
    expect(normalizeStoreLocalesConfig({ ios: 'de', rustore: 'xx' })).toEqual({
      ios: 'fr',
      play: 'fr',
      rustore: 'ru',
      web: 'fr',
    })
  })

  it('résout la langue du store courant', () => {
    const config = { ios: 'en', play: 'fr', rustore: 'ru', web: 'pt' }
    expect(localeForStore('ios', config)).toBe('en')
    expect(localeForStore('rustore', config)).toBe('ru')
  })
})
