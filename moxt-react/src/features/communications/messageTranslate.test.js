import { describe, expect, it, beforeEach } from 'vitest'
import {
  clearTranslationCache,
  detectMessageLanguage,
  getCachedTranslation,
  pickTranslatedTextForTest,
  setCachedTranslation,
  shouldAutoTranslate,
  translationCacheKey,
} from './messageTranslate.js'

describe('messageTranslate helpers', () => {
  beforeEach(() => {
    clearTranslationCache()
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
    expect(shouldAutoTranslate('OK', 'fr')).toBe(false)
  })

  it('cache les traductions par message et langue', () => {
    setCachedTranslation('m1', 'en', 'Hello')
    expect(getCachedTranslation('m1', 'en')).toMatchObject({
      translatedText: 'Hello',
      targetLang: 'en',
    })
    expect(translationCacheKey('m1', 'en')).toBe('m1::en')
  })

  it('extrait la traduction depuis la réponse edge', () => {
    expect(pickTranslatedTextForTest({ translatedText: 'Hello' })).toBe('Hello')
  })
})
