import { describe, expect, it } from 'vitest'
import {
  emptyPublications,
  isPublicationsShrink,
  mergePublications,
  preferRicherPublications,
} from './publicPageCatalog.js'

describe('publicPageCatalog', () => {
  it('mergePublications keeps local-only rows and updates remote', () => {
    const local = {
      ...emptyPublications(),
      listings: [{ id: 'a', title: 'local' }],
      videos: [{ id: 'v1', title: 'keep' }],
    }
    const remote = {
      ...emptyPublications(),
      listings: [{ id: 'a', title: 'remote' }, { id: 'b', title: 'new' }],
    }
    const next = mergePublications(local, remote)
    expect(next.listings.find((x) => x.id === 'a')?.title).toBe('remote')
    expect(next.listings.some((x) => x.id === 'b')).toBe(true)
    expect(next.videos.some((x) => x.id === 'v1')).toBe(true)
  })

  it('preferRicherPublications does not drop the richer side', () => {
    const rich = {
      ...emptyPublications(),
      listings: [{ id: '1' }, { id: '2' }, { id: '3' }],
      videos: [{ id: 'v1' }, { id: 'v2' }],
    }
    const thin = {
      ...emptyPublications(),
      listings: [{ id: '1' }],
    }
    const next = preferRicherPublications(rich, thin)
    expect(next.listings.length).toBeGreaterThanOrEqual(3)
    expect(next.videos.length).toBe(2)
  })

  it('isPublicationsShrink detects dramatic remote shrink', () => {
    const local = {
      ...emptyPublications(),
      listings: [{ id: '1' }, { id: '2' }, { id: '3' }, { id: '4' }],
      videos: [{ id: 'v1' }, { id: 'v2' }],
    }
    const remote = {
      ...emptyPublications(),
      listings: [{ id: '1' }],
    }
    expect(isPublicationsShrink(local, remote)).toBe(true)
    expect(isPublicationsShrink(local, local)).toBe(false)
  })
})
