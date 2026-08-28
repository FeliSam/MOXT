import { describe, expect, it } from 'vitest'
import {
  annotateTrendingItems,
  feedEngagement,
  scoreFeedItem,
  sortByFeedScore,
} from './feedRankUtils.js'

describe('feedRankUtils', () => {
  it('calcule l’engagement cross-kind', () => {
    expect(feedEngagement({ stats: { views: 10, likes: 2, comments: 1 } })).toBe(10 + 8 + 3)
  })

  it('favorise récence et engagement', () => {
    const fresh = scoreFeedItem(
      { kind: 'video', createdAt: new Date().toISOString(), stats: { views: 100, likes: 5 } },
      {},
    )
    const old = scoreFeedItem(
      { kind: 'video', createdAt: '2020-01-01T00:00:00.000Z', stats: { views: 100, likes: 5 } },
      {},
    )
    expect(fresh).toBeGreaterThan(old)
  })

  it('trie par score décroissant', () => {
    const sorted = sortByFeedScore(
      [
        { id: 'a', kind: 'post', createdAt: '2026-08-01T00:00:00.000Z', stats: { likes: 1 } },
        { id: 'b', kind: 'video', createdAt: '2026-08-28T00:00:00.000Z', stats: { views: 200, likes: 10 } },
      ],
      {},
    )
    expect(sorted[0].id).toBe('b')
  })

  it('marque les items tendance', () => {
    const items = annotateTrendingItems([
      { id: '1', stats: { views: 100, likes: 20 } },
      { id: '2', stats: { views: 1 } },
    ])
    expect(items.find((row) => row.id === '1')?.isTrending).toBe(true)
    expect(items.find((row) => row.id === '2')?.isTrending).toBe(false)
  })
})
