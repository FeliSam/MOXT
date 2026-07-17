import { FiBell, FiStar, FiUserCheck, FiUserPlus, FiVolumeX } from 'react-icons/fi'
import { useDispatch, useSelector } from 'react-redux'
import { Button } from '../../components/ui/Button'
import { useLanguage } from '../../contexts/useLanguage'
import { phase3Text } from '../../i18n/phase3I18n'
import {
  removePublisherSubscription,
  upsertPublisherSubscription,
  updatePublisherSubscriptionPref,
} from './accountSlice'
import { SubscriptionNotifyMenu } from './SubscriptionNotifyMenu'
import { selectIsSubscriberBanned, selectPublisherSubscription } from './subscriptionSelectors'
import { addToast } from '../ui/uiSlice'

const NOTIFY_ICONS = {
  all: FiBell,
  important: FiStar,
  muted: FiVolumeX,
}

export function SubscribeButton({
  publisherType,
  publisherId,
  publisherName,
  publisherPath,
  size = 'md',
  variant = 'secondary',
  className = '',
}) {
  const dispatch = useDispatch()
  const { t } = useLanguage()
  const p3 = (key, vars) => phase3Text(t, key, vars)
  const user = useSelector((state) => state.auth.user)
  const subscription = useSelector((state) =>
    selectPublisherSubscription(state, user?.id, publisherType, publisherId),
  )
  const isBanned = useSelector((state) =>
    selectIsSubscriberBanned(state, user?.id, publisherType, publisherId),
  )
  const isSubscribed = Boolean(subscription)
  const isSelf =
    publisherType === 'user' ? user?.id === publisherId : false

  if (!user?.id || isSelf) return null

  if (isBanned) {
    return (
      <Button className={className} size={size} variant="secondary" disabled title={p3('subscriptions.restricted')}>
        {p3('subscriptions.restricted')}
      </Button>
    )
  }

  function subscribe(notifyPref = 'all') {
    if (isBanned) {
      dispatch(
        addToast({
          title: p3('subscriptions.deniedTitle'),
          message: p3('subscriptions.deniedMessage'),
          tone: 'error',
        }),
      )
      return
    }
    dispatch(
      upsertPublisherSubscription({
        userId: user.id,
        publisherType,
        publisherId,
        notifyPref,
        publisherName,
        publisherPath,
        id: subscription?.id,
        createdAt: subscription?.createdAt,
      }),
    )
  }

  function handlePrefChange(notifyPref) {
    dispatch(
      updatePublisherSubscriptionPref({
        userId: user.id,
        publisherType,
        publisherId,
        notifyPref,
      }),
    )
  }

  function handleUnsubscribe() {
    dispatch(
      removePublisherSubscription({
        userId: user.id,
        publisherType,
        publisherId,
      }),
    )
  }

  const notifyPref = subscription?.notifyPref || 'all'
  const NotifyIcon = NOTIFY_ICONS[notifyPref] || FiBell
  const notifyLabel = p3(`subscriptions.notify.${notifyPref}`)

  if (!isSubscribed) {
    return (
      <Button
        className={className}
        size={size}
        variant={variant}
        icon={FiUserPlus}
        onClick={() => subscribe('all')}
      >
        {p3('subscriptions.subscribe')}
      </Button>
    )
  }

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <Button
        size={size}
        variant="secondary"
        icon={FiUserCheck}
        className="border-brand-200 bg-brand-50 text-brand-800 dark:border-brand-800 dark:bg-brand-950/40 dark:text-brand-200"
        aria-pressed="true"
      >
        {p3('subscriptions.subscribed')}
      </Button>
      <SubscriptionNotifyMenu
        activePref={notifyPref}
        isSubscribed
        onSelect={handlePrefChange}
        onUnsubscribe={handleUnsubscribe}
        trigger={
          <Button
            size={size}
            variant="ghost"
            iconOnly
            icon={NotifyIcon}
            aria-label={p3('subscriptions.notifyAria', { pref: notifyLabel })}
            title={notifyLabel}
            className="border border-[var(--app-border)] bg-[var(--app-surface)] hover:bg-[var(--app-surface-muted)]"
          />
        }
      />
    </div>
  )
}
