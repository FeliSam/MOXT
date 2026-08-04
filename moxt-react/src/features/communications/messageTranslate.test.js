import { describe, expect, it, beforeEach } from 'vitest'
import {
  clearTranslationCache,
  getCachedTranslation,
  otherTranslateLanguages,
  setCachedTranslation,
  translationCacheKey,
} from './messageTranslate.js'

describe('messageTranslate helpers', () => {
  beforeEach(() => {
    clearTranslationCache()
  })

  it('exclut la langue UI courante des options', () => {
    expect(otherTranslateLanguages('fr')).toEqual(['en', 'ru', 'pt', 'es'])
    expect(otherTranslateLanguages('ru')).toEqual(['fr', 'en', 'pt', 'es'])
  })

  it('cache les traductions par message et langue', () => {
    setCachedTranslation('m1', 'en', 'Hello')
    expect(getCachedTranslation('m1', 'en')).toMatchObject({
      translatedText: 'Hello',
      targetLang: 'en',
    })
    expect(getCachedTranslation('m1', 'ru')).toBeNull()
    expect(translationCacheKey('m1', 'en')).toBe('m1::en')
  })
})
