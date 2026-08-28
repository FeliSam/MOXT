import { createSlice } from '@reduxjs/toolkit'
import { createId } from '../../services/createId'
import { createLocalStorage } from '../../services/createLocalStorage'
import { mergeRemoteById } from '@moxt/shared/utils/mergeRemoteById.js'
import { isSubscriberBanned } from '@moxt/shared/utils/subscriptionUtils.js'
import { normalizeTransferProfile } from '../transfers/transferProfileFavorites'

const storage = createLocalStorage('moxt-account-v1')

const defaultPreferences = {
  language: 'ru',
  emailNotifications: true,
  pushNotifications: true,
  activityVisibility: 'public',
  securityAlerts: true,
  twoFactorEnabled: false,
  marketingConsent: false,
  notifMessages: 'high',
  notifTransfers: 'high',
  notifParcels: 'high',
  notifJobs: 'high',
  notifEvents: 'high',
  notifMarketplace: 'high',
  notifActualites: 'high',
  notifStatuses: 'high',
  notifOther: 'high',
  notifSysteme: 'high',
  notifNewSubscribers: true,
  messageSuggestionsEnabled: true,
}

const ACCOUNT_DEFAULTS = {
  favorites: [],
  subscriptions: [],
  subscriberBans: [],
  subscriberReports: [],
  transferProfiles: [],
  documents: [],
  verificationRequests: [],
  phoneAssistRequests: [],
  preferences: {},
  deletionRequests: [],
  viewedListings: [],
  listingImpressions: [],
}

const VIEWED_LISTINGS_LIMIT = 200
const LISTING_IMPRESSIONS_LIMIT = 400

const storedAccount = storage.read(ACCOUNT_DEFAULTS)
const initialState = {
  ...ACCOUNT_DEFAULTS,
  ...(storedAccount && typeof storedAccount === 'object' ? storedAccount : {}),
  // Anciens caches sans la clé → undefined ferait disparaître l’étiquette « Vu »
  viewedListings: Array.isArray(storedAccount?.viewedListings)
    ? storedAccount.viewedListings.slice(0, VIEWED_LISTINGS_LIMIT)
    : [],
  listingImpressions: Array.isArray(storedAccount?.listingImpressions)
    ? storedAccount.listingImpressions.slice(0, LISTING_IMPRESSIONS_LIMIT)
    : [],
  favorites: Array.isArray(storedAccount?.favorites) ? storedAccount.favorites : [],
}

const accountSlice = createSlice({
  name: 'account',
  initialState,
  reducers: {
    setAll(state, action) {
      Object.assign(state, action.payload)
    },
    mergeRemoteAccount(state, action) {
      const {
        favorites,
        subscriptions,
        subscriberBans,
        subscriberReports,
        transferProfiles,
        documents,
        verificationRequests,
        phoneAssistRequests,
        deletionRequests,
      } = action.payload
      if (favorites) state.favorites = mergeRemoteById(state.favorites, favorites)
      if (subscriptions) state.subscriptions = mergeRemoteById(state.subscriptions, subscriptions)
      if (subscriberBans) {
        state.subscriberBans = mergeRemoteById(state.subscriberBans || [], subscriberBans)
      }
      if (subscriberReports) {
        state.subscriberReports = mergeRemoteById(state.subscriberReports || [], subscriberReports)
      }
      if (transferProfiles) {
        state.transferProfiles = mergeRemoteById(
          state.transferProfiles,
          transferProfiles.map(normalizeTransferProfile),
        )
      }
      if (documents) state.documents = mergeRemoteById(state.documents, documents)
      if (verificationRequests) {
        state.verificationRequests = mergeRemoteById(
          state.verificationRequests,
          verificationRequests,
        )
      }
      if (phoneAssistRequests) {
        state.phoneAssistRequests = mergeRemoteById(
          state.phoneAssistRequests || [],
          phoneAssistRequests,
        )
      }
      if (deletionRequests) {
        state.deletionRequests = mergeRemoteById(state.deletionRequests || [], deletionRequests)
      }
    },
    saveTransferProfile: {
      reducer(state, action) {
        state.transferProfiles ||= []
        const index = state.transferProfiles.findIndex(
          (item) => item.id === action.payload.id && item.userId === action.payload.userId,
        )
        if (index >= 0) state.transferProfiles[index] = action.payload
        else state.transferProfiles.unshift(action.payload)
      },
      prepare(values) {
        const profile = normalizeTransferProfile(values)
        return {
          payload: {
            id: values.id || createId('TPRO'),
            userId: profile.userId,
            firstName: profile.firstName,
            lastName: profile.lastName,
            phone: profile.phone,
            country: profile.country || 'RU',
            method: profile.method || 'mobile_money',
            createdAt: values.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        }
      },
    },
    markListingViewed: {
      reducer(state, action) {
        state.viewedListings = Array.isArray(state.viewedListings) ? state.viewedListings : []
        const exists = state.viewedListings.some(
          (item) =>
            item.userId === action.payload.userId && item.listingId === action.payload.listingId,
        )
        if (!exists) {
          state.viewedListings.unshift(action.payload)
          if (state.viewedListings.length > VIEWED_LISTINGS_LIMIT) {
            state.viewedListings.length = VIEWED_LISTINGS_LIMIT
          }
        }
      },
      prepare(values) {
        return {
          payload: {
            userId: values.userId,
            listingId: values.listingId,
            viewedAt: new Date().toISOString(),
          },
        }
      },
    },
    recordListingImpression: {
      reducer(state, action) {
        state.listingImpressions = Array.isArray(state.listingImpressions)
          ? state.listingImpressions
          : []
        const exists = state.listingImpressions.some(
          (item) =>
            item.userId === action.payload.userId && item.listingId === action.payload.listingId,
        )
        if (exists) return
        state.listingImpressions.unshift(action.payload)
        if (state.listingImpressions.length > LISTING_IMPRESSIONS_LIMIT) {
          state.listingImpressions.length = LISTING_IMPRESSIONS_LIMIT
        }
      },
      prepare(values) {
        return {
          payload: {
            userId: values.userId,
            listingId: values.listingId,
            railId: values.railId || '',
            seenAt: new Date().toISOString(),
          },
        }
      },
    },
    hydrateMarketplaceDiscoverySignals(state, action) {
      const { userId, viewedListings = [], listingImpressions = [] } = action.payload || {}
      if (!userId) return
      if (Array.isArray(viewedListings) && viewedListings.length) {
        const merged = [...viewedListings, ...(state.viewedListings || [])]
        const seen = new Set()
        state.viewedListings = merged
          .filter((item) => {
            if (!item?.listingId || item.userId !== userId) return false
            const key = item.listingId
            if (seen.has(key)) return false
            seen.add(key)
            return true
          })
          .slice(0, VIEWED_LISTINGS_LIMIT)
      }
      if (Array.isArray(listingImpressions) && listingImpressions.length) {
        const merged = [...listingImpressions, ...(state.listingImpressions || [])]
        const seen = new Set()
        state.listingImpressions = merged
          .filter((item) => {
            if (!item?.listingId || item.userId !== userId) return false
            const key = item.listingId
            if (seen.has(key)) return false
            seen.add(key)
            return true
          })
          .slice(0, LISTING_IMPRESSIONS_LIMIT)
      }
    },
    removeTransferProfile(state, action) {
      state.transferProfiles = (state.transferProfiles || []).filter(
        (item) => item.id !== action.payload.id || item.userId !== action.payload.userId,
      )
    },
    toggleAccountFavorite: {
      reducer(state, action) {
        const index = state.favorites.findIndex(
          (item) =>
            item.userId === action.payload.userId &&
            item.relatedType === action.payload.relatedType &&
            item.relatedId === action.payload.relatedId,
        )
        if (index >= 0) state.favorites.splice(index, 1)
        else state.favorites.unshift(action.payload)
      },
      prepare(values) {
        return {
          payload: {
            id: createId('FAV'),
            userId: values.userId,
            relatedType: values.relatedType,
            relatedId: values.relatedId,
            title: values.title,
            path: values.path,
            snapshot: values.snapshot || undefined,
            createdAt: new Date().toISOString(),
          },
        }
      },
    },
    upsertPublisherSubscription: {
      reducer(state, action) {
        if (
          isSubscriberBanned(
            state.subscriberBans,
            action.payload.userId,
            action.payload.publisherType,
            action.payload.publisherId,
          )
        ) {
          return
        }
        state.subscriptions ||= []
        const index = state.subscriptions.findIndex(
          (item) =>
            item.userId === action.payload.userId &&
            item.publisherType === action.payload.publisherType &&
            item.publisherId === action.payload.publisherId,
        )
        if (index >= 0) state.subscriptions[index] = action.payload
        else state.subscriptions.unshift(action.payload)
      },
      prepare(values) {
        const now = new Date().toISOString()
        return {
          payload: {
            id: values.id || createId('SUB'),
            userId: values.userId,
            publisherType: values.publisherType,
            publisherId: values.publisherId,
            notifyPref: values.notifyPref || 'all',
            publisherName: values.publisherName || '',
            publisherPath: values.publisherPath || '',
            createdAt: values.createdAt || now,
            updatedAt: now,
          },
        }
      },
    },
    removePublisherSubscription(state, action) {
      state.subscriptions = (state.subscriptions || []).filter(
        (item) =>
          !(
            item.userId === action.payload.userId &&
            item.publisherType === action.payload.publisherType &&
            item.publisherId === action.payload.publisherId
          ),
      )
    },
    updatePublisherSubscriptionPref(state, action) {
      const subscription = (state.subscriptions || []).find(
        (item) =>
          item.userId === action.payload.userId &&
          item.publisherType === action.payload.publisherType &&
          item.publisherId === action.payload.publisherId,
      )
      if (!subscription) return
      subscription.notifyPref = action.payload.notifyPref
      subscription.updatedAt = new Date().toISOString()
    },
    removeSubscriberByPublisher: {
      reducer(state, action) {
        const { publisherType, publisherId, subscriberId } = action.payload
        state.subscriptions = (state.subscriptions || []).filter(
          (item) =>
            !(
              item.userId === subscriberId &&
              item.publisherType === publisherType &&
              item.publisherId === publisherId
            ),
        )
      },
      prepare(values) {
        return { payload: values }
      },
    },
    banPublisherSubscriber: {
      reducer(state, action) {
        state.subscriberBans ||= []
        const exists = state.subscriberBans.some((item) => item.id === action.payload.id)
        if (!exists) state.subscriberBans.unshift(action.payload)
        state.subscriptions = (state.subscriptions || []).filter(
          (item) =>
            !(
              item.userId === action.payload.subscriberId &&
              item.publisherType === action.payload.publisherType &&
              item.publisherId === action.payload.publisherId
            ),
        )
      },
      prepare(values) {
        return {
          payload: {
            id: values.id || createId('SBAN'),
            publisherType: values.publisherType,
            publisherId: values.publisherId,
            subscriberId: values.subscriberId,
            reason: values.reason?.trim() || '',
            bannedBy: values.bannedBy,
            publisherName: values.publisherName || '',
            publisherPath: values.publisherPath || '',
            createdAt: values.createdAt || new Date().toISOString(),
          },
        }
      },
    },
    unbanPublisherSubscriber(state, action) {
      state.subscriberBans = (state.subscriberBans || []).filter(
        (item) => item.id !== action.payload.id,
      )
    },
    reportPublisherSubscriber: {
      reducer(state, action) {
        state.subscriberReports ||= []
        const duplicate = state.subscriberReports.some(
          (item) =>
            item.publisherType === action.payload.publisherType &&
            item.publisherId === action.payload.publisherId &&
            item.subscriberId === action.payload.subscriberId &&
            item.reporterId === action.payload.reporterId &&
            item.status === 'new',
        )
        if (!duplicate) state.subscriberReports.unshift(action.payload)
      },
      prepare(values) {
        return {
          payload: {
            id: values.id || createId('SREP'),
            publisherType: values.publisherType,
            publisherId: values.publisherId,
            subscriberId: values.subscriberId,
            reporterId: values.reporterId,
            reason: values.reason.trim(),
            status: 'new',
            publisherName: values.publisherName || '',
            createdAt: new Date().toISOString(),
          },
        }
      },
    },
    updateSubscriberReportStatus(state, action) {
      const report = (state.subscriberReports || []).find((item) => item.id === action.payload.id)
      if (!report) return
      report.status = action.payload.status
      report.updatedAt = new Date().toISOString()
    },
    addPersonalDocument: {
      reducer(state, action) {
        const next = action.payload
        const category = next.category || 'other'
        if (category !== 'other') {
          const now = new Date().toISOString()
          state.documents.forEach((item) => {
            if (
              item.userId === next.userId &&
              item.category === category &&
              item.id !== next.id &&
              !item.deletedAt &&
              ['pending_review', 'pending', 'rejected'].includes(item.status)
            ) {
              item.deletedAt = now
              item.deletedByUser = false
            }
          })
        }
        state.documents.unshift(next)
      },
      prepare(values) {
        return {
          payload: {
            id: values.id || createId('PDOC'),
            userId: values.userId,
            category: values.category,
            name: values.name,
            size: Number(values.size) || 0,
            type: values.type || 'application/octet-stream',
            url: values.url || null,
            storagePath: values.storagePath || null,
            status: 'pending_review',
            createdAt: values.createdAt || new Date().toISOString(),
          },
        }
      },
    },
    removePersonalDocument(state, action) {
      const document = state.documents.find(
        (item) => item.id === action.payload.id && item.userId === action.payload.userId,
      )
      if (!document) return
      document.deletedAt = new Date().toISOString()
      document.deletedByUser = true
    },
    /** Retire une fiche locale non synchronisée uniquement si force:true. */
    discardUnsyncedPersonalDocument(state, action) {
      if (action.payload?.force) {
        state.documents = state.documents.filter((item) => item.id !== action.payload.id)
      }
    },
    submitVerificationRequest: {
      reducer(state, action) {
        const existing = state.verificationRequests.find(
          (item) => item.userId === action.payload.userId && item.status === 'pending_review',
        )
        if (existing) Object.assign(existing, action.payload, { id: existing.id })
        else state.verificationRequests.unshift(action.payload)
      },
      prepare(values) {
        return {
          payload: {
            id: createId('VER'),
            userId: values.userId,
            level: values.level,
            documentIds: values.documentIds || [],
            note: values.note?.trim() || '',
            status: 'pending_review',
            createdAt: new Date().toISOString(),
          },
        }
      },
    },
    updateVerificationStatus(state, action) {
      const request = state.verificationRequests.find((item) => item.id === action.payload.id)
      if (!request) return
      const nextStatus = action.payload.status
      const reviewNote = String(action.payload.reviewNote ?? request.reviewNote ?? '').trim()
      if (nextStatus === 'rejected' && !reviewNote) return
      request.status = nextStatus
      request.reviewedAt = new Date().toISOString()
      request.reviewedBy = action.payload.reviewedBy
      if (!Array.isArray(request.documentIds)) {
        request.documentIds = []
      }
      if (nextStatus === 'rejected' || action.payload.reviewNote !== undefined) {
        request.reviewNote = reviewNote
      }
      // Propager la confirmation KYC aux documents personnels liés (évite reconfirmation).
      if (nextStatus === 'verified') {
        const ids = new Set((request.documentIds || []).map(String).filter(Boolean))
        const now = new Date().toISOString()
        state.documents.forEach((doc) => {
          if (doc.userId !== request.userId || doc.deletedAt || doc.status === 'verified') return
          const inRequest = ids.has(String(doc.id))
          const identityLike = /^(identity|address|selfie|passport)/i.test(String(doc.category || ''))
          if (inRequest || (ids.size === 0 && identityLike && doc.status !== 'rejected')) {
            doc.status = 'verified'
            doc.updatedAt = now
          }
        })
      }
    },
    submitPhoneAssistRequest: {
      reducer(state, action) {
        state.phoneAssistRequests ||= []
        const existing = state.phoneAssistRequests.find(
          (item) => item.userId === action.payload.userId && item.status === 'pending',
        )
        if (existing) {
          Object.assign(existing, action.payload, { id: existing.id })
          return
        }
        state.phoneAssistRequests.unshift(action.payload)
      },
      prepare(values) {
        return {
          payload: {
            id: createId('PHA'),
            userId: values.userId,
            phone: String(values.phone || '').trim(),
            note: values.note?.trim() || '',
            status: 'pending',
            createdAt: new Date().toISOString(),
          },
        }
      },
    },
    updatePhoneAssistStatus(state, action) {
      const request = (state.phoneAssistRequests || []).find((item) => item.id === action.payload.id)
      if (!request) return
      const nextStatus = action.payload.status
      if (!['approved', 'rejected', 'pending'].includes(nextStatus)) return
      const reviewNote = String(action.payload.reviewNote ?? request.reviewNote ?? '').trim()
      if (nextStatus === 'rejected' && !reviewNote) return
      request.status = nextStatus
      request.reviewedAt = new Date().toISOString()
      request.reviewedBy = action.payload.reviewedBy || null
      if (nextStatus === 'rejected' || action.payload.reviewNote !== undefined) {
        request.reviewNote = reviewNote
      }
    },
    updateAccountPreferences(state, action) {
      const { userId, preferences, fromRemote = false } = action.payload
      const merged = {
        ...defaultPreferences,
        ...state.preferences[userId],
        ...preferences,
      }
      if (fromRemote && preferences.activityVisibility !== undefined) {
        merged.activityVisibility = preferences.activityVisibility
      }
      state.preferences[userId] = merged
    },
    hydrateAccountPreferences(state, action) {
      const { userId, preferences, fromRemote = true } = action.payload
      const previous = state.preferences[userId] || {}
      const merged = {
        ...defaultPreferences,
        ...previous,
        ...preferences,
      }
      // Source de vérité distante : pas de language inventée ni de cache local si absente du profil
      if (fromRemote && preferences.language === undefined) {
        delete merged.language
      }
      if (fromRemote && preferences.activityVisibility !== undefined) {
        merged.activityVisibility = preferences.activityVisibility
      }
      state.preferences[userId] = merged
    },
    requestAccountDeletion: {
      reducer(state, action) {
        const existing = state.deletionRequests.find(
          (item) => item.userId === action.payload.userId && item.status === 'requested',
        )
        if (!existing) state.deletionRequests.unshift(action.payload)
      },
      prepare({ userId }) {
        const createdAt = new Date().toISOString()
        const suspendAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        const purgeAt = new Date(Date.now() + (24 + 30 * 24) * 60 * 60 * 1000).toISOString()
        return {
          payload: {
            id: createId('DEL'),
            userId,
            status: 'requested',
            createdAt,
            suspendAt,
            purgeAt,
          },
        }
      },
    },
    cancelAccountDeletion(state, action) {
      const request = state.deletionRequests.find(
        (item) => item.userId === action.payload && item.status === 'requested',
      )
      if (request) {
        request.status = 'cancelled'
        request.cancelledAt = new Date().toISOString()
      }
    },
  },
})

export function selectAccountPreferences(state, userId) {
  return { ...defaultPreferences, ...state.account.preferences[userId] }
}

export const {
  addPersonalDocument,
  cancelAccountDeletion,
  discardUnsyncedPersonalDocument,
  markListingViewed,
  recordListingImpression,
  hydrateMarketplaceDiscoverySignals,
  removePersonalDocument,
  requestAccountDeletion,
  removeTransferProfile,
  saveTransferProfile,
  submitVerificationRequest,
  submitPhoneAssistRequest,
  toggleAccountFavorite,
  upsertPublisherSubscription,
  removePublisherSubscription,
  removeSubscriberByPublisher,
  banPublisherSubscriber,
  unbanPublisherSubscriber,
  reportPublisherSubscriber,
  updateSubscriberReportStatus,
  updatePublisherSubscriptionPref,
  updateAccountPreferences,
  updateVerificationStatus,
  updatePhoneAssistStatus,
  hydrateAccountPreferences,
  mergeRemoteAccount,
  setAll,
} = accountSlice.actions
export default accountSlice.reducer
