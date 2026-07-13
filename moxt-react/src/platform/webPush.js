import { isStandalone } from '../pwa'
import { isNative } from './capacitor'
import {
  disableAllWebSubscriptions,
  removeDeviceSubscription,
  upsertDeviceSubscription,
} from '../services/deviceSubscriptions'

const WEB_PUSH_ENDPOINT_KEY = 'moxt-web-push-endpoint'
const SW_READY_TIMEOUT_MS = 20_000
const PERMISSION_TIMEOUT_MS = 60_000
const PUSH_SUBSCRIBE_TIMEOUT_MS = 20_000
const DB_SYNC_TIMEOUT_MS = 15_000

export function getVapidPublicKey() {
  return import.meta.env.VITE_VAPID_PUBLIC_KEY || ''
}

export function canUseWebPushApi() {
  return (
    !isNative &&
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  )
}

export function isIosDevice() {
  if (typeof navigator === 'undefined') return false
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

export function isWebPushContextReady() {
  if (!canUseWebPushApi()) return false
  if (!getVapidPublicKey()) return false
  if (isIosDevice() && !isStandalone()) return false
  return true
}

/** Affiche la bannière d’autorisation (permission système, sans exiger VAPID). */
export function canPromptForPushPermission() {
  if (!canUseWebPushApi()) return false
  if (isIosDevice() && !isStandalone()) return false
  return true
}

export function getWebPushInstallHint() {
  if (!isIosDevice()) return null
  if (isStandalone()) return null
  return 'ios_install_required'
}

export function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = window.atob(base64)
  const output = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; ++i) {
    output[i] = raw.charCodeAt(i)
  }
  return output
}

export function readStoredWebPushEndpoint() {
  return localStorage.getItem(WEB_PUSH_ENDPOINT_KEY)
}

function storeWebPushEndpoint(endpoint) {
  if (endpoint) localStorage.setItem(WEB_PUSH_ENDPOINT_KEY, endpoint)
  else localStorage.removeItem(WEB_PUSH_ENDPOINT_KEY)
}

function withTimeout(promise, timeoutMs, reason) {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      reject(new Error(reason))
    }, timeoutMs)
    Promise.resolve(promise)
      .then((value) => {
        window.clearTimeout(timer)
        resolve(value)
      })
      .catch((error) => {
        window.clearTimeout(timer)
        reject(error)
      })
  })
}

async function ensureServiceWorkerRegistration() {
  if (!('serviceWorker' in navigator)) return null

  let registration = await navigator.serviceWorker.getRegistration()
  if (!registration) {
    registration = await navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' })
  }

  return withTimeout(navigator.serviceWorker.ready, SW_READY_TIMEOUT_MS, 'service_worker_timeout')
}

async function getServiceWorkerRegistration() {
  try {
    return await ensureServiceWorkerRegistration()
  } catch {
    return null
  }
}

async function requestNotificationPermission() {
  if (Notification.permission === 'granted') return 'granted'
  if (Notification.permission === 'denied') return 'denied'
  return withTimeout(
    Notification.requestPermission(),
    PERMISSION_TIMEOUT_MS,
    'permission_timeout',
  )
}

export async function getExistingWebPushSubscription() {
  const registration = await getServiceWorkerRegistration()
  if (!registration) return null
  return registration.pushManager.getSubscription()
}

export async function subscribeWebPush(userId, { permissionAlreadyGranted = false } = {}) {
  if (!userId) return { enabled: false, reason: 'auth_required' }
  if (!canUseWebPushApi()) return { enabled: false, reason: 'unsupported' }
  if (!getVapidPublicKey()) return { enabled: false, reason: 'missing_vapid' }

  const installHint = getWebPushInstallHint()
  if (installHint) return { enabled: false, reason: installHint }

  let permission = Notification.permission
  if (!permissionAlreadyGranted && permission === 'default') {
    try {
      permission = await requestNotificationPermission()
    } catch (error) {
      return {
        enabled: false,
        reason: error?.message === 'permission_timeout' ? 'permission_timeout' : 'denied',
      }
    }
  }

  if (permission !== 'granted') {
    return { enabled: false, reason: permission || 'denied' }
  }

  let registration
  try {
    registration = await ensureServiceWorkerRegistration()
  } catch (error) {
    return {
      enabled: false,
      reason:
        error?.message === 'service_worker_timeout' ? 'service_worker_timeout' : 'no_service_worker',
    }
  }

  if (!registration) return { enabled: false, reason: 'no_service_worker' }

  let subscription = await registration.pushManager.getSubscription()
  if (!subscription) {
    try {
      subscription = await withTimeout(
        registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(getVapidPublicKey()),
        }),
        PUSH_SUBSCRIBE_TIMEOUT_MS,
        'push_subscribe_timeout',
      )
    } catch (error) {
      return {
        enabled: false,
        reason:
          error?.message === 'push_subscribe_timeout' ? 'push_subscribe_timeout' : 'subscribe_failed',
      }
    }
  }

  const json = subscription.toJSON()
  try {
    await withTimeout(
      upsertDeviceSubscription(userId, {
        platform: 'web',
        endpoint: subscription.endpoint,
        p256dh: json.keys?.p256dh,
        authKey: json.keys?.auth,
        subscriptionJson: json,
        enabled: true,
      }),
      DB_SYNC_TIMEOUT_MS,
      'db_sync_timeout',
    )
  } catch (error) {
    return {
      enabled: false,
      reason: error?.message === 'db_sync_timeout' ? 'db_sync_timeout' : 'db_sync_failed',
      endpoint: subscription.endpoint,
    }
  }

  storeWebPushEndpoint(subscription.endpoint)
  return { enabled: true, endpoint: subscription.endpoint }
}

export async function unsubscribeWebPush(userId) {
  const subscription = await getExistingWebPushSubscription()
  const endpoint = subscription?.endpoint || readStoredWebPushEndpoint()

  if (subscription) {
    await subscription.unsubscribe()
  }

  if (userId && endpoint) {
    await removeDeviceSubscription(userId, endpoint)
  } else if (userId) {
    await disableAllWebSubscriptions(userId)
  }

  storeWebPushEndpoint(null)
  return { enabled: false }
}

export async function syncWebPushPreference(userId, enabled) {
  if (!canUseWebPushApi()) return { enabled: false, reason: 'unsupported' }
  if (enabled) return subscribeWebPush(userId)
  return unsubscribeWebPush(userId)
}

export async function refreshWebPushSubscription(userId) {
  if (!userId || !isWebPushContextReady()) return { ok: false }
  const subscription = await getExistingWebPushSubscription()
  if (!subscription) return { ok: false, reason: 'no_subscription' }

  const json = subscription.toJSON()
  await upsertDeviceSubscription(userId, {
    platform: 'web',
    endpoint: subscription.endpoint,
    p256dh: json.keys?.p256dh,
    authKey: json.keys?.auth,
    subscriptionJson: json,
    enabled: true,
  })
  storeWebPushEndpoint(subscription.endpoint)
  return { ok: true }
}

/** Réactive ou crée l’abonnement Web Push après connexion (Safari PWA inclus). */
export async function ensureWebPushSubscription(userId, { prompt = false } = {}) {
  if (!userId) return { enabled: false, reason: 'auth_required' }
  if (!isWebPushContextReady()) return { enabled: false, reason: 'not_ready' }

  if (Notification.permission === 'denied') {
    return { enabled: false, reason: 'denied' }
  }

  // iOS exige le geste utilisateur sur requestPermission : le faire avant tout await SW.
  if (prompt && Notification.permission === 'default') {
    try {
      const permission = await requestNotificationPermission()
      if (permission !== 'granted') {
        return { enabled: false, reason: permission || 'denied' }
      }
    } catch (error) {
      return {
        enabled: false,
        reason: error?.message === 'permission_timeout' ? 'permission_timeout' : 'denied',
      }
    }
  }

  const existing = await getExistingWebPushSubscription()
  if (existing) {
    await refreshWebPushSubscription(userId)
    return { enabled: true, endpoint: existing.endpoint, refreshed: true }
  }

  if (Notification.permission === 'granted') {
    return subscribeWebPush(userId, { permissionAlreadyGranted: true })
  }

  if (prompt) {
    return subscribeWebPush(userId, { permissionAlreadyGranted: true })
  }

  return { enabled: false, reason: 'permission_required' }
}

export function getWebPushErrorMessage(reason) {
  switch (reason) {
    case 'permission_timeout':
      return 'La demande iOS a expiré. Réessayez ou autorisez MOXT dans Réglages → Notifications.'
    case 'service_worker_timeout':
    case 'no_service_worker':
      return 'Le service de notifications n’a pas démarré. Fermez puis rouvrez l’app installée, puis réessayez.'
    case 'push_subscribe_timeout':
    case 'subscribe_failed':
      return 'L’abonnement push a échoué. Vérifiez votre connexion et réessayez.'
    case 'db_sync_timeout':
    case 'db_sync_failed':
      return 'Notifications autorisées sur l’appareil, mais la synchronisation serveur a échoué. Réessayez.'
    case 'denied':
      return 'Autorisez MOXT dans Réglages → Notifications de Safari.'
    case 'missing_vapid':
      return 'La configuration push du site est incomplète. Réessayez après la prochaine mise à jour.'
    default:
      return 'Impossible d’activer les notifications pour le moment. Réessayez plus tard.'
  }
}
