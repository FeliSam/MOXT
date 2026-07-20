import { setAll as resetBusinesses } from '../features/businesses/businessSlice'
import { setAll as resetCommunications } from '../features/communications/communicationSlice'
import { clearAppBadge } from '../platform/appBadge'
import { clearClientCache } from '../services/clearClientCache'
import { markIntentionalSignOut } from '../services/authSessionSync'

const persistenceMap = {
  account: [{ key: 'moxt-account-v1', select: (state) => state.account }],
  administration: [{ key: 'moxt-administration-v1', select: (state) => state.administration }],
  // audit: retiré volontairement — données sensibles ne doivent pas être en localStorage en clair
  businesses: [
    { key: 'moxt-businesses-v1', select: (state) => state.businesses.items },
    { key: 'moxt-business-members-v1', select: (state) => state.businesses.members },
    { key: 'moxt-business-documents-v1', select: (state) => state.businesses.documents },
    { key: 'moxt-business-requests-v1', select: (state) => state.businesses.requests },
  ],
  communications: [
    {
      key: 'moxt-conversations-v1',
      select: (state) =>
        state.communications.conversations.map((conv) => ({
          ...conv,
          messages: (conv.messages || []).slice(-200),
          messagesLoaded: Boolean(conv.messagesLoaded || conv.messages?.length),
        })),
    },
    { key: 'moxt-support-v1', select: (state) => state.communications.support },
    { key: 'moxt-notifications-v1', select: (state) => state.communications.notifications },
  ],
  disputes: [{ key: 'moxt-disputes-v1', select: (state) => state.disputes.items }],
  events: [
    { key: 'moxt-events-v1', select: (state) => state.events.items },
    { key: 'moxt-event-registrations-v1', select: (state) => state.events.registrations },
    { key: 'moxt-event-reports-v1', select: (state) => state.events.reports },
  ],
  finance: [{ key: 'moxt-finance-v1', select: (state) => state.finance }],
  identity: [{ key: 'moxt-identity-profiles-v1', select: (state) => state.identity.profiles }],
  recipientAddresses: [
    { key: 'moxt-recipient-addresses-v1', select: (state) => state.recipientAddresses.items },
  ],
  jobs: [
    { key: 'moxt-jobs-v1', select: (state) => state.jobs.items },
    { key: 'moxt-job-applications-v1', select: (state) => state.jobs.applications },
    { key: 'moxt-job-reports-v1', select: (state) => state.jobs.reports },
  ],
  marketplace: [
    { key: 'moxt-listings-v1', select: (state) => state.marketplace.items },
    { key: 'moxt-listing-reports-v1', select: (state) => state.marketplace.reports },
    { key: 'moxt-marketplace-filters-v1', select: (state) => state.marketplace.filters },
    { key: 'moxt-listing-draft-v1', select: (state) => state.marketplace.draft },
  ],
  p2p: [
    { key: 'moxt-p2p-offers-v1', select: (state) => state.p2p.offers },
    { key: 'moxt-p2p-orders-v1', select: (state) => state.p2p.orders },
  ],
  reviews: [{ key: 'moxt-reviews-v1', select: (state) => state.reviews.items }],
  parcels: [
    { key: 'moxt-parcels-v1', select: (state) => state.parcels.items },
    { key: 'moxt-parcel-requests-v1', select: (state) => state.parcels.requests },
  ],
  transfers: [{ key: 'moxt-transfers-v1', select: (state) => state.transfers.items }],
}

// Actions haute fréquence qui ne doivent pas déclencher de persistence
// (compteurs de vues, brouillons de rédaction, marquage lu, etc.)
const skipPersistence = new Set([
  'marketplace/incrementListingView',
  'marketplace/incrementListingContact',
  'marketplace/incrementListingShare',
  'communications/markConversationRead',
  'communications/saveConversationDraft',
  'communications/loadConversationMessages/pending',
  'communications/loadConversationMessages/fulfilled',
  'communications/loadConversationMessages/rejected',
  'communications/refreshConversations/pending',
  'communications/refreshConversations/fulfilled',
  'communications/refreshConversations/rejected',
  'app/loadAllData/fulfilled',
  'account/mergeRemoteAccount',
])

// Debounce timers per key — évite d'écrire en localStorage à chaque action Redux
const timers = {}
const DEBOUNCE_MS = 500

function scheduleWrite(key, getValue) {
  clearTimeout(timers[key])
  timers[key] = setTimeout(() => {
    try {
      localStorage.setItem(key, JSON.stringify(getValue()))
    } catch (error) {
      globalThis.dispatchEvent?.(
        new CustomEvent('moxt:persistence-error', {
          detail: { key, message: error instanceof Error ? error.message : String(error) },
        }),
      )
    }
  }, DEBOUNCE_MS)
}

function clearAllPersistedKeys() {
  Object.values(persistenceMap)
    .flat()
    .forEach(({ key }) => {
      clearTimeout(timers[key])
      delete timers[key]
      try {
        localStorage.removeItem(key)
      } catch {}
    })
}

function clearSessionData(store, { scope = 'full' } = {}) {
  clearAllPersistedKeys()
  clearClientCache({ scope })
  store.dispatch(
    resetBusinesses({
      items: [],
      members: [],
      documents: [],
      requests: [],
    }),
  )
  store.dispatch(
    resetCommunications({
      conversations: [],
      notifications: [],
      support: [],
    }),
  )
  clearAppBadge()
}

export const persistenceMiddleware = (store) => (next) => (action) => {
  // Before auth.signOut() runs inside the logout thunk — so SIGNED_OUT is intentional.
  if (action.type === 'auth/logout/pending') {
    markIntentionalSignOut()
  }

  const result = next(action)

  if (action.type === 'auth/login/rejected') {
    clearClientCache({ scope: 'auth', reason: 'login-failed' })
    return result
  }

  // Vider le cache local et la mémoire Redux à la déconnexion.
  if (action.type === 'auth/logout/fulfilled' || action.type === 'auth/clearSession') {
    clearSessionData(store, { scope: 'full' })
    return result
  }

  if (skipPersistence.has(action.type)) return result

  const domain = action.type.split('/')[0]
  persistenceMap[domain]?.forEach(({ key, select }) => {
    scheduleWrite(key, () => select(store.getState()))
  })

  return result
}

export { persistenceMap }
