import { describe, expect, it } from 'vitest'
import {
  bottomNavigationItems,
  moreNavigationItem,
  moreServicesExcludedPaths,
  primaryNavigationItems,
} from './navigation.js'

describe('navigation partagée', () => {
  it('barre du bas identique au web : Transfert · Moxt · Market · Fil', () => {
    expect(bottomNavigationItems.map((item) => item.id)).toEqual(['transfers', 'home', 'marketplace', 'feed'])
    expect(bottomNavigationItems.map((item) => item.label)).toEqual(['Transfert', 'Moxt', 'Market', 'Fil'])
    expect(bottomNavigationItems.map((item) => item.icon)).toEqual(['repeat', 'home', 'shopping-bag', 'rss'])
    expect(moreNavigationItem).toMatchObject({ label: 'Plus', path: '/moxt', icon: 'grid' })
  })

  it('ordre de la navigation principale identique au web', () => {
    expect(primaryNavigationItems.map((item) => item.id)).toEqual([
      'home',
      'transfers',
      'marketplace',
      'parcels',
      'jobs',
      'messages',
      'businesses',
      'exchanger-dashboard',
      'news',
    ])
  })

  it('chemins exclus du menu Plus inchangés pour le web', () => {
    expect([...moreServicesExcludedPaths].sort()).toEqual(
      [
        '/dashboard',
        '/feed',
        '/jobs/applications',
        '/marketplace',
        '/messages',
        '/notifications',
        '/parcels',
        '/transfers',
        '/videos',
      ].sort(),
    )
  })
})
