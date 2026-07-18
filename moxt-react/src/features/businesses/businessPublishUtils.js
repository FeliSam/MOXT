export const BUSINESS_VISIBLE_STATUSES = ['verified', 'approved', 'active']

/** Content type → declared business service id (`BUSINESS_SERVICES` / activity modules). */
export const PUBLISH_CONTENT_TYPE_SERVICES = {
  listing: 'Marketplace',
  parcel: 'Colis',
  job: 'Jobs',
  event: 'Events',
  p2p: 'P2P',
}

export function requiredServiceForContentType(contentType) {
  return PUBLISH_CONTENT_TYPE_SERVICES[contentType] || null
}

export function businessDeclaresService(business, serviceId) {
  if (!business || !serviceId) return false
  return Array.isArray(business.services) && business.services.includes(serviceId)
}

export function isBusinessPublishReady(business) {
  return Boolean(business && BUSINESS_VISIBLE_STATUSES.includes(business.status))
}

/** Verified business that declared the module matching this publish content type. */
export function canPublishAsBusinessFor(business, contentType) {
  const serviceId = requiredServiceForContentType(contentType)
  return isBusinessPublishReady(business) && businessDeclaresService(business, serviceId)
}

export function isBusinessDirectoryVisible(business) {
  if (!business || business.deletedByUserAt) return false
  return isBusinessPublishReady(business)
}

export function businessPublishBlockedMessageKey(business) {
  if (!business) return null
  if (isBusinessPublishReady(business)) return null
  if (business.status === 'pending_review') {
    return 'publish.common.business.pendingReview'
  }
  if (business.status === 'rejected' || business.status === 'suspended') {
    return 'publish.common.business.rejected'
  }
  return 'publish.common.business.needsVerification'
}

/** Hint when the business is ready but did not declare this service module. */
export function businessServicePublishBlockedMessageKey(business, contentType) {
  if (!business || !contentType) return null
  if (!isBusinessPublishReady(business)) return null
  const serviceId = requiredServiceForContentType(contentType)
  if (!serviceId || businessDeclaresService(business, serviceId)) return null
  return 'publish.common.business.serviceNotDeclared'
}

/** @deprecated Prefer businessPublishBlockedMessageKey + publishText */
export function businessPublishBlockedMessage(business) {
  const key = businessPublishBlockedMessageKey(business)
  if (!key) return null
  if (key === 'publish.common.business.pendingReview') {
    return 'Votre entreprise est en cours de vérification. Vous pourrez publier au nom de l’entreprise dès validation par MOXT.'
  }
  if (key === 'publish.common.business.rejected') {
    return 'Votre entreprise n’est pas autorisée à publier pour le moment. Contactez le support MOXT.'
  }
  return 'Votre entreprise doit être vérifiée par MOXT avant toute publication au nom de l’entreprise.'
}

export function resolveBusinessPublishContext({ business, publishAsBusiness, contentType }) {
  if (!publishAsBusiness) {
    return { businessId: null, useBusiness: false }
  }
  if (!isBusinessPublishReady(business)) {
    return { businessId: null, useBusiness: false, blocked: true, reason: 'status' }
  }
  if (
    contentType &&
    !businessDeclaresService(business, requiredServiceForContentType(contentType))
  ) {
    return { businessId: null, useBusiness: false, blocked: true, reason: 'service' }
  }
  return { businessId: business.id, useBusiness: true, blocked: false }
}

export function canRepublishBusinessItem(item, businessById) {
  if (!item?.businessId) return true
  return isBusinessPublishReady(businessById.get(item.businessId))
}
