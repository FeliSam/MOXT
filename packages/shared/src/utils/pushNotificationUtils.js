/** Mappe le type de notification vers la clé de préférence utilisateur. */
export function resolveNotificationPreferenceKey(type = 'system') {
  const normalized = String(type || 'system').toLowerCase()
  switch (normalized) {
    case 'message':
      return 'notifMessages'
    case 'transfer':
    case 'p2p':
      return 'notifTransfers'
    case 'parcel':
      return 'notifParcels'
    case 'job':
      return 'notifJobs'
    case 'event':
      return 'notifEvents'
    case 'marketplace':
    case 'listing':
      return 'notifMarketplace'
    case 'post':
      return 'notifActualites'
    case 'subscription':
      return 'notifNewSubscribers'
    default:
      return 'notifSysteme'
  }
}

export function shouldDispatchWebPush(preferences = {}, { type, priority = 'normal' } = {}) {
  if (preferences.pushNotifications === false) return false

  const preferenceKey = resolveNotificationPreferenceKey(type)
  if (preferenceKey === 'notifNewSubscribers' && preferences.notifNewSubscribers === false) {
    return false
  }

  const value = preferences[preferenceKey]
  if (value === false || value === 'off') return false

  const effectivePriority = value === true ? 'normal' : value || priority || 'normal'
  return Boolean(effectivePriority)
}

export function buildWebPushPayload(notification = {}) {
  const link = notification.link || '/notifications'
  const path = link.startsWith('http') ? new URL(link).pathname + new URL(link).search : link
  return {
    title: notification.title || 'MOXT',
    body: notification.message || notification.body || '',
    data: {
      url: path.startsWith('/') ? path : `/${path}`,
      path,
      notificationId: notification.id || null,
      type: notification.type || 'system',
    },
  }
}
