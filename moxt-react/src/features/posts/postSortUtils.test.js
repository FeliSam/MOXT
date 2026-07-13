import { describe, expect, it } from 'vitest'
import { postPublishedAt, sortPostsByPublishedAt } from './postSortUtils'

describe('postSortUtils', () => {
  it('prefers lastSharedAt over createdAt', () => {
    expect(
      postPublishedAt({
        createdAt: '2026-01-01T00:00:00.000Z',
        lastSharedAt: '2026-07-01T00:00:00.000Z',
      }),
    ).toBe('2026-07-01T00:00:00.000Z')
  })

  it('sorts posts from newest to oldest', () => {
    const sorted = sortPostsByPublishedAt([
      { id: 'old', createdAt: '2026-01-01T00:00:00.000Z' },
      { id: 'new', createdAt: '2026-07-01T00:00:00.000Z' },
      { id: 'reshared', createdAt: '2026-02-01T00:00:00.000Z', lastSharedAt: '2026-08-01T00:00:00.000Z' },
    ])

    expect(sorted.map((post) => post.id)).toEqual(['reshared', 'new', 'old'])
  })
})
