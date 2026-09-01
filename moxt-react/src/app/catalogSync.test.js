import { describe, expect, it, vi } from 'vitest'
import { CATALOG_SYNC_TIMEOUT_MS, scheduleCatalogSync } from './catalogSync.js'

describe('catalogSync', () => {
  it('libère le refresh forcé après le timeout', async () => {
    vi.useFakeTimers()
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
    vi.useRealTimers()
  })
})
