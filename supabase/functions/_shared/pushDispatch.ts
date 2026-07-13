import {
  buildWebPushPayload,
  resolveNotificationPreferenceKey,
  shouldDispatchWebPush,
} from '../../../../packages/shared/src/utils/pushNotificationUtils.js'

export { buildWebPushPayload, resolveNotificationPreferenceKey, shouldDispatchWebPush }

export function parseJsonField(value, fallback = {}) {
  if (!value) return fallback
  if (typeof value === 'object') return value
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

export function isAuthorizedDispatch(req, secret) {
  if (secret && req.headers.get('x-moxt-push-secret') === secret) return true
  return false
}

export function isRecentNotification(createdAt, maxAgeMs = 120_000) {
  if (!createdAt) return false
  const age = Date.now() - new Date(createdAt).getTime()
  return age >= 0 && age <= maxAgeMs
}
