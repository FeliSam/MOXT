import { describe, expect, it } from 'vitest'
import {
  readWatchedVideoIds,
  rememberWatchedVideo,
  watchedVideoIndex,
} from './videoWatchHistory.js'

function memoryStorage(initial = {}) {
  const data = { ...initial }
  return {
    getItem(key) {
      return Object.prototype.hasOwnProperty.call(data, key) ? data[key] : null
    },
    setItem(key, value) {
      data[key] = String(value)
    },
  }
}

describe('videoWatchHistory', () => {
  it('enregistre les visionnages les plus récents en tête', () => {
    const storage = memoryStorage()
    rememberWatchedVideo('VID-1', storage)
    rememberWatchedVideo('VID-2', storage)
    rememberWatchedVideo('VID-1', storage)
    expect(readWatchedVideoIds(storage)).toEqual(['VID-1', 'VID-2'])
    expect(watchedVideoIndex('VID-2', readWatchedVideoIds(storage))).toBe(1)
  })
})
