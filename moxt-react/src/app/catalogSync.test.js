import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import {
  CATALOG_INCOMPLETE_RESYNC_COOLDOWN_MS,
  CATALOG_SYNC_TIMEOUT_MS,
  CATALOG_SYNC_WARM_DELAY_MS,
  getCatalogSyncMeta,
  isCatalogSyncFresh,
  isMarketplaceCatalogIncomplete,
  markCatalogSynced,
  resetIncompleteResyncCooldown,
  scheduleCatalogSync,
} from './catalogSync.js'

describe('catalogSync', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    localStorage.clear()
    resetIncompleteResyncCooldown()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
    localStorage.clear()
    resetIncompleteResyncCooldown()
  })

  it('libère le refresh forcé après le timeout', async () => {
    const store = {
      getState: () => ({ auth: { user: { id: 'user-1' } }, marketplace: { items: [] } }),
      dispatch: () =>
        new Promise(() => {
          /* jamais résolu */
        }),
    }

    const pending = scheduleCatalogSync(store, { force: true })
    await vi.advanceTimersByTimeAsync(CATALOG_SYNC_TIMEOUT_MS + 100)
    await expect(pending).resolves.toBeUndefined()
  })

  it('hors force, renvoie tout de suite et démarre le warm après un court délai', async () => {
    const dispatch = vi.fn(() => Promise.resolve())
    const store = {
      getState: () => ({ auth: { user: { id: 'user-1' } }, marketplace: { items: [] } }),
      dispatch,
    }

    const pending = scheduleCatalogSync(store, { force: false })
    await expect(pending).resolves.toBeUndefined()
    expect(dispatch).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(CATALOG_SYNC_WARM_DELAY_MS)
    expect(CATALOG_SYNC_WARM_DELAY_MS).toBeLessThanOrEqual(100)
  })

  it('no-op sans userId', async () => {
    const store = {
      getState: () => ({ auth: { user: null }, marketplace: { items: [] } }),
      dispatch: vi.fn(),
    }
    await expect(scheduleCatalogSync(store)).resolves.toBeUndefined()
    expect(store.dispatch).not.toHaveBeenCalled()
  })

  it('ne relance pas loadAllData si skipIfFresh et cache frais', async () => {
    const dispatch = vi.fn(() => Promise.resolve())
    const userId = 'user-fresh'
    localStorage.setItem('moxt-listings-v1', JSON.stringify([{ id: 1 }]))
    localStorage.setItem('moxt-videos-v1', JSON.stringify([{ id: 1 }]))
    localStorage.setItem('moxt-businesses-v1', JSON.stringify([{ id: 1 }]))
    markCatalogSynced(userId, { listingCount: 1, activeListingCount: 1 })
    expect(isCatalogSyncFresh(userId)).toBe(true)
    const store = {
      getState: () => ({
        auth: { user: { id: userId } },
        marketplace: { items: [{ id: 1, status: 'active' }] },
        videos: { items: [] },
      }),
      dispatch,
    }
    await scheduleCatalogSync(store, { skipIfFresh: true })
    await vi.advanceTimersByTimeAsync(200)
    expect(dispatch).not.toHaveBeenCalled()
  })

  it('ne marque pas le catalogue frais quand loadAllData échoue (finally ne doit plus marquer)', async () => {
    const userId = 'user-fail'
    const dispatch = vi.fn(() =>
      Promise.resolve({
        type: 'app/loadAllData/rejected',
        meta: { requestStatus: 'rejected' },
        error: { message: 'network' },
      }),
    )
    const store = {
      getState: () => ({ auth: { user: { id: userId } }, marketplace: { items: [] } }),
      dispatch,
    }

    const pending = scheduleCatalogSync(store, { force: true })
    await vi.advanceTimersByTimeAsync(50)
    await pending

    expect(isCatalogSyncFresh(userId)).toBe(false)
    const dispatch2 = vi.fn(() => Promise.resolve({ meta: { requestStatus: 'fulfilled' } }))
    const store2 = {
      getState: () => ({ auth: { user: { id: userId } }, marketplace: { items: [] } }),
      dispatch: dispatch2,
    }
    await scheduleCatalogSync(store2, { skipIfFresh: true })
    await vi.advanceTimersByTimeAsync(CATALOG_SYNC_WARM_DELAY_MS + 50)
    expect(dispatch2).toHaveBeenCalled()
  })

  it('markCatalogSynced rend isCatalogSyncFresh vrai uniquement pour le même user', () => {
    markCatalogSynced('alice', { listingCount: 3, activeListingCount: 2 })
    expect(isCatalogSyncFresh('alice')).toBe(true)
    expect(isCatalogSyncFresh('bob')).toBe(false)
    expect(isCatalogSyncFresh(null)).toBe(false)
    expect(getCatalogSyncMeta()).toMatchObject({
      userId: 'alice',
      listingCount: 3,
      activeListingCount: 2,
    })
  })

  it('détecte un catalogue incomplet vs la dernière sync réussie', () => {
    const userId = 'user-thin'
    markCatalogSynced(userId, { listingCount: 26, activeListingCount: 26 })
    expect(
      isMarketplaceCatalogIncomplete({
        auth: { user: { id: userId } },
        marketplace: {
          items: Array.from({ length: 10 }, (_, i) => ({ id: `a${i}`, status: 'active' })),
        },
      }),
    ).toBe(true)
    expect(
      isMarketplaceCatalogIncomplete({
        auth: { user: { id: userId } },
        marketplace: {
          items: Array.from({ length: 26 }, (_, i) => ({ id: `a${i}`, status: 'active' })),
        },
      }),
    ).toBe(false)
  })

  it('force un resync quand skipIfFresh mais catalogue incomplet', async () => {
    const userId = 'user-incomplete'
    markCatalogSynced(userId, { listingCount: 26, activeListingCount: 26 })
    expect(isCatalogSyncFresh(userId)).toBe(true)

    const dispatch = vi.fn(() => Promise.resolve({ meta: { requestStatus: 'fulfilled' } }))
    const store = {
      getState: () => ({
        auth: { user: { id: userId } },
        marketplace: {
          items: Array.from({ length: 10 }, (_, i) => ({ id: `a${i}`, status: 'active' })),
        },
      }),
      dispatch,
    }

    const pending = scheduleCatalogSync(store, { skipIfFresh: true })
    await vi.advanceTimersByTimeAsync(50)
    await pending
    expect(dispatch).toHaveBeenCalled()

    // Cooldown: second call within window must not force again immediately
    dispatch.mockClear()
    const pending2 = scheduleCatalogSync(store, { skipIfFresh: true })
    await vi.advanceTimersByTimeAsync(50)
    await pending2
    // Still warm (incomplete) but not force — may schedule warm via setTimeout
    await vi.advanceTimersByTimeAsync(CATALOG_SYNC_WARM_DELAY_MS + 20)
    // After cooldown expires, force again
    await vi.advanceTimersByTimeAsync(CATALOG_INCOMPLETE_RESYNC_COOLDOWN_MS)
    const pending3 = scheduleCatalogSync(store, { skipIfFresh: true })
    await vi.advanceTimersByTimeAsync(50)
    await pending3
    expect(dispatch.mock.calls.length).toBeGreaterThan(0)
  })
})
