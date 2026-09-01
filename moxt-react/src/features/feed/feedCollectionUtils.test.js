import { describe, expect, it } from 'vitest'
import { asArray, asIdLookup, readSearchParam } from './feedCollectionUtils.js'

describe('feedCollectionUtils', () => {
  it('asArray normalise objets et tableaux', () => {
    expect(asArray([1, 2])).toEqual([1, 2])
    expect(asArray({ a: 1, b: 2 })).toEqual([1, 2])
    expect(asArray(null)).toEqual([])
  })

  it('asIdLookup accepte Map ou liste', () => {
    const map = asIdLookup([{ id: 'v1', title: 'A' }])
    expect(map.get('v1')?.title).toBe('A')
  })

  it('readSearchParam lit URLSearchParams', () => {
    const params = new URLSearchParams('type=video&item=video%3A1')
    expect(readSearchParam(params, 'type')).toBe('video')
    expect(readSearchParam(params, 'missing', 'all')).toBe('all')
  })
})
