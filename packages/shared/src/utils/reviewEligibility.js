import { REVIEW_TARGET_TYPES } from './reviewUtils.js'
import { resolveReviewOwnerId } from './notificationUtils.js'

function hasSharedConversation(state, authorId, otherUserId) {
  return (state.communications?.conversations || []).some(
    (conversation) =>
      conversation.participantIds?.includes(authorId) &&
      conversation.participantIds?.includes(otherUserId),
  )
}

function hasCompletedTransferBetween(state, authorId, otherUserId) {
  return (state.transfers?.items || []).some(
    (transfer) =>
      transfer.status === 'completed' &&
      ((transfer.userId === authorId && transfer.businessOwnerId === otherUserId) ||
        (transfer.userId === otherUserId && transfer.businessOwnerId === authorId)),
  )
}

function hasCompletedP2PBetween(state, authorId, otherUserId) {
  return (state.p2p?.orders || []).some(
    (order) =>
      order.status === 'completed' &&
      ((order.buyerId === authorId && order.sellerId === otherUserId) ||
        (order.sellerId === authorId && order.buyerId === otherUserId)),
  )
}

export function hasUserProfileReviewEligibility(state, authorId, profileUserId) {
  if (!authorId || !profileUserId || authorId === profileUserId) return false

  if (hasCompletedTransferBetween(state, authorId, profileUserId)) return true
  if (hasCompletedP2PBetween(state, authorId, profileUserId)) return true
  if (hasSharedConversation(state, authorId, profileUserId)) return true

  const jobs = state.jobs?.items || []
  if (
    (state.jobs?.applications || []).some(
      (application) =>
        application.userId === authorId &&
        jobs.find((job) => job.id === application.jobId)?.ownerId === profileUserId,
    )
  ) {
    return true
  }

  const events = state.events?.items || []
  if (
    (state.events?.registrations || []).some(
      (registration) =>
        registration.userId === authorId &&
        events.find((event) => event.id === registration.eventId)?.ownerId === profileUserId,
    )
  ) {
    return true
  }

  if (
    (state.parcels?.requests || []).some(
      (request) =>
        request.userId === authorId &&
        request.ownerId === profileUserId &&
        ['approved', 'completed'].includes(request.status),
    )
  ) {
    return true
  }

  return false
}

/** @returns {{ allowed: boolean, reasonKey?: string }} */
export function hasReviewEligibility(state, authorId, targetType, targetId) {
  if (!authorId || !targetType || !targetId) {
    return { allowed: false, reasonKey: 'reviews.reasons.loginRequired' }
  }

  const ownerId = resolveReviewOwnerId(state, { targetType, targetId })
  if (authorId === ownerId) {
    return { allowed: false, reasonKey: 'reviews.reasons.ownContent' }
  }

  const needsOwner =
    targetType === REVIEW_TARGET_TYPES.USER_PROFILE ||
    targetType === REVIEW_TARGET_TYPES.BUSINESS
  if (needsOwner && !ownerId) {
    return { allowed: false, reasonKey: 'reviews.reasons.targetMissing' }
  }

  if (targetType === REVIEW_TARGET_TYPES.USER_PROFILE) {
    return hasUserProfileReviewEligibility(state, authorId, targetId)
      ? { allowed: true }
      : { allowed: false, reasonKey: 'reviews.reasons.profileInteractionRequired' }
  }

  if (targetType === REVIEW_TARGET_TYPES.BUSINESS) {
    const business = state.businesses?.items?.find((item) => item.id === targetId)
    const eligible =
      hasCompletedTransferBetween(state, authorId, business?.ownerId) ||
      hasUserProfileReviewEligibility(state, authorId, business?.ownerId)
    return eligible
      ? { allowed: true }
      : { allowed: false, reasonKey: 'reviews.reasons.businessClientOnly' }
  }

  if (targetType === REVIEW_TARGET_TYPES.LISTING) {
    const listing = state.marketplace?.items?.find((item) => item.id === targetId)
    const asked = listing?.questions?.some((question) => question.authorId === authorId)
    const messaged = (state.communications?.conversations || []).some(
      (conversation) =>
        conversation.relatedType === 'listing' &&
        conversation.relatedId === targetId &&
        conversation.participantIds?.includes(authorId),
    )
    return asked || messaged
      ? { allowed: true }
      : { allowed: false, reasonKey: 'reviews.reasons.listingContactRequired' }
  }

  if (targetType === REVIEW_TARGET_TYPES.JOB) {
    const eligible = (state.jobs?.applications || []).some(
      (application) => application.jobId === targetId && application.userId === authorId,
    )
    return eligible
      ? { allowed: true }
      : { allowed: false, reasonKey: 'reviews.reasons.jobApplicantOnly' }
  }

  if (targetType === REVIEW_TARGET_TYPES.EVENT) {
    const eligible = (state.events?.registrations || []).some(
      (registration) => registration.eventId === targetId && registration.userId === authorId,
    )
    return eligible
      ? { allowed: true }
      : { allowed: false, reasonKey: 'reviews.reasons.eventRegisterRequired' }
  }

  if (targetType === REVIEW_TARGET_TYPES.PARCEL) {
    const parcel = state.parcels?.items?.find((item) => item.id === targetId)
    const reserved = parcel?.reservations?.some((reservation) => reservation.userId === authorId)
    const requested = (state.parcels?.requests || []).some(
      (request) =>
        request.parcelId === targetId &&
        request.userId === authorId &&
        ['approved', 'completed'].includes(request.status),
    )
    return reserved || requested
      ? { allowed: true }
      : { allowed: false, reasonKey: 'reviews.reasons.parcelReserveRequired' }
  }

  if (targetType === REVIEW_TARGET_TYPES.POST) {
    const post = state.posts?.items?.find((item) => item.id === targetId)
    const interacted =
      post?.likes?.includes(authorId) ||
      post?.comments?.some((comment) => comment.authorId === authorId)
    return interacted
      ? { allowed: true }
      : { allowed: false, reasonKey: 'reviews.reasons.postInteractRequired' }
  }

  return { allowed: false, reasonKey: 'reviews.reasons.notAllowed' }
}
