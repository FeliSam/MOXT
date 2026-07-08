import { FiBell, FiBellOff } from 'react-icons/fi'
import { useDispatch, useSelector } from 'react-redux'
import { Button } from '../../components/ui/Button'
import { SUBSCRIPTION_NOTIFY_LABELS } from '@moxt/shared/utils/subscriptionUtils.js'
import {
  removePublisherSubscription,
  upsertPublisherSubscription,
  updatePublisherSubscriptionPref,
} from './accountSlice'
import { SubscriptionNotifyMenu } from './SubscriptionNotifyMenu'
import { selectPublisherSubscription } from './subscriptionSelectors'

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
  const isSubscribed = Boolean(subscription)
  const isSelf =
    publisherType === 'user' ? user?.id === publisherId : false

  if (!user?.id || isSelf) return null

  function subscribe(notifyPref) {
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

  function handleSelect(notifyPref) {
    if (isSubscribed) {
      dispatch(
        updatePublisherSubscriptionPref({
          userId: user.id,
          publisherType,
          publisherId,
          notifyPref,
        }),
      )
      return
    }
    subscribe(notifyPref)
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

  const label = isSubscribed
    ? SUBSCRIPTION_NOTIFY_LABELS[subscription.notifyPref] || "Abonné"
    : "S'abonner"

  return (
    <SubscriptionNotifyMenu
      activePref={subscription?.notifyPref || 'all'}
      isSubscribed={isSubscribed}
      onSelect={handleSelect}
      onUnsubscribe={handleUnsubscribe}
      trigger={
        <Button
          className={className}
          size={size}
          variant={isSubscribed ? 'primary' : variant}
          icon={isSubscribed ? FiBell : FiBellOff}
        >
          {label}
        </Button>
      }
    />
  )
}
