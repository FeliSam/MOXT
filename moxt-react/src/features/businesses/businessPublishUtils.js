export const BUSINESS_VISIBLE_STATUSES = ['verified', 'approved', 'active']

export function isBusinessPublishReady(business) {
  return Boolean(business && BUSINESS_VISIBLE_STATUSES.includes(business.status))
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

export function resolveBusinessPublishContext({ business, publishAsBusiness }) {
  if (!publishAsBusiness) {
    return { businessId: null, useBusiness: false }
  }
  if (!isBusinessPublishReady(business)) {
    return { businessId: null, useBusiness: false, blocked: true }
  }
  return { businessId: business.id, useBusiness: true, blocked: false }
}

export function canRepublishBusinessItem(item, businessById) {
  if (!item?.businessId) return true
  return isBusinessPublishReady(businessById.get(item.businessId))
}
