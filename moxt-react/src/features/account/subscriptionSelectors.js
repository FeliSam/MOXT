import {
  findSubscription,
  filterPublisherSubscribers,
} from '@moxt/shared/utils/subscriptionUtils.js'

export function selectUserSubscriptions(state, userId) {
  return (state.account.subscriptions || []).filter((item) => item.userId === userId)
}

export function selectPublisherSubscription(state, userId, publisherType, publisherId) {
  if (!userId) return null
  return findSubscription(state.account.subscriptions, userId, publisherType, publisherId)
}

export function selectPublisherSubscribers(state, publisherType, publisherId) {
  return filterPublisherSubscribers(state.account.subscriptions, publisherType, publisherId)
}

export function selectSubscribedPublisherKeys(state, userId) {
  return new Set(
    selectUserSubscriptions(state, userId).map(
      (item) => `${item.publisherType}:${item.publisherId}`,
    ),
  )
}
