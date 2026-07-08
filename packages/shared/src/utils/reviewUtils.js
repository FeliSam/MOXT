export const REVIEW_TARGET_TYPES = {
  USER_PROFILE: 'user_profile',
  BUSINESS: 'business',
  LISTING: 'listing',
  PARCEL: 'parcel',
  JOB: 'job',
  EVENT: 'event',
  POST: 'post',
}

export const PUBLICATION_REVIEW_TARGET_TYPES = [
  REVIEW_TARGET_TYPES.LISTING,
  REVIEW_TARGET_TYPES.PARCEL,
  REVIEW_TARGET_TYPES.JOB,
  REVIEW_TARGET_TYPES.EVENT,
  REVIEW_TARGET_TYPES.POST,
]

export const REVIEW_DISPUTE_STATUS = {
  NONE: 'none',
  PENDING: 'pending',
  UPHELD: 'upheld',
  REJECTED: 'rejected',
}

export const REVIEW_DISPUTE_LABELS = {
  none: '',
  pending: 'En contestation',
  upheld: 'Avis retiré',
  rejected: 'Contestation refusée',
}

export const REVIEW_SOURCE_LABELS = {
  user_profile: 'Page publications',
  business: 'Page entreprise',
  listing: 'Annonce',
  parcel: 'Colis',
  job: 'Job',
  event: 'Événement',
  post: 'Publication',
}

export function collectPublicationTargetIds(publications = {}) {
  return {
    listing: (publications.listings || []).map((item) => item.id),
    parcel: (publications.parcels || []).map((item) => item.id),
    job: (publications.jobs || []).map((item) => item.id),
    event: (publications.events || []).map((item) => item.id),
    post: (publications.posts || []).map((item) => item.id),
  }
}

export function isReviewVisible(review) {
  if (!review) return false
  if (review.status === 'published') return true
  if (review.disputeStatus === REVIEW_DISPUTE_STATUS.PENDING) return true
  return false
}

export function filterAggregateReviews(reviews, { profileTargetType, profileTargetId, publicationIds }) {
  const idsByType = publicationIds || {}
  return (reviews || [])
    .filter(isReviewVisible)
    .filter((review) => {
      if (review.targetType === profileTargetType && review.targetId === profileTargetId) {
        return true
      }
      const bucket = idsByType[review.targetType]
      return Array.isArray(bucket) && bucket.includes(review.targetId)
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}

export function calculateAggregateRating(reviews = []) {
  const visible = reviews.filter(isReviewVisible)
  if (!visible.length) return { average: 0, count: 0, breakdown: [0, 0, 0, 0, 0] }
  const breakdown = [0, 0, 0, 0, 0]
  let total = 0
  for (const review of visible) {
    const rating = Math.min(5, Math.max(1, Number(review.rating) || 0))
    total += rating
    breakdown[rating - 1] += 1
  }
  return {
    average: Number((total / visible.length).toFixed(1)),
    count: visible.length,
    breakdown,
  }
}

export function canLeaveProfileReview({ currentUserId, ownerId }) {
  return Boolean(currentUserId && currentUserId !== ownerId)
}
