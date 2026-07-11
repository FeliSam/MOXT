import { describe, expect, it } from 'vitest'
import { SHARE_REFERRAL_CATALOGS } from './shareReferralCatalog.js'
import { translateUiText } from './uiTranslations.js'

describe('shareReferralCatalog', () => {
  it('expose les memes cles en en, ru et pt', () => {
    const keys = Object.keys(SHARE_REFERRAL_CATALOGS.en)
    expect(Object.keys(SHARE_REFERRAL_CATALOGS.ru).sort()).toEqual(keys.sort())
    expect(Object.keys(SHARE_REFERRAL_CATALOGS.pt).sort()).toEqual(keys.sort())
  })

  it('traduit les libelles partage via translateUiText', () => {
    expect(translateUiText('Services supplémentaires', 'en')).toBe('Additional services')
    expect(translateUiText('QR code & invitation', 'ru')).toBe('QR-код и приглашение')
    expect(translateUiText("Renvoyer l'e-mail", 'pt')).toBe('Reenviar e-mail')
    expect(translateUiText('Services essentiels', 'en')).toBe('Essential services')
    expect(translateUiText('Synchronisation…', 'ru')).toBe('Синхронизация…')
    expect(translateUiText('Type de partage', 'pt')).toBe('Tipo de partilha')
  })
})
