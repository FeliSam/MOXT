import { describe, expect, it } from 'vitest'
import { sortFeedItemsWithBoosts } from './feedBoostUtils.js'
import { buildUnifiedFeedItems, preserveFeedOrder } from './feedItemUtils.js'
import { buildListingAffinity } from '../marketplace/marketplaceFeed.js'
import { readSearchParam } from './feedCollectionUtils.js'

const baseState = {
  videos: {
    items: [
      {
        id: 'V1',
        status: 'active',
        videoUrl: 'https://example.com/v.mp4',
        viewCount: 1,
        likes: [],
        comments: [],
      },
    ],
  },
  marketplace: { items: [] },
  posts: { items: [] },
  parcels: { items: [] },
  jobs: { items: [] },
  events: { items: [] },
  p2p: { offers: [] },
  businesses: { items: [] },
  account: { favorites: [], viewedListings: [], subscriptions: [] },
}

describe('feed corruption resilience', () => {
  it('buildUnifiedFeedItems ne plante pas avec des boosts corrompus', () => {
    const corrupt = [null, undefined, {}, { 'video:V1': { entity_type: 'video', entity_id: 'V1' } }, new Set(['a']), []]
    for (const boosts of corrupt) {
      expect(() =>
        buildUnifiedFeedItems(baseState, { typeFilter: 'video', boosts, user: { id: 'u1' } }),
      ).not.toThrow()
    }
  })

  it('sortFeedItemsWithBoosts accepte lookup corrompue', () => {
    const items = [{ id: 'video:V1', createdAt: '2026-01-01' }]
    const corrupt = [null, undefined, {}, new Set(), { get: undefined }]
    for (const lookup of corrupt) {
      expect(() => sortFeedItemsWithBoosts(items, lookup)).not.toThrow()
    }
  })

  it('readSearchParam sans .get ne plante pas', () => {
    expect(readSearchParam(null, 'type', 'all')).toBe('all')
    expect(readSearchParam({}, 'type', 'all')).toBe('all')
    expect(readSearchParam({ get: undefined }, 'type', 'all')).toBe('all')
  })

  it('buildListingAffinity avec listingsById corrompu', () => {
    expect(() =>
      buildListingAffinity({
        listingsById: {},
        favorites: [{ relatedType: 'listing', relatedId: 'l1', userId: 'u1' }],
        userId: 'u1',
      }),
    ).not.toThrow()
  })

  it('preserveFeedOrder avec items valides', () => {
    const items = [{ id: 'video:V1' }, { id: 'video:V2' }]
    const prev = { signature: 'old', items: [{ id: 'video:V1' }] }
    expect(() => preserveFeedOrder(prev, items, 'new')).not.toThrow()
  })
})
