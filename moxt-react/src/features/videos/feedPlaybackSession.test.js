import { afterEach, describe, expect, it } from 'vitest'
import {
  canFeedVideoAutoplay,
  isFeedPlaybackAllowed,
  resetFeedPlaybackAllowed,
  setFeedPlaybackAllowed,
} from './feedPlaybackSession.js'

describe('feedPlaybackSession', () => {
  afterEach(() => {
    resetFeedPlaybackAllowed()
    document.documentElement.classList.remove('capacitor-paused')
  })

  it('interdit l’autoplay hors du Fil', () => {
    setFeedPlaybackAllowed(false)
    expect(isFeedPlaybackAllowed()).toBe(false)
    expect(canFeedVideoAutoplay()).toBe(false)
  })

  it('interdit l’autoplay pendant une pause native', () => {
    setFeedPlaybackAllowed(true)
    document.documentElement.classList.add('capacitor-paused')
    expect(canFeedVideoAutoplay()).toBe(false)
  })
})
