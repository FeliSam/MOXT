import { fromRows } from '../utils/remoteRowMapper.js'
import { rowsOrThrow } from './rowUtils.js'
import { filterPublisherSubscribers } from '../utils/subscriptionUtils.js'

export const SUBSCRIPTIONS_LIMIT = 200

/** Même requête que le web : lignes visibles par RLS (mes abonnements + mes abonnés), limite 200. */
export async function fetchPublisherSubscriptions(client, { limit = SUBSCRIPTIONS_LIMIT } = {}) {
  if (!client) return []
  const result = await client.from('publisher_subscriptions').select('*').limit(limit)
  return fromRows(rowsOrThrow(result, 'Abonnements')).map((item) => ({
    ...item,
    userId: item.userId || item.subscriberId,
  }))
}

/** Mes abonnements (web selectUserSubscriptions). */
export function selectUserSubscriptionList(subscriptions = [], userId) {
  return subscriptions.filter((item) => item.userId === userId)
}

/** Mes abonnés pour un éditeur donné (web filterPublisherSubscribers). */
export function selectPublisherSubscriberList(subscriptions = [], publisherType, publisherId) {
  return filterPublisherSubscribers(subscriptions, publisherType, publisherId)
}
