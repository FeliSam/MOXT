/** Logique push partagée côté Edge Function (copie autonome, sans import monorepo). */

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

export function shouldDispatchWebPush(
  preferences: Record<string, unknown> = {},
  { type, priority = 'normal' }: { type?: string; priority?: string } = {},
) {
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

export function buildWebPushPayload(notification: {
  id?: string
  title?: string
  message?: string
  body?: string
  link?: string | null
  type?: string
} = {}) {
  const link = notification.link || '/notifications'
  const path = link.startsWith('http')
    ? new URL(link).pathname + new URL(link).search
    : link
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

export function parseJsonField(value: unknown, fallback: Record<string, unknown> = {}) {
  if (!value) return fallback
  if (typeof value === 'object') return value as Record<string, unknown>
  try {
    return JSON.parse(String(value)) as Record<string, unknown>
  } catch {
    return fallback
  }
}

export function isAuthorizedDispatch(req: Request, secret: string) {
  if (secret && req.headers.get('x-moxt-push-secret') === secret) return true
  return false
}

export function isRecentNotification(createdAt?: string | null, maxAgeMs = 120_000) {
  if (!createdAt) return false
  const age = Date.now() - new Date(createdAt).getTime()
  return age >= 0 && age <= maxAgeMs
}
