import { describe, expect, it } from 'vitest'
import { FEED_VIEWPORT_MEDIA_QUERY } from './feedViewport.js'

describe('feedViewport', () => {
  it('cible le breakpoint mobile Fil (< md Tailwind)', () => {
    expect(FEED_VIEWPORT_MEDIA_QUERY).toBe('(max-width: 767px)')
  })
})
