import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('./capacitor', () => ({
  isNative: false,
}))

vi.mock('../pwa', () => ({
  isStandalone: vi.fn(() => true),
}))

describe('webPush', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.unstubAllEnvs()
  })

  it('refuse sans clé VAPID', async () => {
    const { isWebPushContextReady } = await import('./webPush')
    expect(isWebPushContextReady()).toBe(false)
  })

  it('décode une clé VAPID base64url', async () => {
    const { urlBase64ToUint8Array } = await import('./webPush')
    const bytes = urlBase64ToUint8Array('AQID')
    expect(Array.from(bytes)).toEqual([1, 2, 3])
  })

  it('exige l installation PWA sur iPhone', async () => {
    vi.stubEnv('VITE_VAPID_PUBLIC_KEY', 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrA_VzRaKK0R2VHpj2ukAQM2vXdtXCIADAx9hd4WBw')
    vi.stubGlobal('Notification', {})
    vi.stubGlobal('PushManager', {})
    vi.stubGlobal('navigator', {
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
      serviceWorker: {},
    })

    const pwa = await import('../pwa')
    vi.mocked(pwa.isStandalone).mockReturnValue(false)

    const { getWebPushInstallHint, isWebPushContextReady } = await import('./webPush')
    expect(getWebPushInstallHint()).toBe('ios_install_required')
    expect(isWebPushContextReady()).toBe(false)
  })
})
