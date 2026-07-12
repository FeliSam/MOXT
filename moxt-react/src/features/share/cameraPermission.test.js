import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { queryCameraPermission, requestCameraAccess } from './cameraPermission'

describe('cameraPermission', () => {
  beforeEach(() => {
    vi.stubGlobal('navigator', {
      mediaDevices: {
        getUserMedia: vi.fn(),
      },
      permissions: {
        query: vi.fn(),
      },
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('retourne unsupported sans getUserMedia', async () => {
    vi.stubGlobal('navigator', {})
    expect(await queryCameraPermission()).toBe('unsupported')
    expect((await requestCameraAccess()).reason).toBe('unsupported')
  })

  it('lit l’état via Permissions API', async () => {
    navigator.permissions.query.mockResolvedValue({ state: 'granted' })
    expect(await queryCameraPermission()).toBe('granted')
  })

  it('retombe sur prompt si Permissions API échoue', async () => {
    navigator.permissions.query.mockRejectedValue(new Error('unsupported'))
    expect(await queryCameraPermission()).toBe('prompt')
  })

  it('accorde l’accès et libère le flux', async () => {
    const stop = vi.fn()
    navigator.mediaDevices.getUserMedia.mockResolvedValue({
      getTracks: () => [{ stop }],
    })

    const result = await requestCameraAccess()
    expect(result.granted).toBe(true)
    expect(stop).toHaveBeenCalled()
  })

  it('détecte un refus utilisateur', async () => {
    navigator.mediaDevices.getUserMedia.mockRejectedValue(
      Object.assign(new Error('denied'), { name: 'NotAllowedError' }),
    )

    const result = await requestCameraAccess()
    expect(result).toEqual({ granted: false, reason: 'denied' })
  })
})
