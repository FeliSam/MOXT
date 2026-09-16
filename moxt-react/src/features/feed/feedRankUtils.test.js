import { describe, expect, it } from 'vitest'
import {
  annotateTrendingItems,
  ensureLeadVideo,
  feedEngagement,
  pickLeadVideo,
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
        {
          id: 'b',
          kind: 'video',
          createdAt: '2026-08-28T00:00:00.000Z',
          stats: { views: 200, likes: 10 },
        },
      ],
      {},
    )
    expect(sorted[0].id).toBe('b')
  })

  it('varie le score selon le sel de suggestion', () => {
    const item = {
      id: 'a',
      kind: 'post',
      createdAt: '2026-08-01T00:00:00.000Z',
      stats: { likes: 1 },
    }
    const now = Date.parse('2026-08-28T00:00:00.000Z')
    const scores = ['1', '2', '3', '4', '5', '6', '7'].map((suggestionSalt) =>
      scoreFeedItem(item, { suggestionSalt, now }),
    )
    expect(new Set(scores).size).toBeGreaterThan(1)
  })

  it('marque les items tendance', () => {
    const items = annotateTrendingItems([
      { id: '1', stats: { views: 100, likes: 20 } },
      { id: '2', stats: { views: 1 } },
    ])
    expect(items.find((row) => row.id === '1')?.isTrending).toBe(true)
    expect(items.find((row) => row.id === '2')?.isTrending).toBe(false)
  })

  it('place toujours une vidéo en tête quand il en existe une', () => {
    const lead = pickLeadVideo(
      [
        {
          id: 'listing:L',
          kind: 'listing',
          createdAt: '2026-09-01T00:00:00.000Z',
          stats: { likes: 40 },
        },
        {
          id: 'video:old',
          kind: 'video',
          entityId: 'old',
          createdAt: '2026-01-01T00:00:00.000Z',
          stats: { views: 2 },
        },
        {
          id: 'video:fresh',
          kind: 'video',
          entityId: 'fresh',
          createdAt: '2026-09-01T00:00:00.000Z',
          stats: { views: 8, likes: 3 },
        },
      ],
      { now: Date.parse('2026-09-02T00:00:00.000Z'), watchedVideoIds: ['old'] },
    )
    expect(lead?.id).toBe('video:fresh')
    const ordered = ensureLeadVideo(
      [
        { id: 'listing:L', kind: 'listing', createdAt: '2026-09-01T00:00:00.000Z' },
        {
          id: 'video:fresh',
          kind: 'video',
          entityId: 'fresh',
          createdAt: '2026-09-01T00:00:00.000Z',
        },
      ],
      { now: Date.parse('2026-09-02T00:00:00.000Z') },
    )
    expect(ordered[0].kind).toBe('video')
    expect(ordered.map((item) => item.id)).toEqual(['video:fresh', 'listing:L'])
  })

  it('varie la vidéo d’ouverture selon le sel et l’historique', () => {
    const videos = [
      {
        id: 'video:a',
        kind: 'video',
        entityId: 'a',
        createdAt: '2026-08-20T00:00:00.000Z',
        stats: { views: 20 },
      },
      {
        id: 'video:b',
        kind: 'video',
        entityId: 'b',
        createdAt: '2026-08-21T00:00:00.000Z',
        stats: { views: 18 },
      },
    ]
    const now = Date.parse('2026-08-28T00:00:00.000Z')
    const ids = ['1', '2', '3', '4', '5', '6', '7', '8'].map(
      (suggestionSalt) => pickLeadVideo(videos, { suggestionSalt, now })?.id,
    )
    expect(new Set(ids).size).toBeGreaterThan(1)
    expect(pickLeadVideo(videos, { now, watchedVideoIds: ['b'] })?.id).toBe('video:a')
  })
})
