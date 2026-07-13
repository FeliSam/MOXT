import { isStandalone } from '../pwa'
import { isNative } from './capacitor'
import {
  disableAllWebSubscriptions,
  removeDeviceSubscription,
  upsertDeviceSubscription,
} from '../services/deviceSubscriptions'

const WEB_PUSH_ENDPOINT_KEY = 'moxt-web-push-endpoint'

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

async function getServiceWorkerRegistration() {
  if (!('serviceWorker' in navigator)) return null
  return navigator.serviceWorker.ready
}

export async function getExistingWebPushSubscription() {
  const registration = await getServiceWorkerRegistration()
  if (!registration) return null
  return registration.pushManager.getSubscription()
}

export async function subscribeWebPush(userId) {
  if (!userId) return { enabled: false, reason: 'auth_required' }
  if (!canUseWebPushApi()) return { enabled: false, reason: 'unsupported' }
  if (!getVapidPublicKey()) return { enabled: false, reason: 'missing_vapid' }

  const installHint = getWebPushInstallHint()
  if (installHint) return { enabled: false, reason: installHint }

  const permission =
    Notification.permission === 'granted'
      ? 'granted'
      : Notification.permission === 'denied'
        ? 'denied'
        : await Notification.requestPermission()

  if (permission !== 'granted') {
    return { enabled: false, reason: permission || 'denied' }
  }

  const registration = await getServiceWorkerRegistration()
  if (!registration) return { enabled: false, reason: 'no_service_worker' }

  let subscription = await registration.pushManager.getSubscription()
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(getVapidPublicKey()),
    })
  }

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
