import { Capacitor } from '@capacitor/core'
import { navigateDeepLink } from './deepLinks'
import { isNative } from './capacitor'
import { disableDeviceSubscription, syncNativeTokenToSupabase } from '../services/deviceSubscriptions'

const PUSH_TOKEN_KEY = 'moxt-native-push-token'
const ANDROID_CHANNEL_ID = 'moxt_default'
let listenersBound = false
let androidChannelReady = false
let activeUserId = null

function storePushToken(token) {
  if (!token) return
  localStorage.setItem(PUSH_TOKEN_KEY, token)
}

export function getStoredPushToken() {
  return localStorage.getItem(PUSH_TOKEN_KEY)
}

export function setNativePushUserId(userId) {
  activeUserId = userId || null
  const token = getStoredPushToken()
  if (activeUserId && token) {
    void syncNativeTokenToSupabase(activeUserId, {
      token,
      platform: Capacitor.getPlatform(),
    }).catch((error) => console.warn('[MOXT] Native push token sync failed', error))
  }
}

async function ensureAndroidChannel(PushNotifications) {
  if (androidChannelReady || Capacitor.getPlatform() !== 'android') return
  try {
    await PushNotifications.createChannel({
      id: ANDROID_CHANNEL_ID,
      name: 'MOXT',
      description: 'Messages, transferts et alertes MOXT',
      importance: 5,
      visibility: 1,
      vibration: true,
      sound: 'default',
    })
    androidChannelReady = true
  } catch (error) {
    console.warn('[MOXT] Canal de notification Android', error)
  }
}

async function bindPushListeners(PushNotifications) {
  if (listenersBound) return
  listenersBound = true

  await PushNotifications.addListener('registration', (token) => {
    storePushToken(token.value)
    if (activeUserId) {
      void syncNativeTokenToSupabase(activeUserId, {
        token: token.value,
        platform: Capacitor.getPlatform(),
      }).catch((error) => console.warn('[MOXT] Native push token sync failed', error))
    }
  })

  await PushNotifications.addListener('registrationError', (error) => {
    console.warn('[MOXT] Push registration failed', error)
  })

  await PushNotifications.addListener('pushNotificationReceived', (event) => {
    console.info('[MOXT] Push reçu (foreground)', event.notification?.title || event.title)
  })

  await PushNotifications.addListener('pushNotificationActionPerformed', (event) => {
    const path = event.notification?.data?.path || event.notification?.data?.url
    if (typeof path === 'string' && path.trim()) {
      const target = path.startsWith('moxt://') || path.startsWith('http')
        ? path
        : `moxt://app${path.startsWith('/') ? path : `/${path}`}`
      navigateDeepLink(target)
    }
  })
}

function needsPushPrompt(receive) {
  return receive === 'prompt' || receive === 'prompt-with-rationale'
}

/** @returns {'granted'|'denied'|'prompt'|'unsupported'} */
export async function queryNativePushReceivePermission() {
  if (!isNative || Capacitor.getPlatform() === 'web') return 'unsupported'
  try {
    const { PushNotifications } = await import('@capacitor/push-notifications')
    const permission = await PushNotifications.checkPermissions()
    if (permission.receive === 'granted') return 'granted'
    if (permission.receive === 'denied') return 'denied'
    return 'prompt'
  } catch {
    return 'unsupported'
  }
}

/**
 * Initialise les notifications push natives (FCM / APNs via Capacitor).
 * Nécessite `google-services.json` (Android) et la config Firebase côté projet.
 */
export async function initNativePushNotifications({ requestPermission = false } = {}) {
  if (!isNative || Capacitor.getPlatform() === 'web') {
    return { enabled: false, reason: 'web' }
  }

  try {
    const { PushNotifications } = await import('@capacitor/push-notifications')
    await bindPushListeners(PushNotifications)
    await ensureAndroidChannel(PushNotifications)

    let permission = await PushNotifications.checkPermissions()
    if (requestPermission && needsPushPrompt(permission.receive)) {
      permission = await PushNotifications.requestPermissions()
    }

    if (permission.receive !== 'granted') {
      return { enabled: false, reason: permission.receive || 'denied' }
    }

    await PushNotifications.register()
    return { enabled: true }
  } catch (error) {
    console.warn('[MOXT] Push init unavailable', error)
    return { enabled: false, reason: 'error', error }
  }
}

export async function syncNativePushPreference(enabled) {
  if (!isNative) return { enabled: false, reason: 'web' }

  if (enabled) {
    return initNativePushNotifications({ requestPermission: true })
  }

  try {
    const { PushNotifications } = await import('@capacitor/push-notifications')
    await PushNotifications.removeAllDeliveredNotifications()
    try {
      await PushNotifications.unregister()
    } catch {
      /* unregister optionnel selon OS */
    }
    const token = getStoredPushToken()
    if (activeUserId && token) {
      await disableDeviceSubscription(activeUserId, token)
    }
    localStorage.removeItem(PUSH_TOKEN_KEY)
    return { enabled: false, reason: 'disabled' }
  } catch {
    localStorage.removeItem(PUSH_TOKEN_KEY)
    return { enabled: false, reason: 'disabled' }
  }
}
