import { beforeEach, describe, expect, it, vi } from 'vitest'
import { parseMoxtScanTarget } from './parseMoxtScanTarget'
import { buildUserProfileShareUrl, userPublicProfilePath } from './userShareUtils'

describe('userShareUtils', () => {
  const userId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'

  beforeEach(() => {
    vi.stubEnv('VITE_SITE_URL', 'https://moxtapp.ru')
  })

  it('construit le chemin public du profil membre', () => {
    expect(userPublicProfilePath(userId)).toBe(`/users/${userId}/publications`)
    expect(userPublicProfilePath('  ')).toBe('')
    expect(userPublicProfilePath(null)).toBe('')
  })

  it('encode l’URL canonique moxtapp.ru dans le QR perso', () => {
    expect(buildUserProfileShareUrl(userId)).toBe(`https://moxtapp.ru/users/${userId}/publications`)
  })

  it('échappe les identifiants et renvoie une chaîne vide sans id', () => {
    expect(buildUserProfileShareUrl('a b/c')).toBe(
      'https://moxtapp.ru/users/a%20b%2Fc/publications',
    )
    expect(buildUserProfileShareUrl('')).toBe('')
  })

  it('reste lisible par le scanner QR intégré', () => {
    expect(parseMoxtScanTarget(buildUserProfileShareUrl(userId))).toMatchObject({
      type: 'user',
      path: `/users/${userId}/publications`,
      userId,
    })
  })
})
