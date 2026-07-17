import {
  notificationPriorityForSubscription,
  shouldNotifySubscriber,
} from '@moxt/shared/utils/subscriptionUtils.js'
import { appText } from '../../i18n/appText'
import { addNotification } from '../communications/communicationSlice'

export function notifyPublisherSubscribers(
  store,
  {
    publisherType,
    publisherId,
    publisherName,
    contentType,
    contentLabel,
    title,
    link,
    actorId,
    priority = 'normal',
  },
) {
  const subscriptions = store.getState().account.subscriptions || []
  const targets = subscriptions.filter(
    (item) => item.publisherType === publisherType && item.publisherId === publisherId,
  )

  for (const subscription of targets) {
    if (subscription.userId === actorId) continue
    if (!shouldNotifySubscriber(subscription.notifyPref, contentType)) continue

    store.dispatch(
      addNotification({
        userId: subscription.userId,
        title: `${publisherName} — ${title}`,
        message: contentLabel,
        type: 'subscription',
        link,
        priority: notificationPriorityForSubscription(
          subscription.notifyPref,
          contentType,
          priority,
        ),
      }),
    )
  }
}

export function resolvePublisherFromContent(state, item) {
  if (item.businessId) {
    const business = state.businesses.items.find((entry) => entry.id === item.businessId)
    return {
      publisherType: 'business',
      publisherId: item.businessId,
      publisherName:
        business?.name || item.businessName || appText('shared.notifications.aBusiness'),
    }
  }
  return {
    publisherType: 'user',
    publisherId: item.ownerId || item.authorId,
    publisherName:
      item.sellerName ||
      item.authorName ||
      item.ownerName ||
      [item.firstName, item.lastName].filter(Boolean).join(' ') ||
      appText('shared.notifications.someone'),
  }
}
