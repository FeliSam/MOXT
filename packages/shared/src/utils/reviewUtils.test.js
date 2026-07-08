import { describe, expect, it } from 'vitest'
import {
  calculateAggregateRating,
  collectPublicationTargetIds,
  filterAggregateReviews,
  REVIEW_TARGET_TYPES,
} from './reviewUtils.js'

describe('reviewUtils', () => {
  it('agrège les avis page + publications', () => {
    const reviews = [
      {
        id: 'r1',
        targetType: REVIEW_TARGET_TYPES.USER_PROFILE,
        targetId: 'u1',
        rating: 5,
        status: 'published',
        createdAt: '2026-01-02T00:00:00.000Z',
      },
      {
        id: 'r2',
        targetType: REVIEW_TARGET_TYPES.LISTING,
        targetId: 'l1',
        rating: 3,
        status: 'published',
        createdAt: '2026-01-01T00:00:00.000Z',
      },
      {
        id: 'r3',
        targetType: REVIEW_TARGET_TYPES.LISTING,
        targetId: 'l9',
        rating: 1,
        status: 'published',
        createdAt: '2026-01-03T00:00:00.000Z',
      },
    ]
    const filtered = filterAggregateReviews(reviews, {
      profileTargetType: REVIEW_TARGET_TYPES.USER_PROFILE,
      profileTargetId: 'u1',
      publicationIds: { listing: ['l1'], parcel: [], job: [], event: [], post: [] },
    })
    expect(filtered).toHaveLength(2)
    expect(calculateAggregateRating(filtered).average).toBe(4)
    expect(calculateAggregateRating(filtered).count).toBe(2)
  })

  it('collecte les ids de publications', () => {
    const ids = collectPublicationTargetIds({
      listings: [{ id: 'l1' }],
      parcels: [{ id: 'p1' }],
      jobs: [],
      events: [],
      posts: [],
    })
    expect(ids.listing).toEqual(['l1'])
    expect(ids.parcel).toEqual(['p1'])
  })
})
