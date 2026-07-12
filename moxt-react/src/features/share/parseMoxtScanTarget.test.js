import { describe, expect, it } from 'vitest'
import { parseMoxtScanTarget } from './parseMoxtScanTarget'

describe('parseMoxtScanTarget', () => {
  const userId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'

  it('détecte un profil membre depuis une URL absolue MOXT', () => {
    const target = parseMoxtScanTarget(
      `https://www.moxtapp.ru/users/${userId}/publications`,
    )
    expect(target).toMatchObject({
      type: 'user',
      path: `/users/${userId}/publications`,
      userId,
    })
  })

  it('détecte un profil depuis un chemin relatif', () => {
    const target = parseMoxtScanTarget(`/users/${userId}/annonces`)
    expect(target?.type).toBe('user')
    expect(target?.path).toBe(`/users/${userId}/publications`)
  })

  it('détecte une entreprise et normalise vers les publications', () => {
    const businessId = 'biz-123'
    const target = parseMoxtScanTarget(`https://moxt.app/businesses/${businessId}`)
    expect(target).toMatchObject({
      type: 'business',
      path: `/businesses/${businessId}/publications/listings`,
      businessId,
    })
  })

  it('conserve la query sur les publications entreprise', () => {
    const businessId = 'biz-456'
    const target = parseMoxtScanTarget(
      `/businesses/${businessId}/publications/listings?v=abc`,
    )
    expect(target?.path).toBe(`/businesses/${businessId}/publications/listings?v=abc`)
  })

  it('détecte une invitation MOXT depuis le code seul', () => {
    const target = parseMoxtScanTarget('moxt-1a2b3c')
    expect(target).toMatchObject({
      type: 'invite',
      path: '/invite/MOXT-1A2B3C',
      code: 'MOXT-1A2B3C',
    })
  })

  it('détecte une invitation depuis une URL', () => {
    const target = parseMoxtScanTarget('https://www.moxtapp.ru/invite/MOXT-ABCDEF')
    expect(target?.path).toBe('/invite/MOXT-ABCDEF')
  })

  it('ignore les QR hors domaine MOXT', () => {
    expect(parseMoxtScanTarget('https://example.com/users/foo/publications')).toBeNull()
    expect(parseMoxtScanTarget('https://google.com')).toBeNull()
  })

  it('ignore les entrées vides ou invalides', () => {
    expect(parseMoxtScanTarget('')).toBeNull()
    expect(parseMoxtScanTarget('   ')).toBeNull()
    expect(parseMoxtScanTarget('hello-world')).toBeNull()
  })
})
