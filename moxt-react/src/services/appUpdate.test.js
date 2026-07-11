import { describe, expect, it, vi } from 'vitest'
import {
  checkForAppUpdate,
  fetchRemoteBuildId,
  scheduleAppReload,
  shouldApplyUpdate,
  startAppUpdateWatcher,
} from './appUpdate'

describe('appUpdate', () => {
  it('detecte une nouvelle version', () => {
    expect(shouldApplyUpdate('abc', 'abc')).toBe(false)
    expect(shouldApplyUpdate('abc', 'def')).toBe(true)
    expect(shouldApplyUpdate('', 'def')).toBe(false)
  })

  it('lit buildId depuis version.json', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ buildId: 'eb505fc' }),
    })
    await expect(fetchRemoteBuildId(fetchImpl)).resolves.toBe('eb505fc')
    expect(fetchImpl).toHaveBeenCalledWith(
      expect.stringMatching(/^\/version\.json\?ts=\d+$/),
      expect.objectContaining({ cache: 'no-store' }),
    )
  })

  it('declenche onUpdate quand la version distante change', async () => {
    const onUpdate = vi.fn()
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ buildId: 'nouveau' }),
    })

    await expect(
      checkForAppUpdate({ localBuildId: 'ancien', fetchImpl, onUpdate }),
    ).resolves.toBe(true)
    expect(onUpdate).toHaveBeenCalledOnce()
  })

  it('planifie un reload differe', () => {
    vi.useFakeTimers()
    const reload = vi.fn()
    scheduleAppReload({ reload, delayMs: 1000 })
    expect(reload).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1000)
    expect(reload).toHaveBeenCalledOnce()
    vi.useRealTimers()
  })

  it('verifie la version au demarrage et au retour sur l onglet', () => {
    vi.useFakeTimers()
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ buildId: 'abc' }),
    })
    const documentRef = {
      visibilityState: 'visible',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }

    const stop = startAppUpdateWatcher({
      localBuildId: 'abc',
      fetchImpl,
      intervalMs: 60_000,
      documentRef,
    })

    expect(fetchImpl).toHaveBeenCalledTimes(1)
    const visibleHandler = documentRef.addEventListener.mock.calls.find(([event]) => event === 'visibilitychange')?.[1]
    visibleHandler?.()
    expect(fetchImpl).toHaveBeenCalledTimes(2)

    stop()
    vi.useRealTimers()
  })
})
