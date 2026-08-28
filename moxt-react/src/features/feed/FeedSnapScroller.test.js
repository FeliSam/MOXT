import { describe, expect, it } from 'vitest'
import { FEED_MOUNT_RADIUS, isFeedAtFirstLogical, isSlideMounted, shouldTriggerFeedRefresh } from './FeedSnapScroller.jsx'

describe('isSlideMounted', () => {
  it('monte ±radius autour de l’index actif', () => {
    expect(isSlideMounted(5, 5)).toBe(true)
    expect(isSlideMounted(3, 5)).toBe(true)
    expect(isSlideMounted(7, 5)).toBe(true)
    expect(isSlideMounted(2, 5)).toBe(false)
    expect(isSlideMounted(0, 5)).toBe(false)
  })

  it('monte aussi les copies de boucle pour que le haut du fil ne soit pas vide', () => {
    const loopSize = 5
    const active = loopSize
    const opts = { looping: true, loopSize, radius: FEED_MOUNT_RADIUS }
    expect(isSlideMounted(0, active, opts)).toBe(true)
    expect(isSlideMounted(1, active, opts)).toBe(true)
    expect(isSlideMounted(2, active, opts)).toBe(true)
    expect(isSlideMounted(3, active, opts)).toBe(true)
    expect(isSlideMounted(13, active, opts)).toBe(false)
    expect(isSlideMounted(10, active, opts)).toBe(true)
    expect(isSlideMounted(11, active, opts)).toBe(true)
  })

  it('détecte la première slide logique et le seuil de refresh', () => {
    expect(isFeedAtFirstLogical(5, true, 5)).toBe(true)
    expect(isFeedAtFirstLogical(6, true, 5)).toBe(false)
    expect(isFeedAtFirstLogical(0, false, 8)).toBe(true)
    expect(shouldTriggerFeedRefresh(40)).toBe(false)
    expect(shouldTriggerFeedRefresh(64)).toBe(true)
  })
})
