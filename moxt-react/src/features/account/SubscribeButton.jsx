import { FiBell, FiStar, FiUserCheck, FiUserPlus, FiVolumeX } from 'react-icons/fi'
import { useDispatch, useSelector } from 'react-redux'
import { Button } from '../../components/ui/Button'
import { SUBSCRIPTION_NOTIFY_LABELS } from '@moxt/shared/utils/subscriptionUtils.js'
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
      <Button className={className} size={size} variant="secondary" disabled title="Accès restreint">
        Accès restreint
      </Button>
    )
  }

  function subscribe(notifyPref = 'all') {
    if (isBanned) {
      dispatch(
        addToast({
          title: 'Abonnement refusé',
          message: 'Vous ne pouvez plus vous abonner à cet éditeur.',
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
  const notifyLabel = SUBSCRIPTION_NOTIFY_LABELS[notifyPref] || 'Notifications'

  if (!isSubscribed) {
    return (
      <Button
        className={className}
        size={size}
        variant={variant}
        icon={FiUserPlus}
        onClick={() => subscribe('all')}
      >
        S'abonner
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
        Abonné
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
            aria-label={`Notifications : ${notifyLabel}`}
            title={notifyLabel}
            className="border border-[var(--app-border)] bg-[var(--app-surface)] hover:bg-[var(--app-surface-muted)]"
          />
        }
      />
    </div>
  )
}
