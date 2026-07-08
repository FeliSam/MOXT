/** Préférences de notification d'abonnement */
export const SUBSCRIPTION_NOTIFY_PREFS = ['all', 'important', 'muted']

export const SUBSCRIPTION_NOTIFY_LABELS = {
  all: 'Toutes les annonces',
  important: 'Importantes seulement',
  muted: 'Sourdine',
}

export const SUBSCRIPTION_NOTIFY_HINTS = {
  all: 'Marketplace, colis, jobs, événements et publications',
  important: 'Annonces marketplace et publications du fil',
  muted: 'Priorité dans les listes, sans notification',
}

/** Types de contenu « annonce » */
export const ANNOUNCEMENT_CONTENT_TYPES = ['listing', 'parcel', 'job', 'event', 'post']

/** Types notifiés en mode « important » */
export const IMPORTANT_CONTENT_TYPES = ['listing', 'post']

const CONTENT_TYPE_RANK = {
  listing: 0,
  post: 1,
  job: 2,
  event: 3,
  parcel: 4,
}

export function subscriptionKey(publisherType, publisherId) {
  return `${publisherType}:${publisherId}`
}

export function findSubscription(subscriptions, userId, publisherType, publisherId) {
  return (subscriptions || []).find(
    (item) =>
      item.userId === userId &&
      item.publisherType === publisherType &&
      item.publisherId === publisherId,
  )
}

export function isSubscribedToPublisher(subscriptions, userId, publisherType, publisherId) {
  return Boolean(findSubscription(subscriptions, userId, publisherType, publisherId))
}

export function shouldNotifySubscriber(notifyPref, contentType) {
  if (notifyPref === 'muted') return false
  if (notifyPref === 'important') return IMPORTANT_CONTENT_TYPES.includes(contentType)
  return true
}

export function notificationPriorityForSubscription(notifyPref, contentType, basePriority = 'normal') {
  if (notifyPref === 'muted') return 'low'
  if (notifyPref === 'important') {
    return contentType === 'listing' ? 'high' : 'normal'
  }
  if (contentType === 'listing' || contentType === 'post') return 'high'
  if (contentType === 'job' || contentType === 'event') return 'normal'
  return basePriority
}

export function resolveItemPublisher(item) {
  if (item?.businessId) {
    return { publisherType: 'business', publisherId: item.businessId }
  }
  const ownerId = item?.ownerId || item?.authorId
  if (ownerId) {
    return { publisherType: 'user', publisherId: ownerId }
  }
  return null
}

export function isItemFromSubscribedPublisher(item, subscriptions, userId) {
  const publisher = resolveItemPublisher(item)
  if (!publisher || !userId) return false
  if (publisher.publisherId === userId) return false
  return isSubscribedToPublisher(
    subscriptions,
    userId,
    publisher.publisherType,
    publisher.publisherId,
  )
}

/**
 * Trie les annonces : abonnements en premier, puis type (marketplace > publication > …), puis date.
 */
export function sortBySubscriptionPriority(items, subscriptions, userId, contentType = 'listing') {
  const list = [...items]
  return list.sort((a, b) => {
    const aSub = isItemFromSubscribedPublisher(a, subscriptions, userId) ? 0 : 1
    const bSub = isItemFromSubscribedPublisher(b, subscriptions, userId) ? 0 : 1
    if (aSub !== bSub) return aSub - bSub

    const aType = CONTENT_TYPE_RANK[contentType] ?? 5
    const bType = CONTENT_TYPE_RANK[contentType] ?? 5
    if (aSub === 0 && aType !== bType) return aType - bType

    const aDate = new Date(a.createdAt || a.updatedAt || 0).getTime()
    const bDate = new Date(b.createdAt || b.updatedAt || 0).getTime()
    return bDate - aDate
  })
}

export function filterPublisherSubscribers(subscriptions, publisherType, publisherId) {
  return (subscriptions || []).filter(
    (item) => item.publisherType === publisherType && item.publisherId === publisherId,
  )
}
