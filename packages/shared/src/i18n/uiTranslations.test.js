import { describe, expect, it } from 'vitest'
import {
  SOURCE_LANGUAGE,
  SUPPORTED_LANGUAGES,
  cycleLanguage,
  normalizeStoredLanguage,
  translateUiText,
} from './uiTranslations.js'

describe('translateUiText', () => {
  it('laisse le texte intact dans la langue source (fr)', () => {
    expect(translateUiText('Accueil', 'fr')).toBe('Accueil')
  })

  it('renvoie les valeurs non-chaîne telles quelles', () => {
    expect(translateUiText(42, 'en')).toBe(42)
    expect(translateUiText(null, 'en')).toBe(null)
    expect(translateUiText(undefined, 'en')).toBe(undefined)
  })

  it('renvoie le texte tel quel pour une langue non supportée', () => {
    expect(translateUiText('Accueil', 'es')).toBe('Accueil')
  })

  it('traduit une phrase connue en anglais', () => {
    expect(translateUiText('Accueil', 'en')).toBe('Home')
    expect(translateUiText('Mon profil', 'en')).toBe('My profile')
    expect(translateUiText('Jobs actifs', 'en')).toBe('Active jobs')
  })

  it('préserve les espaces de début et de fin', () => {
    expect(translateUiText('  Accueil  ', 'en')).toBe('  Home  ')
  })

  it('renvoie la valeur initiale pour une chaîne vide ou blanche', () => {
    expect(translateUiText('   ', 'en')).toBe('   ')
    expect(translateUiText('', 'en')).toBe('')
  })

  it('traduit les placeholders de recherche', () => {
    expect(translateUiText('Recherche globale', 'en')).toBe('Global search')
    expect(translateUiText('Recherche globale', 'ru')).toBe('Глобальный поиск')
    expect(translateUiText('Recherche globale', 'pt')).toBe('Pesquisa global')
    expect(
      translateUiText('Rechercher : iPhone, coiffure, appartement, électricien...', 'en'),
    ).toBe('Search: iPhone, haircut, apartment, electrician...')
  })

  it('traduit les libellés récents partage et navigation', () => {
    expect(translateUiText('Services supplémentaires', 'en')).toBe('Additional services')
    expect(translateUiText('Services supplémentaires', 'ru')).toBe('Дополнительные услуги')
    expect(translateUiText('QR code & invitation', 'pt')).toBe('QR code e convite')
    expect(translateUiText('Copier le lien', 'en')).toBe('Copy link')
    expect(translateUiText('Services essentiels', 'ru')).toBe('Основные сервисы')
    expect(translateUiText('Charger les messages précédents', 'pt')).toBe(
      'Carregar mensagens anteriores',
    )
  })
})

describe('cycleLanguage', () => {
  it('cycle fr → en → ru → pt → fr', () => {
    expect(cycleLanguage('fr')).toBe('en')
    expect(cycleLanguage('en')).toBe('ru')
    expect(cycleLanguage('ru')).toBe('pt')
    expect(cycleLanguage('pt')).toBe('fr')
  })

  it('retombe sur la langue source pour une valeur inconnue', () => {
    expect(cycleLanguage('zz')).toBe(SOURCE_LANGUAGE)
  })
})

describe('normalizeStoredLanguage', () => {
  it('conserve les langues supportées', () => {
    expect(normalizeStoredLanguage('ru')).toBe('ru')
    expect(normalizeStoredLanguage('pt')).toBe('pt')
  })

  it('reinitialise une langue inconnue vers le francais', () => {
    expect(normalizeStoredLanguage('es')).toBe('fr')
  })
})

describe('constantes', () => {
  it('expose les langues supportées et la langue source', () => {
    expect(SUPPORTED_LANGUAGES).toEqual(['fr', 'en', 'ru', 'pt'])
    expect(SOURCE_LANGUAGE).toBe('fr')
  })
})
