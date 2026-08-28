import { describe, expect, it } from 'vitest'
import {
  FEED_DISCOVERY_EVERY,
  buildDiscoveryFeedItem,
  discoveryFeedItemId,
  injectFeedDiscoverySlides,
  listingToDiscoveryCard,
} from './feedDiscoveryUtils.js'
import { feedItemKey } from './feedItemUtils.js'

function sampleListing(id, title) {
  return {
    id,
    status: 'active',
    title,
    images: [`https://cdn/${id}.jpg`],
    price: 1000,
    currency: 'RUB',
    createdAt: '2026-08-01T00:00:00.000Z',
  }
}

function organicItem(id, kind = 'video') {
  return {
    id: feedItemKey(kind, id),
    kind,
    entityId: id,
    title: `Item ${id}`,
    href: `/feed/${id}`,
    publisher: { type: 'user', id: 'u2', name: 'Publisher' },
    media: { poster: 'https://cdn/poster.jpg', images: [] },
  }
}

describe('feedDiscoveryUtils', () => {
  it('mappe une annonce vers une carte découverte', () => {
    expect(listingToDiscoveryCard(sampleListing('L1', 'Phone'))).toMatchObject({
      type: 'listing',
      id: 'L1',
      title: 'Phone',
      href: '/marketplace/L1',
    })
  })

  it('insère une page découverte tous les 5 éléments', () => {
    const items = Array.from({ length: 10 }, (_, index) => organicItem(`v${index + 1}`))
    const feedState = {
      marketplace: {
        items: Array.from({ length: 8 }, (_, index) =>
          sampleListing(`L${index + 1}`, `Listing ${index + 1}`),
        ),
      },
      businesses: { items: [] },
      account: { subscriptions: [], favorites: [], viewedListings: [] },
    }
    const next = injectFeedDiscoverySlides(items, { feedState, rankCtx: {}, user: { id: 'u1' } })
    const discovery = next.filter((row) => row.kind === 'discovery')
    expect(discovery.length).toBe(2)
    expect(next.indexOf(discovery[0])).toBe(FEED_DISCOVERY_EVERY)
    expect(next.indexOf(discovery[1])).toBe(FEED_DISCOVERY_EVERY * 2 + 1)
  })

  it('génère un id stable pour une slide découverte', () => {
    const slide = buildDiscoveryFeedItem('forYou', 0, [
      { type: 'listing', id: 'L1', title: 'A', href: '/marketplace/L1' },
      { type: 'listing', id: 'L2', title: 'B', href: '/marketplace/L2' },
    ])
    expect(slide.id).toBe(discoveryFeedItemId(0, 'forYou'))
    expect(slide.kind).toBe('discovery')
    expect(slide.variant).toBe('forYou')
  })
})
