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

export const INACTIVE_REVIEW_STATUSES = new Set([
  'hidden',
  'suspended',
  'deleted',
  'removed',
  'unpublished',
  'rejected',
])

export function collectPublicationTargetIds(publications = {}) {
  return {
    listing: (publications.listings || []).map((item) => item.id),
    parcel: (publications.parcels || []).map((item) => item.id),
    job: (publications.jobs || []).map((item) => item.id),
    event: (publications.events || []).map((item) => item.id),
    post: (publications.posts || []).map((item) => item.id),
  }
}

/** Avis encore actif pour l'affichage et le calcul des étoiles. */
export function isReviewVisible(review) {
  if (!review) return false
  if (review.deletedAt || review.deleted) return false
  if (review.disputeStatus === REVIEW_DISPUTE_STATUS.UPHELD) return false
  const status = String(review.status || '').toLowerCase()
  if (INACTIVE_REVIEW_STATUSES.has(status)) return false
  return status === 'published'
}

export function matchesReviewAggregateScope(
  review,
  { profileTargetType, profileTargetId, publicationIds, ownerProfileId } = {},
) {
  if (!review) return false
  if (review.targetType === profileTargetType && review.targetId === profileTargetId) {
    return true
  }
  if (
    ownerProfileId &&
    review.targetType === REVIEW_TARGET_TYPES.USER_PROFILE &&
    review.targetId === ownerProfileId
  ) {
    return true
  }
  const bucket = (publicationIds || {})[review.targetType]
  return Array.isArray(bucket) && bucket.includes(review.targetId)
}

export function filterAggregateReviews(reviews, scope) {
  return (reviews || [])
    .filter(isReviewVisible)
    .filter((review) => matchesReviewAggregateScope(review, scope))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}

/**
 * Retire du cache local les avis récents absents du back (supprimés ou
 * masqués : le SELECT RLS ne les renvoie plus, mais le merge local les
 * conservait encore).
 */
export function dropStaleCachedReviews(localItems = [], remoteItems = []) {
  if (!remoteItems.length) return localItems
  const remoteIds = new Set(remoteItems.map((item) => item?.id).filter(Boolean))
  let oldest = Infinity
  for (const item of remoteItems) {
    const time = new Date(item?.createdAt || 0).getTime()
    if (Number.isFinite(time) && time < oldest) oldest = time
  }
  if (!Number.isFinite(oldest)) return localItems
  return (localItems || []).filter((item) => {
    if (!item?.id || remoteIds.has(item.id)) return true
    const time = new Date(item.createdAt || 0).getTime()
    if (!Number.isFinite(time)) return true
    return time < oldest
  })
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
