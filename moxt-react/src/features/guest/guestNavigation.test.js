import { describe, expect, it, beforeEach } from 'vitest'
import {
  clearReturnTo,
  resolveAuthenticatedLanding,
  resolveDeepLinkDestination,
  resolveMoxtScanDestination,
  resolveScanNavigation,
} from './guestNavigation'

const userId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
const completeUser = {
  id: userId,
  firstName: 'Ada',
  lastName: 'Lovelace',
  city: 'Moscou',
  originCountry: 'BJ',
  phone: '+79001234567',
}

describe('guestNavigation session QR', () => {
  beforeEach(() => {
    clearReturnTo()
  })
  it('envoie vers le profil quand la session est active sur une invitation', () => {
    const target = {
      type: 'invite',
      path: '/invite/MOXT-1A2B3C',
      code: 'MOXT-1A2B3C',
    }

    expect(resolveMoxtScanDestination(target, completeUser)).toBe('/profile')
    expect(resolveDeepLinkDestination('/invite/MOXT-1A2B3C', completeUser)).toBe('/profile')
  })

  it('envoie vers le profil pour son propre QR membre', () => {
    const target = {
      type: 'user',
      path: `/users/${userId}/publications`,
      userId,
    }

    expect(resolveMoxtScanDestination(target, completeUser)).toBe('/profile')
    expect(
      resolveDeepLinkDestination(`/users/${userId}/publications`, completeUser),
    ).toBe('/profile')
  })

  it('conserve la fiche d un autre membre quand on est connecte', () => {
    const otherId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
    const target = {
      type: 'user',
      path: `/users/${otherId}/publications`,
      userId: otherId,
    }

    expect(resolveMoxtScanDestination(target, completeUser)).toBe(
      `/users/${otherId}/publications`,
    )
    expect(resolveScanNavigation(target, completeUser)).toBe(`/users/${otherId}/publications`)
  })

  it('demande la connexion pour le profil d un autre membre sans session', () => {
    const otherId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
    const target = {
      type: 'user',
      path: `/users/${otherId}/publications`,
      userId: otherId,
    }

    expect(resolveScanNavigation(target, null)).toBe(
      `/login?returnTo=${encodeURIComponent(`/users/${otherId}/publications`)}`,
    )
    expect(resolveDeepLinkDestination(`/users/${otherId}/publications`, null)).toBe(
      `/login?returnTo=${encodeURIComponent(`/users/${otherId}/publications`)}`,
    )
  })

  it('laisse les liens invités sans session inchangés', () => {
    expect(resolveMoxtScanDestination({ type: 'invite', path: '/invite/MOXT-ABC' }, null)).toBe(
      '/invite/MOXT-ABC',
    )
    expect(resolveDeepLinkDestination('/invite/MOXT-ABC', null)).toBe('/invite/MOXT-ABC')
  })

  it('privilégie le profil pour une arrivée authentifiée sans retour explicite', () => {
    const params = new URLSearchParams()
    expect(resolveAuthenticatedLanding(params, null)).toBe('/profile')
  })

  it('respecte un returnTo explicite pour une session active', () => {
    const params = new URLSearchParams({ returnTo: '/messages' })
    expect(resolveAuthenticatedLanding(params, null)).toBe('/messages')
  })
})
