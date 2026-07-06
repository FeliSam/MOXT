import { describe, expect, it } from 'vitest'
import { translate } from './translate'

describe('translate', () => {
  it('traduit en anglais via clés pointées', () => {
    expect(translate('fr', 'auth.login.title')).toBe('Connexion')
    expect(translate('en', 'auth.login.title')).toBe('Sign in')
  })

  it('retombe sur le français pour le russe ou une langue inconnue', () => {
    expect(translate('ru', 'auth.login.title')).toBe('Connexion')
    expect(translate('es', 'auth.login.submit')).toBe('Se connecter')
  })

  it('renvoie la clé elle-même si elle est introuvable', () => {
    expect(translate('fr', 'does.not.exist')).toBe('does.not.exist')
  })

  it('ignore les variables superflues sans altérer la sortie', () => {
    expect(translate('en', 'auth.login.email', { unused: 'x' })).toBe('Email address')
  })
})
