import { resolveReviewOwnerLink } from '@moxt/shared/utils/notificationUtils.js'

const REPORT_TYPE_ALIASES = {
  annonce: 'listing',
  emploi: 'job',
  evenement: 'event',
  abonne: 'subscriber',
  listing: 'listing',
  job: 'job',
  event: 'event',
  subscriber: 'subscriber',
}

export function normalizeAdminKind(kind) {
  if (kind === 'reports') return 'report'
  if (kind === 'contestedReview') return 'review'
  return kind
}

export function normalizeReportType(type) {
  if (!type) return 'listing'
  return REPORT_TYPE_ALIASES[type] || type
}

export function reportTargetLink(item) {
  if (!item) return null
  const relatedId =
    item.relatedId ||
    item.listingId ||
    item.jobId ||
    item.eventId ||
    item.subscriberId
  if (!relatedId) return null

  switch (normalizeReportType(item.reportType)) {
    case 'listing':
      return `/marketplace/${relatedId}`
    case 'job':
      return `/jobs/${relatedId}`
    case 'event':
      return `/events/${relatedId}`
    case 'subscriber':
      return `/users/${relatedId}/publications`
    default:
      return null
  }
}

export function disputeTargetLink(dispute) {
  if (!dispute?.relatedId) return '/disputes'
  switch (dispute.relatedType) {
    case 'transfer':
      return `/transfers/${dispute.relatedId}`
    case 'p2p_order':
      return `/p2p/orders/${dispute.relatedId}`
    case 'parcel':
      return `/parcels/${dispute.relatedId}`
    case 'listing':
      return `/marketplace/${dispute.relatedId}`
    default:
      return '/disputes'
  }
}

export function adminDetailLink(kind, item) {
  if (!item) return null
  const k = normalizeAdminKind(kind)

  switch (k) {
    case 'transfer':
      return `/transfers/${item.id}`
    case 'p2p_offer':
      return '/p2p'
    case 'p2p_order':
      return `/p2p/orders/${item.id}`
    case 'businesses':
    case 'business':
      return `/businesses/${item.id}`
    case 'listings':
    case 'listing':
      return `/marketplace/${item.id}`
    case 'jobs':
    case 'job':
      return `/jobs/${item.id}`
    case 'events':
    case 'event':
      return `/events/${item.id}`
    case 'parcels':
    case 'parcel':
      return `/parcels/${item.id}`
    case 'posts':
    case 'post':
      return '/news'
    case 'report':
      return reportTargetLink(item)
    case 'user':
      return item.id ? `/users/${item.id}/publications` : null
    case 'verification':
      return item.userId ? `/users/${item.userId}/publications` : null
    case 'businessDocument':
      return item.businessId ? `/businesses/${item.businessId}` : null
    case 'dispute':
      return disputeTargetLink(item)
    case 'review':
      return resolveReviewOwnerLink(item)
    case 'support':
      return '/support'
    default:
      return null
  }
}
