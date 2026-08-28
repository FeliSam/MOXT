import { describe, expect, it } from 'vitest'
import {
  buildUnifiedFeedItems,
  feedItemKey,
  feedOrderSignature,
  feedPath,
  isLinkedCatalogPost,
  linkedPostToFeedItemId,
  liveFeedSocialStats,
  normalizeListingFeedItem,
  normalizePostFeedItem,
  normalizeVideoFeedItem,
  parseFeedItemParam,
  pickInitialFeedIndex,
  preserveFeedOrder,
  resolveFeedDesktopRedirect,
  resolveFeedItemParam,
} from './feedItemUtils.js'

describe('feedItemUtils', () => {
  it('redirige le fil vers le dashboard ou la fiche sur grand écran', () => {
    expect(resolveFeedDesktopRedirect({ typeFilter: 'all' })).toBe('/dashboard')
    expect(resolveFeedDesktopRedirect({ typeFilter: 'listing' })).toBe('/marketplace')
    const listing = normalizeListingFeedItem(
      {
        id: 'LST-1',
        status: 'active',
        title: 'Phone',
        price: 100,
        currency: 'RUB',
        images: [],
      },
      {},
    )
    expect(
      resolveFeedDesktopRedirect({
        typeFilter: 'all',
        itemParam: 'listing:LST-1',
        state: { marketplace: { items: [{ id: 'LST-1', status: 'active', title: 'Phone', price: 100, currency: 'RUB', images: [] }] } },
      }),
    ).toBe('/marketplace/LST-1')
    expect(listing.href).toBe('/marketplace/LST-1')
  })

  it('parse et construit les clés feed', () => {
    expect(feedItemKey('video', 'VID-1')).toBe('video:VID-1')
    expect(parseFeedItemParam('listing:LST-9')).toEqual({
      kind: 'listing',
      entityId: 'LST-9',
      id: 'listing:LST-9',
    })
    expect(parseFeedItemParam('bad')).toBeNull()
    expect(feedPath({ type: 'video', item: 'video:VID-1' })).toBe(
      '/feed?type=video&item=video%3AVID-1',
    )
  })

  it('normalise une vidéo active', () => {
    const item = normalizeVideoFeedItem(
      {
        id: 'VID-1',
        status: 'active',
        title: 'Hello',
        businessId: 'BIZ-1',
        businessName: 'Shop',
        videoUrl: 'https://cdn/x.mp4',
        createdAt: '2026-08-01T00:00:00.000Z',
        likes: ['u1'],
        comments: [],
        viewCount: 3,
      },
      {
        businesses: {
          items: [{ id: 'BIZ-1', name: 'Shop', logoUrl: 'https://cdn/logo.png', ownerId: 'u1' }],
        },
      },
    )
    expect(item?.id).toBe('video:VID-1')
    expect(item?.publisher.name).toBe('Shop')
    expect(item?.stats.likes).toBe(1)
  })

  it('ignore une annonce inactive', () => {
    expect(
      normalizeListingFeedItem({
        id: 'LST-1',
        status: 'archived',
        title: 'Old',
        images: ['https://cdn/a.jpg'],
      }),
    ).toBeNull()
  })

  it('ignore les posts liés marketplace/jobs et pointe vers la fiche initiale', () => {
    const linked = {
      id: 'POST-1',
      status: 'published',
      sourceType: 'listing',
      sourceId: 'LST-9',
      message: 'Ma annonce',
      authorId: 'u1',
    }
    expect(isLinkedCatalogPost(linked)).toBe(true)
    expect(normalizePostFeedItem(linked)).toBeNull()
    expect(linkedPostToFeedItemId(linked)).toBe('listing:LST-9')
    expect(
      resolveFeedItemParam('post:POST-1', {
        posts: { items: [linked] },
      }),
    ).toBe('listing:LST-9')
  })

  it('conserve les posts libres', () => {
    const free = {
      id: 'POST-2',
      status: 'published',
      sourceType: 'free',
      message: 'Hello',
      authorId: 'u1',
      likes: [],
      comments: [],
    }
    expect(normalizePostFeedItem(free)?.id).toBe('post:POST-2')
  })

  it('agrège likes/commentaires des posts liés sur la fiche catalogue', () => {
    const item = normalizeListingFeedItem(
      {
        id: 'LST-1',
        status: 'active',
        title: 'Annonce',
        images: ['https://cdn/a.jpg'],
        ownerId: 'u1',
        createdAt: '2026-08-03T00:00:00.000Z',
      },
      {
        posts: {
          items: [
            {
              id: 'POST-L',
              status: 'published',
              sourceType: 'listing',
              sourceId: 'LST-1',
              message: 'partage',
              likes: ['u2', 'u3'],
              comments: [
                { id: 'c1', text: 'ok', authorId: 'u2' },
                { id: 'c2', text: 'top', authorId: 'u3' },
              ],
            },
            {
              id: 'POST-L2',
              status: 'published',
              sourceType: 'marketplace',
              sourceId: 'LST-1',
              message: 'autre partage',
              likes: ['u3', 'u4'],
              comments: [{ id: 'c3', text: 'nice', authorId: 'u4' }],
            },
          ],
        },
      },
    )
    // u2,u3,u4 dédupliqués
    expect(item?.stats.likes).toBe(3)
    expect(item?.stats.comments).toBe(3)
  })

  it('agrège aussi les interactions vidéo natives + posts liés', () => {
    const item = normalizeVideoFeedItem(
      {
        id: 'VID-1',
        status: 'active',
        title: 'Hello',
        businessId: 'BIZ-1',
        likes: ['u1', 'u2'],
        comments: [{ id: 'vc1', text: 'from video' }],
        viewCount: 3,
      },
      {
        businesses: { items: [{ id: 'BIZ-1', name: 'Shop' }] },
        posts: {
          items: [
            {
              id: 'POST-V',
              status: 'published',
              sourceType: 'video',
              sourceId: 'VID-1',
              likes: ['u2', 'u5'],
              comments: [{ id: 'pc1', text: 'from news' }],
            },
          ],
        },
      },
    )
    expect(item?.stats.likes).toBe(3)
    expect(item?.stats.comments).toBe(2)
  })

  it('fusionne et trie le fil sans doubler les posts liés', () => {
    const items = buildUnifiedFeedItems({
      videos: {
        items: [
          {
            id: 'VID-1',
            status: 'active',
            title: 'V',
            createdAt: '2026-08-02T00:00:00.000Z',
            likes: [],
            comments: [],
          },
        ],
      },
      marketplace: {
        items: [
          {
            id: 'LST-1',
            status: 'active',
            title: 'A',
            images: ['https://cdn/a.jpg'],
            createdAt: '2026-08-03T00:00:00.000Z',
            ownerId: 'u1',
          },
        ],
      },
      parcels: { items: [] },
      jobs: { items: [] },
      events: { items: [] },
      posts: {
        items: [
          {
            id: 'POST-L',
            status: 'published',
            sourceType: 'listing',
            sourceId: 'LST-1',
            message: 'dup',
            createdAt: '2026-08-04T00:00:00.000Z',
          },
        ],
      },
      businesses: { items: [] },
    })
    expect(items.map((item) => item.id)).toEqual(['listing:LST-1', 'video:VID-1'])
  })

  it('filtre par type', () => {
    const items = buildUnifiedFeedItems(
      {
        videos: {
          items: [
            {
              id: 'VID-1',
              status: 'active',
              title: 'V',
              createdAt: '2026-08-02T00:00:00.000Z',
              likes: [],
              comments: [],
            },
          ],
        },
        marketplace: {
          items: [
            {
              id: 'LST-1',
              status: 'active',
              title: 'A',
              images: ['https://cdn/a.jpg'],
              createdAt: '2026-08-03T00:00:00.000Z',
            },
          ],
        },
        parcels: { items: [] },
        jobs: { items: [] },
        events: { items: [] },
        posts: { items: [] },
        businesses: { items: [] },
      },
      { typeFilter: 'video' },
    )
    expect(items).toHaveLength(1)
    expect(items[0].kind).toBe('video')
  })

  it('pickInitialFeedIndex', () => {
    const items = [{ id: 'video:a' }, { id: 'listing:b' }]
    expect(pickInitialFeedIndex(items, 'listing:b')).toBe(1)
    expect(pickInitialFeedIndex(items, 'missing:x')).toBe(0)
  })

  it('preserveFeedOrder garde l’ordre quand seul le score change', () => {
    const reordered = [
      { id: 'video:b', isFeatured: false, stats: { views: 3 } },
      { id: 'video:a', isFeatured: false, stats: { views: 2 } },
    ]
    const signature = feedOrderSignature(reordered)
    const first = preserveFeedOrder({ signature: '', items: [] }, reordered, signature)
    const second = preserveFeedOrder(first, reordered, signature)
    expect(second.items.map((item) => item.id)).toEqual(['video:b', 'video:a'])
    const updated = [
      { id: 'video:b', isFeatured: false, stats: { views: 99 } },
      { id: 'video:a', isFeatured: false, stats: { views: 50 } },
    ]
    const third = preserveFeedOrder(second, updated, signature)
    expect(third.items.map((item) => item.id)).toEqual(['video:b', 'video:a'])
    expect(third.items[0].stats.views).toBe(99)
  })

  it('liveFeedSocialStats isole likes et commentaires par publication', () => {
    const state = {
      marketplace: {
        items: [
          {
            id: 'LST-A',
            status: 'active',
            favorites: ['u-me', 'u-other'],
            comments: [{ id: 'c-a', text: 'sur A' }],
          },
          {
            id: 'LST-B',
            status: 'active',
            favorites: ['u-other'],
            comments: [{ id: 'c-b', text: 'sur B' }],
          },
        ],
      },
      posts: {
        items: [
          {
            id: 'POST-A',
            status: 'published',
            sourceType: 'marketplace',
            sourceId: 'LST-A',
            likes: ['u-linked'],
            comments: [{ id: 'c-post-a', text: 'commentaire lié A' }],
          },
          {
            id: 'POST-B',
            status: 'published',
            sourceType: 'marketplace',
            sourceId: 'LST-B',
            likes: ['u-stray'],
            comments: [{ id: 'c-post-b', text: 'commentaire lié B' }],
          },
        ],
      },
    }

    const a = liveFeedSocialStats(state, 'listing', 'LST-A', 'u-me')
    const b = liveFeedSocialStats(state, 'listing', 'LST-B', 'u-me')

    expect(a.liked).toBe(true)
    expect(b.liked).toBe(false)
    expect(a.likeCount).toBe(3)
    expect(b.likeCount).toBe(2)
    expect(a.commentCount).toBe(2)
    expect(b.commentCount).toBe(2)
  })
})
