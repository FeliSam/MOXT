import { createSlice } from '@reduxjs/toolkit'
import { createId } from '../../services/createId'
import { createLocalStorage } from '../../services/createLocalStorage'

const storage = createLocalStorage('moxt-account-v1')

const defaultPreferences = {
  language: 'fr',
  emailNotifications: true,
  pushNotifications: true,
  activityVisibility: 'private',
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
  messageSuggestionsEnabled: true,
}

const initialState = storage.read({
  favorites: [],
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
            createdAt: new Date().toISOString(),
          },
        }
      },
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
            status: 'pending_review',
            createdAt: new Date().toISOString(),
          },
        }
      },
    },
    removePersonalDocument(state, action) {
      state.documents = state.documents.filter(
        (item) => item.id !== action.payload.id || item.userId !== action.payload.userId,
      )
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
      state.preferences[action.payload.userId] = {
        ...defaultPreferences,
        ...state.preferences[action.payload.userId],
        ...action.payload.preferences,
      }
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
            simulation: true,
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
  updateAccountPreferences,
  updateVerificationStatus,
  setAll,
} = accountSlice.actions
export default accountSlice.reducer
