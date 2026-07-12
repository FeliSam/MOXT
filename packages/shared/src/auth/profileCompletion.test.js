import { describe, expect, it } from 'vitest'
import { isProfileComplete } from './profileCompletion.js'

describe('isProfileComplete', () => {
  it('refuse un profil Google sans numéro russe ni ville', () => {
    expect(
      isProfileComplete({
        id: '1',
        firstName: 'Ada',
        lastName: 'Lovelace',
        email: 'ada@example.com',
        phone: '+7',
        originCountry: 'BJ',
        city: '',
      }),
    ).toBe(false)
  })

  it('accepte un profil MOXT complet', () => {
    expect(
      isProfileComplete({
        id: '1',
        firstName: 'Ada',
        lastName: 'Lovelace',
        email: 'ada@example.com',
        phone: '+79001234567',
        originCountry: 'BJ',
        city: 'Moscou',
      }),
    ).toBe(true)
  })
})

describe('needsOAuthProfileCompletion', () => {
  it('cible les connexions sociales sans numéro russe', async () => {
    const { needsOAuthProfileCompletion } = await import('./profileCompletion.js')
    expect(
      needsOAuthProfileCompletion({
        id: '1',
        firstName: 'Ada',
        lastName: 'Lovelace',
        email: 'ada@example.com',
        phone: '+7',
        originCountry: 'BJ',
        city: '',
      }),
    ).toBe(true)
    expect(
      needsOAuthProfileCompletion({
        id: '2',
        firstName: 'Ada',
        lastName: 'Lovelace',
        email: 'ada@example.com',
        phone: '+79001234567',
        originCountry: 'BJ',
        city: 'Moscou',
      }),
    ).toBe(false)
  })
})
