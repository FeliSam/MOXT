import { createSlice } from '@reduxjs/toolkit'
import { createId } from '../../services/createId'
import { createLocalStorage } from '../../services/createLocalStorage'
import { mergeRemoteById } from '@moxt/shared/utils/mergeRemoteById.js'
import { isSubscriberBanned } from '@moxt/shared/utils/subscriptionUtils.js'

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
  notifParcels: 'normal',
  notifJobs: 'normal',
  notifEvents: 'normal',
  notifMarketplace: 'normal',
  notifActualites: 'low',
  notifSysteme: 'high',
  notifNewSubscribers: true,
  messageSuggestionsEnabled: true,
}

const initialState = storage.read({
  favorites: [],
  subscriptions: [],
  subscriberBans: [],
  subscriberReports: [],
  transferProfiles: [],
  documents: [],
  verificationRequests: [],
  preferences: {},
  deletionRequests: [],
  viewedListings: [],
})

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
        state.transferProfiles = mergeRemoteById(state.transferProfiles, transferProfiles)
      }
      if (documents) state.documents = mergeRemoteById(state.documents, documents)
      if (verificationRequests) {
        state.verificationRequests = mergeRemoteById(
          state.verificationRequests,
          verificationRequests,
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
        return {
          payload: {
            id: values.id || createId('TPRO'),
            userId: values.userId,
            firstName: values.firstName.trim(),
            lastName: values.lastName.trim(),
            phone: values.phone.trim(),
            country: values.country,
            method: values.method,
            createdAt: values.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        }
      },
    },
    markListingViewed: {
      reducer(state, action) {
        state.viewedListings ||= []
        const exists = state.viewedListings.some(
          (item) =>
            item.userId === action.payload.userId && item.listingId === action.payload.listingId,
        )
        if (!exists) state.viewedListings.unshift(action.payload)
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
        state.documents.unshift(action.payload)
      },
      prepare(values) {
        return {
          payload: {
            id: createId('PDOC'),
            userId: values.userId,
            category: values.category,
            name: values.name,
            size: Number(values.size) || 0,
            type: values.type || 'application/octet-stream',
            url: values.url || null,
            status: 'pending_review',
            createdAt: new Date().toISOString(),
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
      request.status = action.payload.status
      request.reviewedAt = new Date().toISOString()
      request.reviewedBy = action.payload.reviewedBy
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
    requestAccountDeletion: {
      reducer(state, action) {
        const existing = state.deletionRequests.find(
          (item) => item.userId === action.payload.userId && item.status === 'requested',
        )
        if (!existing) state.deletionRequests.unshift(action.payload)
      },
      prepare({ userId }) {
        return {
          payload: {
            id: createId('DEL'),
            userId,
            status: 'requested',
            createdAt: new Date().toISOString(),
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
  markListingViewed,
  removePersonalDocument,
  requestAccountDeletion,
  removeTransferProfile,
  saveTransferProfile,
  submitVerificationRequest,
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
  hydrateAccountPreferences,
  mergeRemoteAccount,
  setAll,
} = accountSlice.actions
export default accountSlice.reducer
