import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useQrCameraScanner } from './useQrCameraScanner'

vi.mock('@zxing/browser', () => ({
  BrowserQRCodeReader: class {
    decodeFromConstraints = vi.fn().mockResolvedValue({ stop: vi.fn() })
  },
}))

describe('useQrCameraScanner', () => {
  const stopTrack = vi.fn()
  const mockStream = {
    getTracks: () => [{ stop: stopTrack }],
  }

  beforeEach(() => {
    stopTrack.mockClear()
    vi.stubGlobal(
      'navigator',
      {
        mediaDevices: {
          getUserMedia: vi.fn(),
        },
      },
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.resetModules()
  })

  it('libère la caméra quand enabled passe à false', async () => {
    const video = document.createElement('video')
    video.srcObject = mockStream
    const videoRef = { current: video }
    const onDecode = vi.fn()

    const { rerender } = renderHook(
      ({ enabled }) => useQrCameraScanner({ enabled, videoRef, onDecode }),
      { initialProps: { enabled: true } },
    )

    await act(async () => {
      rerender({ enabled: false })
    })

    expect(stopTrack).toHaveBeenCalled()
    expect(video.srcObject).toBeNull()
  })
})
