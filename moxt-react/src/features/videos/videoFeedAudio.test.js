import { describe, expect, it } from 'vitest'
import {
  getVideoFeedMuted,
  setVideoFeedMuted,
  subscribeVideoFeedMuted,
} from './videoFeedAudio.js'

describe('videoFeedAudio', () => {
  it('keeps mute preference across subscribers', () => {
    setVideoFeedMuted(true)
    const seen = []
    const unsubscribe = subscribeVideoFeedMuted((value) => seen.push(value))

    setVideoFeedMuted(false)
    setVideoFeedMuted((current) => !current)

    unsubscribe()
    setVideoFeedMuted(true)

    expect(seen).toEqual([false, true])
    expect(getVideoFeedMuted()).toBe(true)
  })
})
