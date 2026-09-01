import { describe, expect, it } from 'vitest'
import { asArray, asIdLookup, ensureMap, mapGet, mapHas, readSearchParam } from './feedCollectionUtils.js'

describe('feedCollectionUtils', () => {
  it('asArray normalise objets et tableaux', () => {
    expect(asArray([1, 2])).toEqual([1, 2])
    expect(asArray({ a: 1, b: 2 })).toEqual([1, 2])
    expect(asArray(null)).toEqual([])
  })

  it('ensureMap accepte Map ou objet indexé par clé feed', () => {
    const map = ensureMap({ 'video:V1': { entity_type: 'video', entity_id: 'V1' } })
    expect(mapHas(map, 'video:V1')).toBe(true)
    expect(mapGet(map, 'video:V1')?.entity_id).toBe('V1')
  })

  it('mapGet ne plante pas si .get est absent', () => {
    expect(mapGet({}, 'video:V1')).toBeUndefined()
    expect(mapGet({ get: undefined }, 'video:V1')).toBeUndefined()
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
