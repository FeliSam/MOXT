import { describe, expect, it } from 'vitest'
import { getPostImages, normalizePostImages } from './postMediaUtils'

describe('postMediaUtils', () => {
  it('prefers images array and caps at 4', () => {
    expect(
      getPostImages({
        images: ['a', 'b', 'c', 'd', 'e'],
        imageUrl: 'legacy',
      }),
    ).toEqual(['a', 'b', 'c', 'd'])
  })

  it('falls back to legacy imageUrl', () => {
    expect(getPostImages({ imageUrl: 'https://x/y.jpg' })).toEqual(['https://x/y.jpg'])
  })

  it('normalizes cover + list', () => {
    expect(normalizePostImages(['u1', '', 'u2'])).toEqual({
      images: ['u1', 'u2'],
      imageUrl: 'u1',
    })
    expect(normalizePostImages([])).toEqual({ images: [], imageUrl: null })
  })
})
