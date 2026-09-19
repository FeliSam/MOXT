import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { NATIVE_PAUSE_EVENT } from '../../platform/capacitor.js'
import { setFeedPlaybackAllowed, resetFeedPlaybackAllowed } from './feedPlaybackSession.js'
import {
  FEED_PLAY_WATCHDOG_MS,
  primeFeedVideoElement,
  useFeedVideoPlayback,
} from './useFeedVideoPlayback.js'

describe('primeFeedVideoElement', () => {
  it('pose playsinline pour l’autoplay iOS WKWebView', () => {
    const el = document.createElement('video')
    primeFeedVideoElement(el)
    expect(el.playsInline).toBe(true)
    expect(el.getAttribute('playsinline')).not.toBeNull()
    expect(el.getAttribute('webkit-playsinline')).not.toBeNull()
  })
})

describe('useFeedVideoPlayback', () => {
  afterEach(() => {
    resetFeedPlaybackAllowed()
    document.documentElement.classList.remove('capacitor-paused')
    vi.useRealTimers()
  })

  it('pause la vidéo au unmount et quand le Fil n’est plus autorisé', () => {
    setFeedPlaybackAllowed(true)
    const el = document.createElement('video')
    const paused = []
    el.pause = () => {
      paused.push('pause')
    }
    el.play = () => Promise.resolve()
    const videoRef = { current: el }

    const { unmount } = renderHook(() =>
      useFeedVideoPlayback(videoRef, {
        active: true,
        muted: true,
        playbackUrl: 'https://example.com/v.mp4',
        videoId: 'v1',
      }),
    )

    expect(paused.length).toBe(0)
    act(() => {
      setFeedPlaybackAllowed(false)
    })
    expect(paused.length).toBeGreaterThan(0)

    const beforeUnmount = paused.length
    unmount()
    expect(paused.length).toBeGreaterThanOrEqual(beforeUnmount)
  })

  it('ne relance pas la lecture après une pause native', () => {
    setFeedPlaybackAllowed(true)
    const el = document.createElement('video')
    let playCount = 0
    el.pause = () => {}
    el.play = () => {
      playCount += 1
      return Promise.resolve()
    }
    Object.defineProperty(el, 'paused', { configurable: true, get: () => playCount === 0 })
    Object.defineProperty(el, 'ended', { configurable: true, get: () => false })
    Object.defineProperty(el, 'readyState', { configurable: true, get: () => 4 })
    const videoRef = { current: el }

    renderHook(() =>
      useFeedVideoPlayback(videoRef, {
        active: true,
        muted: true,
        playbackUrl: 'https://example.com/v.mp4',
        videoId: 'v1',
      }),
    )

    const playsAfterMount = playCount
    act(() => {
      document.documentElement.classList.add('capacitor-paused')
      window.dispatchEvent(new Event(NATIVE_PAUSE_EVENT))
    })
    const playsAfterPause = playCount
    act(() => {
      el.dispatchEvent(new Event('pause'))
    })
    expect(playCount).toBe(playsAfterPause)
    expect(playsAfterMount).toBeGreaterThan(0)
  })

  it('watchdog relance play() si active + readyState≥2 mais toujours paused', async () => {
    vi.useFakeTimers()
    setFeedPlaybackAllowed(true)
    const el = document.createElement('video')
    let playCount = 0
    let paused = true
    el.pause = () => {
      paused = true
    }
    el.play = () => {
      playCount += 1
      // First attempts abort (simulates load race); later succeed.
      if (playCount < 3) return Promise.reject(new DOMException('interrupted', 'AbortError'))
      paused = false
      return Promise.resolve()
    }
    Object.defineProperty(el, 'paused', { configurable: true, get: () => paused })
    Object.defineProperty(el, 'ended', { configurable: true, get: () => false })
    Object.defineProperty(el, 'readyState', { configurable: true, get: () => 4 })
    const videoRef = { current: el }

    renderHook(() =>
      useFeedVideoPlayback(videoRef, {
        active: true,
        muted: true,
        playbackUrl: 'https://storage.yandexcloud.net/bucket/v.mp4',
        videoId: 'v1',
      }),
    )

    expect(playCount).toBeGreaterThan(0)
    const afterMount = playCount

    await act(async () => {
      await vi.advanceTimersByTimeAsync(FEED_PLAY_WATCHDOG_MS * 3)
    })

    expect(playCount).toBeGreaterThan(afterMount)
    expect(paused).toBe(false)
  })

  it('ne relance pas via watchdog après pause utilisateur', async () => {
    vi.useFakeTimers()
    setFeedPlaybackAllowed(true)
    const el = document.createElement('video')
    let playCount = 0
    let paused = true
    el.pause = () => {
      paused = true
    }
    el.play = () => {
      playCount += 1
      paused = false
      return Promise.resolve()
    }
    Object.defineProperty(el, 'paused', { configurable: true, get: () => paused })
    Object.defineProperty(el, 'ended', { configurable: true, get: () => false })
    Object.defineProperty(el, 'readyState', { configurable: true, get: () => 4 })
    const videoRef = { current: el }

    const { result } = renderHook(() =>
      useFeedVideoPlayback(videoRef, {
        active: true,
        muted: true,
        playbackUrl: 'https://example.com/v.mp4',
        videoId: 'v1',
      }),
    )

    await act(async () => {
      result.current.pauseByUser()
    })
    const afterUserPause = playCount

    await act(async () => {
      await vi.advanceTimersByTimeAsync(FEED_PLAY_WATCHDOG_MS * 5)
    })

    expect(playCount).toBe(afterUserPause)
    expect(paused).toBe(true)
  })
})
