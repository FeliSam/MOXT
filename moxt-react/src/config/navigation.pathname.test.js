import { describe, expect, it } from 'vitest'
import { pathnameFromTo } from './navigation.js'

describe('pathnameFromTo', () => {
  it('strips query and hash from a path string', () => {
    expect(pathnameFromTo('/marketplace?q=1#top')).toBe('/marketplace')
  })

  it('reads pathname from a location object', () => {
    expect(pathnameFromTo({ pathname: '/parcels', search: '?x=1' })).toBe('/parcels')
  })
})
