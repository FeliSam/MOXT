import { useEffect, useState } from 'react'
import { FiBell } from 'react-icons/fi'
import { useDispatch, useSelector } from 'react-redux'
import { useLanguage } from '../../contexts/useLanguage'
import { selectAccountPreferences } from '../../features/account/accountSlice'
import { addToast } from '../../features/ui/uiSlice'
import { isNative } from '../../platform/capacitor'
import {
  initNativePushNotifications,
  queryNativePushReceivePermission,
  setNativePushUserId,
} from '../../platform/pushNotifications'
import {
  canPromptForPushPermission,
  ensureWebPushSubscription,
  getVapidPublicKey,
  getWebPushErrorMessage,
} from '../../platform/webPush'
import { Button } from '../ui/Button'

const DISMISS_KEY = 'moxt.push-banner-dismissed'
const DISMISS_TTL_MS = 3 * 24 * 60 * 60 * 1000

function isBannerDismissed() {
  try {
    const raw = localStorage.getItem(DISMISS_KEY)
    if (!raw) return false
    const dismissedAt = Number(raw)
    if (!Number.isFinite(dismissedAt)) return raw === '1'
    return Date.now() - dismissedAt < DISMISS_TTL_MS
  } catch {
    return false
  }
}

/**
 * Invite à activer les notifications push (PWA web + app Capacitor native).
 */
export function PushPermissionBanner() {
  const dispatch = useDispatch()
  const { t, language } = useLanguage()
  const user = useSelector((state) => state.auth.user)
  const preferences = useSelector((state) =>
    user?.id ? selectAccountPreferences(state, user.id) : null,
  )
  const [dismissed, setDismissed] = useState(isBannerDismissed)
  const [loading, setLoading] = useState(false)
  const [nativePermission, setNativePermission] = useState(null)

  useEffect(() => {
    if (!isNative || !user?.id) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reset avant une requête asynchrone (permission native)
      setNativePermission(null)
      return
    }
    let cancelled = false
    void queryNativePushReceivePermission().then((state) => {
      if (!cancelled) setNativePermission(state)
    })
    return () => {
      cancelled = true
    }
  }, [user?.id])

  if (!user?.id || dismissed || preferences?.pushNotifications === false) return null

  if (isNative) {
    if (nativePermission !== 'prompt') return null
  } else {
    if (!canPromptForPushPermission()) return null
    if (typeof Notification === 'undefined' || Notification.permission !== 'default') return null
  }

  async function enablePush() {
    setLoading(true)
    try {
      if (isNative) {
        setNativePushUserId(user.id)
        const result = await initNativePushNotifications({ requestPermission: true })
        if (result.enabled) {
          dispatch(
            addToast({
              tone: 'success',
              title: t('settings.push.enabledTitle'),
              message: t('settings.push.enabledMessage'),
            }),
          )
          setDismissed(true)
          localStorage.setItem(DISMISS_KEY, String(Date.now()))
          setNativePermission('granted')
          return
        }
        if (result.reason === 'denied') {
          dispatch(
            addToast({
              tone: 'warning',
              title: t('settings.push.deniedTitle'),
              message: t('settings.push.nativeDenied'),
            }),
          )
          setNativePermission('denied')
        }
        return
      }

      if (!getVapidPublicKey()) {
        dispatch(
          addToast({
            tone: 'warning',
            title: t('settings.push.unavailableTitle'),
            message: getWebPushErrorMessage('missing_vapid', language),
          }),
        )
        return
      }

      const result = await ensureWebPushSubscription(user.id, { prompt: true })
      if (result.enabled) {
        dispatch(
          addToast({
            tone: 'success',
            title: t('settings.push.enabledTitle'),
            message: t('settings.push.enabledMessage'),
          }),
        )
        setDismissed(true)
        localStorage.setItem(DISMISS_KEY, String(Date.now()))
        return
      }
      if (result.reason) {
        dispatch(
          addToast({
            tone: result.reason === 'denied' ? 'warning' : 'info',
            title:
              result.reason === 'denied'
                ? t('settings.push.deniedTitle')
                : t('settings.push.incompleteTitle'),
            message: getWebPushErrorMessage(result.reason, language),
          }),
        )
      }
    } finally {
      setLoading(false)
    }
  }

  function dismiss() {
    setDismissed(true)
    localStorage.setItem(DISMISS_KEY, String(Date.now()))
  }

  return (
    <div className="fixed inset-x-3 top-[calc(4.5rem+env(safe-area-inset-top))] z-[var(--z-nav-menu)] rounded-2xl border border-brand-200 bg-brand-50 p-4 shadow-lg dark:border-brand-900/50 dark:bg-brand-950/90 lg:inset-x-auto lg:right-6 lg:top-auto lg:bottom-6 lg:max-w-sm">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-100 text-brand-700 dark:bg-brand-900/60 dark:text-brand-200">
          <FiBell />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold">{t('settings.push.bannerTitle')}</p>
          <p className="mt-1 text-xs leading-5 text-[var(--app-text-muted)]">
            {t('settings.push.bannerBody')}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button onClick={enablePush} loading={loading} disabled={loading}>
              {t('settings.push.allow')}
            </Button>
            <Button variant="secondary" onClick={dismiss}>
              {t('settings.push.later')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
