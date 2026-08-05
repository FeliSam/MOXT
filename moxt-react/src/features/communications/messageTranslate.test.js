import { describe, expect, it, beforeEach, vi } from 'vitest'
import {
  clearTranslationCache,
  detectMessageLanguage,
  getCachedTranslation,
  pickTranslatedTextForTest,
  setCachedTranslation,
  shouldAutoTranslate,
  translateLanguageOptionsForUser,
  translationCacheKey,
  TRANSLATE_BATCH_SIZE,
} from './messageTranslate.js'

describe('messageTranslate helpers', () => {
  beforeEach(() => {
    clearTranslationCache()
    vi.restoreAllMocks()
  })

  it('détecte la langue du message', () => {
    expect(detectMessageLanguage('Bonjour, comment ça va ?')).toBe('fr')
    expect(detectMessageLanguage('Hello, how are you today?')).toBe('en')
    expect(detectMessageLanguage('Привет, как дела?')).toBe('ru')
    expect(detectMessageLanguage('OK')).toBeNull()
  })

  it('auto-traduit seulement si langue message ≠ langue UI', () => {
    expect(shouldAutoTranslate('Hello there friend', 'fr')).toBe(true)
    expect(shouldAutoTranslate('Bonjour tout le monde', 'fr')).toBe(false)
    expect(shouldAutoTranslate('Bonjour', 'fr', 'fr')).toBe(false)
    expect(shouldAutoTranslate('OK', 'fr')).toBe(false)
  })

  it('propose les langues lecteur + russe pour les utilisateurs', () => {
    expect(translateLanguageOptionsForUser({ readerLanguage: 'en', isAdmin: false })).toEqual([
      'en',
      'ru',
    ])
    expect(translateLanguageOptionsForUser({ readerLanguage: 'ru', isAdmin: false })).toEqual([
      'ru',
    ])
  })

  it('cache les traductions par message et langue', () => {
    setCachedTranslation('m1', 'en', 'Hello')
    expect(getCachedTranslation('m1', 'en')).toMatchObject({
      translatedText: 'Hello',
      targetLang: 'en',
    })
    expect(translationCacheKey('m1', 'en')).toBe('m1::en')
  })

  it('persiste le cache en sessionStorage', () => {
    const store = {}
    vi.stubGlobal('sessionStorage', {
      getItem: (key) => store[key] || null,
      setItem: (key, value) => {
        store[key] = value
      },
      removeItem: (key) => {
        delete store[key]
      },
    })

    clearTranslationCache()
    setCachedTranslation('m2', 'fr', 'Salut')
    expect(store['moxt-msg-tr-cache-v1']).toContain('Salut')
  })

  it('extrait la traduction depuis la réponse edge', () => {
    expect(pickTranslatedTextForTest({ translatedText: 'Hello' })).toBe('Hello')
  })

  it('expose une taille de batch raisonnable', () => {
    expect(TRANSLATE_BATCH_SIZE).toBe(10)
  })
})
