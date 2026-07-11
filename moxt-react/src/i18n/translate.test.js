import { describe, expect, it } from 'vitest'
import { translate } from './translate'

describe('translate', () => {
  it('traduit en anglais via clés pointées', () => {
    expect(translate('fr', 'auth.login.title')).toBe('Connexion')
    expect(translate('en', 'auth.login.title')).toBe('Sign in')
  })

  it('retombe sur le français pour une langue inconnue', () => {
    expect(translate('es', 'auth.login.submit')).toBe('Se connecter')
  })

  it('traduit en russe via les locales dédiées', () => {
    expect(translate('ru', 'auth.login.title')).toBe('Вход')
    expect(translate('ru', 'share.title')).toBe('QR-код и приглашение')
  })

  it('traduit en portugais via les locales dédiées', () => {
    expect(translate('pt', 'nav.qrInvitation')).toBe('QR e convite')
  })

  it('renvoie la clé elle-même si elle est introuvable', () => {
    expect(translate('fr', 'does.not.exist')).toBe('does.not.exist')
  })

  it('interpole les variables dans les clés auth.register', () => {
    expect(translate('en', 'auth.register.resendCooldown', { seconds: 42 })).toBe('Resend in 42s')
    expect(translate('fr', 'share.shareTexts.profile', { name: 'Amina' })).toBe(
      'Consultez les publications de Amina sur MOXT.',
    )
    expect(translate('ru', 'messages.syncing')).toBe('Синхронизация…')
    expect(translate('pt', 'share.inviteTab')).toBe('Convidar')
  })
})
