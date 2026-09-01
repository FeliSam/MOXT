import { describe, expect, it } from 'vitest'
import {
  buildBoostLookup,
  entityTypeToFeedKind,
  feedItemIdFromBoost,
  sortFeedItemsWithBoosts,
} from './feedBoostUtils.js'
import { feedItemKey } from './feedItemUtils.js'

describe('feedBoostUtils', () => {
  it('mappe entity_type vers kind feed', () => {
    expect(entityTypeToFeedKind('marketplace')).toBe('listing')
    expect(entityTypeToFeedKind('video')).toBe('video')
  })

  it('construit la lookup des boosts actifs', () => {
    const map = buildBoostLookup([
      {
        entity_type: 'marketplace',
        entity_id: 'ANN-1',
        status: 'active',
        expires_at: '2099-01-01T00:00:00.000Z',
        formula_key: 'featured_24h',
      },
    ])
    expect(map.get(feedItemKey('listing', 'ANN-1'))?.formula_key).toBe('featured_24h')
    expect(feedItemIdFromBoost({ entity_type: 'jobs', entity_id: 'J-1' })).toBe('job:J-1')
  })

  it('intercale les vedettes sans noyer le fil organique', () => {
    const items = [
      { id: 'listing:A', createdAt: '2026-08-03T00:00:00.000Z' },
      { id: 'listing:B', createdAt: '2026-08-02T00:00:00.000Z', isFeatured: true },
      { id: 'listing:C', createdAt: '2026-08-01T00:00:00.000Z' },
      { id: 'listing:D', createdAt: '2026-07-31T00:00:00.000Z' },
      { id: 'listing:E', createdAt: '2026-07-30T00:00:00.000Z' },
    ]
    const boostLookup = new Map([
      [
        'listing:B',
        { entity_type: 'marketplace', entity_id: 'B', formula_key: 'featured_24h', expires_at: '2099-01-01T00:00:00.000Z' },
      ],
    ])
    const sorted = sortFeedItemsWithBoosts(items, boostLookup)
    expect(sorted[0].id).toBe('listing:B')
    expect(sorted[0].isFeatured).toBe(true)
  })

  it('accepte un tableau de boosts à la place d’une Map', () => {
    const items = [{ id: 'video:V1', createdAt: '2026-08-01T00:00:00.000Z' }]
    const sorted = sortFeedItemsWithBoosts(items, [
      {
        entity_type: 'video',
        entity_id: 'V1',
        status: 'active',
        expires_at: '2099-01-01T00:00:00.000Z',
        formula_key: 'featured_24h',
      },
    ])
    expect(sorted[0].isFeatured).toBe(true)
  })
})
