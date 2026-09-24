import { describe, expect, it } from 'vitest'
import { DEFAULT_FEED_PLAYBACK, normalizeFeedPlaybackConfig } from './feedPlayback.js'

describe('feedPlayback config', () => {
  it('defaults to sound on and tap-to-pause', () => {
    expect(normalizeFeedPlaybackConfig({})).toEqual(DEFAULT_FEED_PLAYBACK)
    expect(DEFAULT_FEED_PLAYBACK.soundOnByDefault).toBe(true)
    expect(DEFAULT_FEED_PLAYBACK.tapPausesVideo).toBe(true)
  })

  it('normalizes boolean flags', () => {
    expect(
      normalizeFeedPlaybackConfig({ soundOnByDefault: false, tapPausesVideo: 0 }),
    ).toEqual({ soundOnByDefault: false, tapPausesVideo: false })
  })
})
