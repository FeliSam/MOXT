import { createSelector } from '@reduxjs/toolkit'
import {
  collectPublicationTargetIds,
  filterAggregateReviews,
  calculateAggregateRating,
  REVIEW_TARGET_TYPES,
} from '@moxt/shared/utils/reviewUtils.js'
import { selectBusinessContent } from '../businesses/businessSelectors'

export function selectProfileReview(state, authorId, targetType, targetId) {
  if (!authorId || !targetId) return null
  return (
    state.reviews.items.find(
      (item) =>
        item.authorId === authorId &&
        item.targetType === targetType &&
        item.targetId === targetId,
    ) || null
  )
}

export function selectAggregateUserReviews(state, userId, publications) {
  const publicationIds = collectPublicationTargetIds(publications)
  return filterAggregateReviews(state.reviews.items, {
    profileTargetType: REVIEW_TARGET_TYPES.USER_PROFILE,
    profileTargetId: userId,
    publicationIds,
  })
}

export function selectAggregateBusinessReviews(state, business, content) {
  const publicationIds = collectPublicationTargetIds({
    listings: content?.listings || [],
    parcels: content?.parcels || [],
    jobs: content?.jobs || [],
    events: content?.events || [],
    posts: [],
  })
  return filterAggregateReviews(state.reviews.items, {
    profileTargetType: REVIEW_TARGET_TYPES.BUSINESS,
    profileTargetId: business?.id,
    publicationIds,
  })
}

export const selectBusinessReviewsBundle = createSelector(
  [
    (state) => state.reviews.items,
    (_, business) => business,
    (state, business) => (business ? selectBusinessContent(state, business) : null),
  ],
  (items, business, content) => {
    if (!business) return { reviews: [], rating: { average: 0, count: 0, breakdown: [0, 0, 0, 0, 0] } }
    const reviews = filterAggregateReviews(items, {
      profileTargetType: REVIEW_TARGET_TYPES.BUSINESS,
      profileTargetId: business.id,
      publicationIds: collectPublicationTargetIds({
        listings: content?.listings || [],
        parcels: content?.parcels || [],
        jobs: content?.jobs || [],
        events: content?.events || [],
        posts: [],
      }),
    })
    return { reviews, rating: calculateAggregateRating(reviews) }
  },
)
