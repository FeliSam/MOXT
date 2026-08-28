import { describe, expect, it, beforeEach } from 'vitest'
import {
  CATALOG_SYNC_TTL_MS,
  hasCachedFeedCatalog,
  hasUsableFeedCatalog,
  isCatalogSyncFresh,
  markCatalogSynced,
} from './catalogSync.js'

describe('catalogSync', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('détecte un catalogue feed en cache local', () => {
    localStorage.setItem('moxt-listings-v1', '[]')
    localStorage.setItem('moxt-videos-v1', '[]')
    localStorage.setItem('moxt-businesses-v1', '[]')
    expect(hasCachedFeedCatalog()).toBe(true)
    expect(hasUsableFeedCatalog()).toBe(false)
  })

  it('considère le cache utilisable seulement avec du contenu', () => {
    localStorage.setItem('moxt-listings-v1', '[]')
    localStorage.setItem('moxt-videos-v1', '[{"id":"v1"}]')
    localStorage.setItem('moxt-businesses-v1', '[]')
    expect(hasUsableFeedCatalog()).toBe(true)
  })

  it('considère la sync fraîche tant que le TTL ne dépasse pas', () => {
    markCatalogSynced('user-1')
    expect(isCatalogSyncFresh('user-1', CATALOG_SYNC_TTL_MS)).toBe(true)
    expect(isCatalogSyncFresh('user-2', CATALOG_SYNC_TTL_MS)).toBe(false)
  })
})
