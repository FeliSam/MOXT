import { describe, expect, it } from 'vitest'
import {
  calculateAggregateRating,
  collectPublicationTargetIds,
  dropStaleCachedReviews,
  filterAggregateReviews,
  isReviewVisible,
  REVIEW_DISPUTE_STATUS,
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

  it('inclut les avis profil du propriétaire sur une fiche entreprise', () => {
    const reviews = [
      {
        id: 'r-biz',
        targetType: REVIEW_TARGET_TYPES.BUSINESS,
        targetId: 'b1',
        rating: 5,
        status: 'published',
        createdAt: '2026-01-02T00:00:00.000Z',
      },
      {
        id: 'r-owner',
        targetType: REVIEW_TARGET_TYPES.USER_PROFILE,
        targetId: 'u-owner',
        rating: 4,
        status: 'published',
        createdAt: '2026-01-03T00:00:00.000Z',
      },
      {
        id: 'r-other',
        targetType: REVIEW_TARGET_TYPES.USER_PROFILE,
        targetId: 'u-other',
        rating: 1,
        status: 'published',
        createdAt: '2026-01-04T00:00:00.000Z',
      },
    ]
    const filtered = filterAggregateReviews(reviews, {
      profileTargetType: REVIEW_TARGET_TYPES.BUSINESS,
      profileTargetId: 'b1',
      publicationIds: { listing: [], parcel: [], job: [], event: [], post: [] },
      ownerProfileId: 'u-owner',
    })
    expect(filtered.map((item) => item.id)).toEqual(['r-owner', 'r-biz'])
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

  it('exclut les avis masqués, suspendus ou retirés du calcul des étoiles', () => {
    expect(isReviewVisible({ status: 'published' })).toBe(true)
    expect(isReviewVisible({ status: 'published', disputeStatus: REVIEW_DISPUTE_STATUS.PENDING })).toBe(
      true,
    )
    expect(isReviewVisible({ status: 'hidden', disputeStatus: REVIEW_DISPUTE_STATUS.PENDING })).toBe(
      false,
    )
    expect(isReviewVisible({ status: 'published', disputeStatus: REVIEW_DISPUTE_STATUS.UPHELD })).toBe(
      false,
    )
    expect(isReviewVisible({ status: 'suspended' })).toBe(false)
    expect(isReviewVisible({ status: 'published', deletedAt: '2026-08-01T00:00:00.000Z' })).toBe(false)

    const rating = calculateAggregateRating([
      { rating: 5, status: 'published' },
      { rating: 1, status: 'hidden' },
      { rating: 1, status: 'suspended' },
      { rating: 2, status: 'published', disputeStatus: REVIEW_DISPUTE_STATUS.UPHELD },
    ])
    expect(rating).toEqual({ average: 5, count: 1, breakdown: [0, 0, 0, 0, 1] })
  })

  it('retire du cache local les avis récents absents du back', () => {
    const local = [
      { id: 'kept-old', createdAt: '2026-01-01T00:00:00.000Z' },
      { id: 'stale', createdAt: '2026-08-20T00:00:00.000Z' },
      { id: 'still-there', createdAt: '2026-08-21T00:00:00.000Z' },
    ]
    const remote = [
      { id: 'still-there', createdAt: '2026-08-21T00:00:00.000Z' },
      { id: 'newer', createdAt: '2026-08-10T00:00:00.000Z' },
    ]
    expect(dropStaleCachedReviews(local, remote).map((item) => item.id)).toEqual([
      'kept-old',
      'still-there',
    ])
  })
})
