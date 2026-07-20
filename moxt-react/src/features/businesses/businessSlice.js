import { createSlice } from '@reduxjs/toolkit'
import { createId } from '../../services/createId'
import { createLocalStorage } from '../../services/createLocalStorage'
import { matchUserId } from './businessVisibility'
const storage = createLocalStorage('moxt-businesses-v1')
const membersStorage = createLocalStorage('moxt-business-members-v1')
const documentsStorage = createLocalStorage('moxt-business-documents-v1')
const requestsStorage = createLocalStorage('moxt-business-requests-v1')

function normalizeTransferAccount(account = {}, originCountry = 'BJ') {
  const country = account.country || 'RU'
  const slot = account.slot || (country === 'RU' ? 'ru' : 'origin')
  return {
    id: account.id || createId('BACC'),
    slot,
    country: slot === 'ru' ? 'RU' : originCountry,
    label: account.label?.trim() || account.method || 'Compte de reception',
    method: account.method?.trim() || '',
    recipientName: account.recipientName?.trim() || '',
    phone: account.phone?.trim() || '',
    accountNumber: account.accountNumber?.trim() || '',
    bankName: account.bankName?.trim() || '',
    instructions: account.instructions?.trim() || '',
    active: account.active !== false,
    isDefault: account.isDefault === true,
    updatedAt: new Date().toISOString(),
  }
}

const businessSlice = createSlice({
  name: 'businesses',
  initialState: {
    items: storage.read(),
    members: membersStorage.read(),
    documents: documentsStorage.read(),
    requests: requestsStorage.read(),
  },
  reducers: {
    setAll(state, action) {
      const { items, members, documents, requests } = action.payload
      if (items !== undefined) state.items = items
      if (members !== undefined) state.members = members
      if (documents !== undefined) state.documents = documents
      if (requests !== undefined) state.requests = requests
    },
    saveBusiness: {
      reducer(state, action) {
        const index = state.items.findIndex((item) => matchUserId(item.ownerId, action.payload.ownerId))
        if (index >= 0) state.items[index] = action.payload
        else state.items.unshift(action.payload)
      },
      prepare(values) {
        const now = new Date().toISOString()
        const primaryActivity = values.primaryActivity || values.sector || 'services'
        return {
          payload: {
            id: values.id || createId('BIZ'),
            ownerId: values.ownerId != null ? String(values.ownerId) : values.ownerId,
            name: values.name.trim(),
            logoUrl: values.logoUrl?.trim() || '',
            bannerUrl: values.bannerUrl?.trim() || '',
            primaryActivity,
            secondaryActivity: values.secondaryActivity || '',
            sector: values.sector?.trim() || primaryActivity,
            country: 'RU',
            city: values.city?.trim() || 'Moscou',
            address: values.address?.trim() || '',
            phone: values.phone.trim(),
            originPhone: values.originPhone?.trim() || '',
            email: values.email?.trim() || '',
            telegram: values.telegram?.trim() || '',
            description: values.description.trim(),
            website: values.website?.trim() || '',
            hours: values.hours?.trim() || values.scheduleSummary || '',
            scheduleType: values.scheduleType || 'weekdays',
            schedule: values.schedule || [],
            scheduleSummary: values.scheduleSummary || values.hours?.trim() || '',
            serviceZones: values.serviceZones?.trim() || '',
            feePercent: values.services?.includes('Transfert') ? Number(values.feePercent) : 0,
            rateReductionToRu: values.services?.includes('Transfert')
              ? Math.min(15, Math.max(0, Number(values.rateReductionToRu) || 0))
              : 0,
            rateReductionFromRu: values.services?.includes('Transfert')
              ? Math.min(15, Math.max(0, Number(values.rateReductionFromRu) || 0))
              : 0,
            averageDelay: values.services?.includes('Transfert') ? values.averageDelay.trim() : '',
            currencies: values.services?.includes('Transfert') ? values.currencies || [] : [],
            exchangeMethods: values.services?.includes('Transfert')
              ? values.exchangeMethods || []
              : [],
            transferAccounts: values.services?.includes('Transfert')
              ? (values.transferAccounts || []).map(normalizeTransferAccount)
              : [],
            services: values.services || [],
            status: values.status || 'pending_review',
            activityVisibility: values.activityVisibility || 'public',
            rating: values.rating || 0,
            deletedByUserAt: null,
            createdAt: values.createdAt || now,
            updatedAt: now,
          },
        }
      },
    },
    deleteBusinessByUser(state, action) {
      const business = state.items.find(
        (item) =>
          item.id === action.payload.id && matchUserId(item.ownerId, action.payload.ownerId),
      )
      if (!business) return
      const now = new Date().toISOString()
      business.deletedByUserAt = now
      business.updatedAt = now
    },
    moderateBusiness(state, action) {
      const business = state.items.find((item) => item.id === action.payload.id)
      if (!business) return
      business.status = action.payload.status
      business.updatedAt = new Date().toISOString()
    },
    updateBusinessActivityVisibility(state, action) {
      const business = state.items.find(
        (item) =>
          item.id === action.payload.businessId &&
          matchUserId(item.ownerId, action.payload.ownerId),
      )
      if (!business) return
      business.activityVisibility = action.payload.activityVisibility
      business.updatedAt = new Date().toISOString()
    },
    patchBusiness(state, action) {
      const business = state.items.find((item) => item.id === action.payload.id)
      if (!business) return
      Object.assign(business, action.payload.patch)
      if (action.payload.patch.updatedAt) {
        business.updatedAt = action.payload.patch.updatedAt
      }
    },
    updateBusinessTransferAccounts(state, action) {
      const business = state.items.find(
        (item) => item.id === action.payload.businessId && item.ownerId === action.payload.ownerId,
      )
      if (!business || !business.services?.includes('Transfert')) return
      business.transferAccounts = (action.payload.accounts || []).map((account) =>
        normalizeTransferAccount(account, action.payload.originCountry || 'BJ'),
      )
      business.updatedAt = new Date().toISOString()
    },
    updateBusinessTransferPricing(state, action) {
      const business = state.items.find(
        (item) => item.id === action.payload.businessId && item.ownerId === action.payload.ownerId,
      )
      if (!business || !business.services?.includes('Transfert')) return
      if (action.payload.feePercent != null) {
        business.feePercent = Math.max(0, Number(action.payload.feePercent) || 0)
      }
      if (action.payload.rateReductionToRu != null) {
        business.rateReductionToRu = Math.min(
          15,
          Math.max(0, Number(action.payload.rateReductionToRu) || 0),
        )
      }
      if (action.payload.rateReductionFromRu != null) {
        business.rateReductionFromRu = Math.min(
          15,
          Math.max(0, Number(action.payload.rateReductionFromRu) || 0),
        )
      }
      business.updatedAt = new Date().toISOString()
    },
    addBusinessMember: {
      reducer(state, action) {
        state.members.unshift(action.payload)
      },
      prepare(values) {
        return {
          payload: {
            ...values,
            id: createId('MEM'),
            role: values.role || 'editor',
            status: 'active',
            createdAt: new Date().toISOString(),
          },
        }
      },
    },
    updateBusinessMember(state, action) {
      const member = state.members.find(
        (item) => item.id === action.payload.id && item.businessId === action.payload.businessId,
      )
      if (!member) return
      if (action.payload.role) member.role = action.payload.role
      if (action.payload.status) member.status = action.payload.status
      member.updatedAt = new Date().toISOString()
    },
    removeBusinessMember(state, action) {
      state.members = state.members.filter(
        (item) => item.id !== action.payload.id || item.businessId !== action.payload.businessId,
      )
    },
    addBusinessDocument: {
      reducer(state, action) {
        state.documents.unshift(action.payload)
      },
      prepare(values) {
        return {
          payload: {
            ...values,
            id: createId('BDOC'),
            name: values.name,
            size: Number(values.size) || 0,
            type: values.type || 'application/octet-stream',
            url: values.url || null,
            storagePath: values.storagePath || null,
            status: 'pending_review',
            reviewNote: '',
            reviewedBy: null,
            reviewedAt: null,
            createdAt: new Date().toISOString(),
          },
        }
      },
    },
    updateBusinessDocumentStatus(state, action) {
      const document = state.documents.find((item) => item.id === action.payload.id)
      if (!document) return
      document.status = action.payload.status
      if (action.payload.reviewedBy !== undefined) document.reviewedBy = action.payload.reviewedBy
      if (action.payload.reviewNote !== undefined) {
        document.reviewNote = action.payload.reviewNote || ''
      }
      document.reviewedAt = action.payload.reviewedAt || new Date().toISOString()
      document.updatedAt = new Date().toISOString()
    },
    createBusinessRequest: {
      reducer(state, action) {
        state.requests.unshift(action.payload)
      },
      prepare(values) {
        return {
          payload: {
            ...values,
            id: createId('BREQ'),
            ownerId: values.ownerId,
            businessId: values.businessId,
            relatedType: values.relatedType,
            relatedId: values.relatedId,
            status: 'submitted',
            createdAt: new Date().toISOString(),
            timeline: [
              {
                status: 'submitted',
                at: new Date().toISOString(),
                actorType: 'user',
              },
            ],
          },
        }
      },
    },
    updateBusinessRequestStatus(state, action) {
      const request = state.requests.find(
        (item) => item.id === action.payload.id && item.businessId === action.payload.businessId,
      )
      if (!request) return
      request.status = action.payload.status
      request.updatedAt = new Date().toISOString()
      request.timeline ||= [{ status: 'submitted', at: request.createdAt, actorType: 'user' }]
      if (!request.timeline.some((event) => event.status === action.payload.status)) {
        request.timeline.push({
          status: action.payload.status,
          at: request.updatedAt,
          actorType: 'business',
          actorId: action.payload.actorId || null,
        })
      }
    },
  },
})

export const {
  addBusinessDocument,
  addBusinessMember,
  createBusinessRequest,
  deleteBusinessByUser,
  moderateBusiness,
  patchBusiness,
  removeBusinessMember,
  saveBusiness,
  updateBusinessActivityVisibility,
  updateBusinessDocumentStatus,
  updateBusinessMember,
  updateBusinessRequestStatus,
  updateBusinessTransferAccounts,
  updateBusinessTransferPricing,
  setAll,
} = businessSlice.actions
export default businessSlice.reducer
