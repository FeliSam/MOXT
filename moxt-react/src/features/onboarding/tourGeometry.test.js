import { describe, expect, it } from 'vitest'
import { inflateRect, placeTourCard } from './tourGeometry.js'

describe('tourGeometry', () => {
  it('inflates a rect with padding', () => {
    const rect = { top: 100, left: 50, width: 80, height: 40, bottom: 140, right: 130 }
    expect(inflateRect(rect, 10)).toEqual({
      top: 90,
      left: 40,
      width: 100,
      height: 60,
      bottom: 150,
      right: 140,
    })
  })

  it('centers the card when there is no hole', () => {
    const pos = placeTourCard(null, 'center', { width: 320, height: 200 })
    expect(pos.left).toBeGreaterThan(0)
    expect(pos.top).toBeGreaterThan(0)
    expect(pos.arrow).toBeNull()
  })

  it('places the card above a bottom hole', () => {
    const hole = { top: 700, left: 40, width: 300, height: 70, bottom: 770, right: 340 }
    const pos = placeTourCard(hole, 'top', { width: 300, height: 180 })
    expect(pos.top).toBeLessThan(hole.top)
    expect(pos.arrow).toBe('top')
  })
})
