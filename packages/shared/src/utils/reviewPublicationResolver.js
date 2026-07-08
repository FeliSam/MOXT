import { REVIEW_TARGET_TYPES, REVIEW_SOURCE_LABELS } from './reviewUtils.js'

const PUBLICATION_PATHS = {
  listing: (id) => `/marketplace/${id}`,
  parcel: (id) => `/parcels/${id}`,
  job: (id) => `/jobs/${id}`,
  event: (id) => `/events/${id}`,
  post: (id) => `/news`,
  business: (id) => `/businesses/${id}`,
}

export function formatReviewDate(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatReviewDateShort(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function resolveListingPublication(item) {
  if (!item) return null
  return {
    title: item.title || 'Annonce',
    imageUrl: item.images?.[0] || null,
    path: PUBLICATION_PATHS.listing(item.id),
    typeLabel: REVIEW_SOURCE_LABELS.listing,
  }
}

function resolveParcelPublication(item) {
  if (!item) return null
  return {
    title: `${item.origin || '?'} → ${item.destination || '?'}`,
    imageUrl: null,
    path: PUBLICATION_PATHS.parcel(item.id),
    typeLabel: REVIEW_SOURCE_LABELS.parcel,
  }
}

function resolveJobPublication(item) {
  if (!item) return null
  return {
    title: item.title || 'Offre emploi',
    imageUrl: null,
    path: PUBLICATION_PATHS.job(item.id),
    typeLabel: REVIEW_SOURCE_LABELS.job,
  }
}

function resolveEventPublication(item) {
  if (!item) return null
  return {
    title: item.title || 'Événement',
    imageUrl: item.images?.[0] || item.imageUrl || null,
    path: PUBLICATION_PATHS.event(item.id),
    typeLabel: REVIEW_SOURCE_LABELS.event,
  }
}

function resolvePostPublication(item) {
  if (!item) return null
  return {
    title: item.message?.slice(0, 80) || 'Publication',
    imageUrl: item.imageUrl || item.images?.[0] || null,
    path: PUBLICATION_PATHS.post(item.id),
    typeLabel: REVIEW_SOURCE_LABELS.post,
  }
}

function resolveBusinessPublication(item) {
  if (!item) return null
  return {
    title: item.name || 'Entreprise',
    imageUrl: item.logoUrl || null,
    path: PUBLICATION_PATHS.business(item.id),
    typeLabel: REVIEW_SOURCE_LABELS.business,
  }
}

export function buildReviewPublicationIndex(state) {
  const index = new Map()

  const register = (targetType, targetId, publication) => {
    if (!targetType || !targetId || !publication) return
    index.set(`${targetType}:${targetId}`, publication)
  }

  for (const item of state.marketplace?.items || []) {
    register(REVIEW_TARGET_TYPES.LISTING, item.id, resolveListingPublication(item))
  }
  for (const item of state.parcels?.items || []) {
    register(REVIEW_TARGET_TYPES.PARCEL, item.id, resolveParcelPublication(item))
  }
  for (const item of state.jobs?.items || []) {
    register(REVIEW_TARGET_TYPES.JOB, item.id, resolveJobPublication(item))
  }
  for (const item of state.events?.items || []) {
    register(REVIEW_TARGET_TYPES.EVENT, item.id, resolveEventPublication(item))
  }
  for (const item of state.posts?.items || []) {
    register(REVIEW_TARGET_TYPES.POST, item.id, resolvePostPublication(item))
  }
  for (const item of state.businesses?.items || []) {
    register(REVIEW_TARGET_TYPES.BUSINESS, item.id, resolveBusinessPublication(item))
  }

  return index
}

export function getReviewPublication(index, review) {
  if (!review || review.targetType === REVIEW_TARGET_TYPES.USER_PROFILE) return null
  return index?.get(`${review.targetType}:${review.targetId}`) || null
}

export function isPublicationLinkedReview(review) {
  return Boolean(
    review?.targetType &&
      review.targetType !== REVIEW_TARGET_TYPES.USER_PROFILE &&
      review.targetType !== REVIEW_TARGET_TYPES.BUSINESS,
  )
}
