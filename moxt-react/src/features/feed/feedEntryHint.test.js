import { describe, expect, it } from 'vitest'
import {
  FEED_ENTRY_HINT_DISTANCE_RATIO,
  FEED_ENTRY_HINT_DURATION_MS,
  feedEntryHintOffset,
  playFeedEntryHint,
  prefersReducedMotion,
} from './feedEntryHint.js'

describe('feedEntryHint', () => {
  it('revient au point de départ à t=0 et t=1, pic vers 30% viewport', () => {
    const delta = 800 * FEED_ENTRY_HINT_DISTANCE_RATIO
    expect(feedEntryHintOffset(0, delta)).toBe(0)
    expect(feedEntryHintOffset(1, delta)).toBe(0)
    expect(feedEntryHintOffset(0.42, delta)).toBeCloseTo(delta, 5)
    expect(FEED_ENTRY_HINT_DURATION_MS).toBe(3000)
  })

  it('respecte prefers-reduced-motion', () => {
    expect(prefersReducedMotion({ matches: true })).toBe(true)
    expect(prefersReducedMotion({ matches: false })).toBe(false)
  })

  it('anime scrollTop puis restaure la position', async () => {
    const scroller = {
      scrollTop: 400,
      clientHeight: 800,
      style: { scrollSnapType: 'y mandatory' },
    }
    const frames = []
    const promise = playFeedEntryHint(scroller, {
      raf: (cb) => {
        frames.push(cb)
        return frames.length
      },
      cancelRaf: () => {},
    })
    expect(frames).toHaveLength(1)
    frames[0](0)
    expect(scroller.style.scrollSnapType).toBe('none')
    frames.at(-1)(1260)
    expect(scroller.scrollTop).toBeGreaterThan(400)
    frames.at(-1)(3000)
    await expect(promise).resolves.toBe('done')
    expect(scroller.scrollTop).toBe(400)
    expect(scroller.style.scrollSnapType).toBe('y mandatory')
  })

  it('annule et revient au départ si shouldCancel', async () => {
    const scroller = {
      scrollTop: 0,
      clientHeight: 800,
      style: { scrollSnapType: 'y mandatory' },
    }
    const frames = []
    let cancel = false
    const promise = playFeedEntryHint(scroller, {
      raf: (cb) => {
        frames.push(cb)
        return frames.length
      },
      cancelRaf: () => {},
      shouldCancel: () => cancel,
    })
    frames[0](0)
    frames.at(-1)(800)
    expect(scroller.scrollTop).toBeGreaterThan(0)
    cancel = true
    frames.at(-1)(900)
    await expect(promise).resolves.toBe('cancelled')
    expect(scroller.scrollTop).toBe(0)
    expect(scroller.style.scrollSnapType).toBe('y mandatory')
  })
})
