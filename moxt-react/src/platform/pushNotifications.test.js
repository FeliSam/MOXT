import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('./capacitor', () => ({
  isNative: false,
}))

describe('pushNotifications', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.resetModules()
  })

  it('ne fait rien sur le web', async () => {
    const { initNativePushNotifications, getStoredPushToken } = await import('./pushNotifications')
    const result = await initNativePushNotifications()
    expect(result).toEqual({ enabled: false, reason: 'web' })
    expect(getStoredPushToken()).toBeNull()
  })
})
