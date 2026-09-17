import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  NATIVE_PAUSE_EVENT,
  NATIVE_RESUME_EVENT,
  markNativePaused,
  recoverNativeUiAfterResume,
} from './capacitor.js'

describe('recoverNativeUiAfterResume', () => {
  afterEach(() => {
    document.documentElement.className = ''
    document.documentElement.style.cssText = ''
    document.querySelectorAll('.moxt-loading-screen').forEach((node) => node.remove())
  })

  it('clears paused / splash-lock / keyboard-open and emits resume', () => {
    const root = document.documentElement
    root.classList.add('capacitor-paused', 'moxt-splash-lock', 'keyboard-open')
    root.style.setProperty('--keyboard-inset', '280px')

    const resume = vi.fn()
    window.addEventListener(NATIVE_RESUME_EVENT, resume)

    recoverNativeUiAfterResume(root)

    expect(root.classList.contains('capacitor-paused')).toBe(false)
    expect(root.classList.contains('moxt-splash-lock')).toBe(false)
    expect(root.classList.contains('keyboard-open')).toBe(false)
    expect(root.style.getPropertyValue('--keyboard-inset')).toBe('0px')
    expect(resume).toHaveBeenCalledTimes(1)

    window.removeEventListener(NATIVE_RESUME_EVENT, resume)
  })

  it('keeps splash lock while the brand splash overlay is still mounted', () => {
    const splash = document.createElement('div')
    splash.className = 'moxt-loading-screen'
    document.body.appendChild(splash)
    document.documentElement.classList.add('moxt-splash-lock')

    recoverNativeUiAfterResume()

    expect(document.documentElement.classList.contains('moxt-splash-lock')).toBe(true)
  })

  it('markNativePaused latches background, pauses media, and emits pause', () => {
    const pause = vi.fn()
    window.addEventListener(NATIVE_PAUSE_EVENT, pause)
    document.documentElement.classList.add('keyboard-open')
    const video = document.createElement('video')
    video.pause = vi.fn()
    document.body.appendChild(video)

    markNativePaused()

    expect(document.documentElement.classList.contains('capacitor-paused')).toBe(true)
    expect(document.documentElement.classList.contains('keyboard-open')).toBe(false)
    expect(video.pause).toHaveBeenCalled()
    expect(pause).toHaveBeenCalledTimes(1)
    window.removeEventListener(NATIVE_PAUSE_EVENT, pause)
    video.remove()
  })
})
