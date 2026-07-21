import { REVIEW_TARGET_TYPES } from './reviewUtils.js'

export const DEFAULT_NOTIFICATION_PREFERENCES = {
  language: 'fr',
  emailNotifications: true,
  pushNotifications: true,
  activityVisibility: 'private',
  securityAlerts: true,
  twoFactorEnabled: false,
  marketingConsent: false,
  notifMessages: 'high',
  notifTransfers: 'high',
  notifParcels: 'normal',
  notifJobs: 'normal',
  notifEvents: 'normal',
  notifMarketplace: 'normal',
  notifActualites: 'low',
  notifSysteme: 'high',
  notifNewSubscribers: true,
  messageSuggestionsEnabled: true,
}

export function getUserPreferences(state, userId) {
  if (!userId) return { ...DEFAULT_NOTIFICATION_PREFERENCES }
  return {
    ...DEFAULT_NOTIFICATION_PREFERENCES,
    ...(state.account?.preferences?.[userId] || {}),
  }
}

export function getNotificationPriority(state, userId, preferenceKey) {
  const prefs = getUserPreferences(state, userId)
  const value = prefs[preferenceKey]
  if (value === false || value === 'off') return null
  if (value === true) return 'normal'
  return value || 'normal'
}

export function shouldSendNotification(state, userId, preferenceKey) {
  return getNotificationPriority(state, userId, preferenceKey) !== null
}

export function getAdminUserIds(state) {
  const ids = new Set()
  for (const user of state.administration?.users || []) {
    if (['admin', 'superadmin'].includes(user.role)) ids.add(user.id)
  }
  const current = state.auth?.user
  if (current && ['admin', 'superadmin'].includes(current.role)) {
    ids.add(current.id)
  }
  return [...ids]
}

export function resolveReviewOwnerId(state, { targetType, targetId }) {
  if (!targetType || !targetId) return null
  switch (targetType) {
    case REVIEW_TARGET_TYPES.USER_PROFILE:
      return targetId
    case REVIEW_TARGET_TYPES.BUSINESS: {
      const business = state.businesses?.items?.find((item) => item.id === targetId)
      return business?.ownerId || null
    }
    case REVIEW_TARGET_TYPES.LISTING:
      return state.marketplace?.items?.find((item) => item.id === targetId)?.ownerId || null
    case REVIEW_TARGET_TYPES.PARCEL:
      return state.parcels?.items?.find((item) => item.id === targetId)?.ownerId || null
    case REVIEW_TARGET_TYPES.JOB:
      return state.jobs?.items?.find((item) => item.id === targetId)?.ownerId || null
    case REVIEW_TARGET_TYPES.EVENT:
      return state.events?.items?.find((item) => item.id === targetId)?.ownerId || null
    case REVIEW_TARGET_TYPES.POST:
      return state.posts?.items?.find((item) => item.id === targetId)?.authorId || null
    default:
      return null
  }
}

export function resolveReviewOwnerLink({ targetType, targetId }) {
  switch (targetType) {
    case REVIEW_TARGET_TYPES.USER_PROFILE:
      return `/users/${targetId}/publications?view=avis`
    case REVIEW_TARGET_TYPES.BUSINESS:
      return `/businesses/${targetId}`
    case REVIEW_TARGET_TYPES.LISTING:
      return `/marketplace/${targetId}`
    case REVIEW_TARGET_TYPES.PARCEL:
      return `/parcels/${targetId}`
    case REVIEW_TARGET_TYPES.JOB:
      return `/jobs/${targetId}`
    case REVIEW_TARGET_TYPES.EVENT:
      return `/events/${targetId}`
    case REVIEW_TARGET_TYPES.POST:
      return '/news'
    default:
      return null
  }
}

export function resolvePublisherOwnerId(state, publisherType, publisherId) {
  if (!publisherId) return null
  if (publisherType === 'business') {
    return state.businesses?.items?.find((item) => item.id === publisherId)?.ownerId || null
  }
  return publisherId
}

export function resolveDisputePartyIds(state, dispute) {
  const ids = new Set()
  if (!dispute) return []

  if (dispute.relatedType === 'transfer') {
    const transfer = state.transfers?.items?.find((item) => item.id === dispute.relatedId)
    if (transfer?.userId) ids.add(transfer.userId)
    if (transfer?.businessOwnerId) ids.add(transfer.businessOwnerId)
  }

  if (dispute.relatedType === 'p2p_order') {
    const order = state.p2p?.orders?.find((item) => item.id === dispute.relatedId)
    if (order?.buyerId) ids.add(order.buyerId)
    if (order?.sellerId) ids.add(order.sellerId)
  }

  if (dispute.targetId) ids.add(dispute.targetId)
  if (dispute.openedBy) ids.add(dispute.openedBy)
  if (dispute.reporterId) ids.add(dispute.reporterId)

  return [...ids]
}

export const P2P_STATUS_LABELS = {
  created: 'Commande créée',
  waiting_payment: 'Paiement envoyé',
  completed: 'Transaction terminée',
  cancelled: 'Transaction annulée',
  disputed: 'Litige en cours',
}
