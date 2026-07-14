import { describe, expect, it } from 'vitest'
import { bottomNavigationItems } from './bottomNavigation'
import { primaryNavigationItems } from './primaryNavigation'
import { getRouteMetadata } from './routeMeta'

describe('route metadata', () => {
  it('selects specific detail metadata before list metadata', () => {
    expect(getRouteMetadata('/transfers/MXT-1')).toMatchObject({
      title: 'Détail du transfert',
      back: '/transfers',
    })
  })

  it('resolves the P2P publish route before offer detail', () => {
    expect(getRouteMetadata('/p2p/publish')).toMatchObject({
      title: 'Proposer une offre P2P',
      back: '/p2p',
    })
  })

  it('provides a safe fallback for future routes', () => {
    expect(getRouteMetadata('/future-module')).toMatchObject({
      title: 'MOXT',
      eyebrow: 'Espace personnel',
    })
  })

  it('keeps the mobile navigation short and unique', () => {
    expect(bottomNavigationItems).toHaveLength(4)
    expect(bottomNavigationItems.map((item) => item.id)).toEqual([
      'transfers',
      'home',
      'marketplace',
      'parcels',
    ])
    expect(new Set(bottomNavigationItems.map((item) => item.id)).size).toBe(4)
    expect(new Set(bottomNavigationItems.map((item) => item.path)).size).toBe(4)
  })

  it('wires owned-business rail entry to enterprise view, not public fiche', () => {
    const enterprise = primaryNavigationItems.find((item) => item.id === 'businesses')
    expect(enterprise).toMatchObject({
      path: '/professional',
      requiresOwnedBusiness: true,
    })
    expect(primaryNavigationItems.some((item) => item.id === 'notifications')).toBe(false)
  })

  it('resolves Centre de contrôle and espace professionnel metadata', () => {
    expect(getRouteMetadata('/admin')).toMatchObject({
      title: 'Centre de contrôle',
      eyebrow: 'Administration',
    })
    expect(getRouteMetadata('/professional')).toMatchObject({
      title: 'Espace professionnel',
      eyebrow: 'Services',
    })
  })
})
