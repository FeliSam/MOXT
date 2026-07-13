import { filterPublisherSubscribers } from '@moxt/shared/utils/subscriptionUtils.js'

function normalizeName(value = '') {
  return String(value).trim().toLocaleLowerCase('fr')
}

function resolveConversationName(conversations, userId) {
  for (const conversation of conversations || []) {
    if (!conversation.participantIds?.includes(userId)) continue
    const profile = conversation.participantProfiles?.[userId]
    if (profile) {
      const full = `${profile.firstName || ''} ${profile.lastName || ''}`.trim()
      if (full) return full
    }
  }
  return ''
}

/**
 * Profils accessibles via le réseau d’abonnements :
 * personnes que je suis + personnes abonnées à moi.
 */
export function buildSubscriptionNetworkProfiles(state, userId) {
  if (!userId) return []

  const subscriptions = state.account?.subscriptions || []
  const conversations = state.communications?.conversations || []
  const profiles = new Map()

  for (const subscription of subscriptions) {
    if (subscription.userId === userId && subscription.publisherType === 'user' && subscription.publisherId) {
      const id = subscription.publisherId
      if (id === userId) continue
      profiles.set(id, {
        userId: id,
        displayName: subscription.publisherName || resolveConversationName(conversations, id) || 'Membre MOXT',
        relation: 'following',
      })
    }
  }

  for (const subscription of filterPublisherSubscribers(subscriptions, 'user', userId)) {
    const id = subscription.userId
    if (!id || id === userId) continue
    const existing = profiles.get(id)
    profiles.set(id, {
      userId: id,
      displayName:
        existing?.displayName ||
        resolveConversationName(conversations, id) ||
        subscription.publisherName ||
        'Membre MOXT',
      relation: existing ? 'mutual' : 'follower',
    })
  }

  return [...profiles.values()]
}

export function filterSubscriptionNetworkProfiles(profiles, query, minLength = 3) {
  const normalized = normalizeName(query)
  if (normalized.length < minLength) return []

  return profiles.filter((profile) => {
    const haystack = normalizeName(profile.displayName)
    return haystack.includes(normalized)
  })
}

export function subscriptionProfilesToSearchResults(profiles) {
  return profiles.map((profile) => ({
    id: profile.userId,
    type: 'profile',
    typeLabel: profile.relation === 'mutual' ? 'Abonnement mutuel' : 'Membre suivi',
    title: profile.displayName,
    subtitle:
      profile.relation === 'mutual'
        ? 'Abonné à vous · vous le suivez'
        : profile.relation === 'follower'
          ? 'Abonné à vos publications'
          : 'Dans vos abonnements',
    path: `/users/${profile.userId}/publications`,
    keywords: 'profil membre abonnement',
  }))
}
