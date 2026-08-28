import { describe, expect, it } from 'vitest'
import {
  buildListingAffinity,
  buildMarketplaceDiscovery,
  diversifyMarketplaceFeed,
  hasListingPersonalization,
  scoreMarketplaceListing,
} from './marketplaceFeed'
import { marketplaceBoostLookup } from './marketplaceListingBoost.js'

const now = Date.parse('2026-08-28T12:00:00.000Z')

function listing(partial) {
  return {
    id: 'ANN-1',
    type: 'product',
    category: 'fashion',
    city: 'Moscou',
    createdAt: '2026-08-27T12:00:00.000Z',
    images: ['a.jpg'],
    views: 0,
    favorites: [],
    contactCount: 0,
    ...partial,
  }
}

describe('marketplaceFeed', () => {
  it('classe l’engagement et l’affinité au-dessus d’une simple date', () => {
    const olderPopular = listing({
      id: 'old',
      createdAt: '2026-08-20T12:00:00.000Z',
      views: 80,
      favorites: ['u2', 'u3', 'u4'],
      contactCount: 4,
      category: 'beauty',
    })
    const newerQuiet = listing({
      id: 'new',
      createdAt: '2026-08-28T08:00:00.000Z',
      views: 0,
      category: 'electronics',
    })
    const affinity = buildListingAffinity({
      listingsById: new Map([
        ['fav', listing({ id: 'fav', category: 'beauty', type: 'product' })],
      ]),
      favorites: [{ userId: 'me', relatedType: 'listing', relatedId: 'fav' }],
      viewedListings: [],
      userId: 'me',
    })
    const popularScore = scoreMarketplaceListing(olderPopular, { now, affinity, userId: 'me' })
    const quietScore = scoreMarketplaceListing(newerQuiet, { now, affinity, userId: 'me' })
    expect(popularScore).toBeGreaterThan(quietScore)
  })

  it('évite une rafale de la même catégorie dans le fil', () => {
    const scored = [
      listing({ id: 'a', category: 'beauty' }),
      listing({ id: 'b', category: 'beauty' }),
      listing({ id: 'c', category: 'electronics' }),
    ].map((item, index) => ({ listing: item, score: 10 - index }))
    const mixed = diversifyMarketplaceFeed(scored)
    expect(mixed.map((item) => item.id)).toEqual(['a', 'c', 'b'])
  })

  it('construit des rails distincts sans doublons dans Découvrir', () => {
    const listings = Array.from({ length: 8 }, (_, index) =>
      listing({
        id: `ANN-${index}`,
        category: index % 2 ? 'beauty' : 'electronics',
        views: index === 3 ? 40 : index,
        createdAt: new Date(now - index * 3600_000).toISOString(),
      }),
    )
    const feed = buildMarketplaceDiscovery(listings, {
      now,
      showRails: true,
      searching: false,
      railSize: 3,
    })
    expect(feed.forYou).toHaveLength(2)
    expect(feed.trending.length).toBeGreaterThan(0)
    expect(feed.fresh[0].id).toBe('ANN-0')
    const railIds = new Set([
      ...feed.forYou.map((item) => item.id),
      ...feed.trending.map((item) => item.id),
      ...feed.fresh.map((item) => item.id),
    ])
    expect(feed.discover.every((item) => !railIds.has(item.id))).toBe(true)
    expect(feed.discover.length).toBe(listings.length - railIds.size)
  })

  it('masque les rails pendant une recherche', () => {
    const listings = Array.from({ length: 8 }, (_, index) => listing({ id: `ANN-${index}` }))
    const feed = buildMarketplaceDiscovery(listings, { now, showRails: true, searching: true })
    expect(feed.forYou).toEqual([])
    expect(feed.discover).toHaveLength(8)
  })

  it('détecte la personnalisation utilisateur', () => {
    expect(
      hasListingPersonalization({
        userId: 'u1',
        favorites: [{ userId: 'u1', relatedType: 'listing', relatedId: 'a' }],
        viewedListings: [{ userId: 'u1', listingId: 'b' }],
      }),
    ).toBe(true)
    expect(
      hasListingPersonalization({
        userId: 'u1',
        favorites: [],
        viewedListings: [],
      }),
    ).toBe(false)
  })

  it('booste le score des annonces Stars actives', () => {
    const item = listing({ id: 'boosted' })
    const boosts = [
      {
        entity_type: 'marketplace',
        entity_id: 'boosted',
        status: 'active',
        formula_key: 'featured_24h',
        expires_at: new Date(now + 3600_000).toISOString(),
      },
    ]
    const lookup = marketplaceBoostLookup(boosts, now)
    const plain = scoreMarketplaceListing(item, { now, boostLookup: new Map() })
    const boosted = scoreMarketplaceListing(item, { now, boostLookup: lookup })
    expect(boosted).toBeGreaterThan(plain)
  })
})
