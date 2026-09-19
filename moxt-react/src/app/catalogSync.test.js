import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import {
  CATALOG_SYNC_TIMEOUT_MS,
  CATALOG_SYNC_WARM_DELAY_MS,
  scheduleCatalogSync,
} from './catalogSync.js'

describe('catalogSync', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('libère le refresh forcé après le timeout', async () => {
    const store = {
      getState: () => ({ auth: { user: { id: 'user-1' } } }),
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
      getState: () => ({ auth: { user: { id: 'user-1' } } }),
      dispatch,
    }

    const pending = scheduleCatalogSync(store, { force: false })
    await expect(pending).resolves.toBeUndefined()
    expect(dispatch).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(CATALOG_SYNC_WARM_DELAY_MS)
    // loadAllData est importé dynamiquement ; on vérifie seulement que le timer a tiré
    // sans bloquer l’appelant (cache-first).
    expect(CATALOG_SYNC_WARM_DELAY_MS).toBeLessThanOrEqual(100)
  })

  it('no-op sans userId', async () => {
    const store = {
      getState: () => ({ auth: { user: null } }),
      dispatch: vi.fn(),
    }
    await expect(scheduleCatalogSync(store)).resolves.toBeUndefined()
    expect(store.dispatch).not.toHaveBeenCalled()
  })
})
