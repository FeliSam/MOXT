import { useState } from 'react'
import { FiBell } from 'react-icons/fi'
import { useDispatch, useSelector } from 'react-redux'
import { selectAccountPreferences } from '../../features/account/accountSlice'
import { addToast } from '../../features/ui/uiSlice'
import { ensureWebPushSubscription, isWebPushContextReady } from '../../platform/webPush'
import { Button } from '../ui/Button'

/**
 * Invite à activer les notifications push sur PWA (surtout Safari installé).
 * S’affiche uniquement si l’API est prête mais la permission n’a pas encore été accordée.
 */
export function PushPermissionBanner() {
  const dispatch = useDispatch()
  const user = useSelector((state) => state.auth.user)
  const preferences = useSelector((state) =>
    user?.id ? selectAccountPreferences(state, user.id) : null,
  )
  const [dismissed, setDismissed] = useState(
    () => sessionStorage.getItem('moxt.push-banner-dismissed') === '1',
  )
  const [loading, setLoading] = useState(false)

  if (!user?.id || dismissed || preferences?.pushNotifications === false) return null
  if (!isWebPushContextReady()) return null
  if (typeof Notification === 'undefined' || Notification.permission !== 'default') return null

  async function enablePush() {
    setLoading(true)
    try {
      const result = await ensureWebPushSubscription(user.id, { prompt: true })
      if (result.enabled) {
        dispatch(
          addToast({
            tone: 'success',
            title: 'Notifications activées',
            message: 'Vous recevrez les alertes MOXT sur cet appareil.',
          }),
        )
        setDismissed(true)
        sessionStorage.setItem('moxt.push-banner-dismissed', '1')
        return
      }
      if (result.reason === 'denied') {
        dispatch(
          addToast({
            tone: 'warning',
            title: 'Notifications refusées',
            message: 'Autorisez MOXT dans Réglages → Notifications de Safari.',
          }),
        )
      }
    } finally {
      setLoading(false)
    }
  }

  function dismiss() {
    setDismissed(true)
    sessionStorage.setItem('moxt.push-banner-dismissed', '1')
  }

  return (
    <div className="fixed inset-x-3 bottom-[calc(5.75rem+env(safe-area-inset-bottom))] z-[calc(var(--z-nav)+1)] rounded-2xl border border-brand-200 bg-brand-50 p-4 shadow-lg dark:border-brand-900/50 dark:bg-brand-950/80 lg:inset-x-auto lg:right-6 lg:bottom-6 lg:max-w-sm">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-100 text-brand-700 dark:bg-brand-900/60 dark:text-brand-200">
          <FiBell />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold">Activer les notifications</p>
          <p className="mt-1 text-xs leading-5 text-[var(--app-text-muted)]">
            Messages, candidatures et alertes importantes sur votre écran d’accueil.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button onClick={enablePush} loading={loading} disabled={loading}>
              Autoriser
            </Button>
            <Button variant="secondary" onClick={dismiss}>
              Plus tard
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
