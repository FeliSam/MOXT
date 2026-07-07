import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { ensurePhoneCountry } from '../../config/phone'
import { sanitizeListingByType } from '../../config/listingConfig'
import { createLocalStorage } from '../../services/createLocalStorage'
import { storageService } from '../../services/storageService'
import { saveListingRemote } from './marketplaceRemote'

const storage = createLocalStorage('moxt-listings-v1')
const reportsStorage = createLocalStorage('moxt-listing-reports-v1')
const filtersStorage = createLocalStorage('moxt-marketplace-filters-v1')
const draftStorage = createLocalStorage('moxt-listing-draft-v1')

const demoListingImages = {
  'ANN-DEMO-1': [
    '/assets/marketplace/smartphone.svg',
    '/assets/marketplace/web-design.svg',
    '/assets/marketplace/russian-course.svg',
  ],
  'ANN-DEMO-2': [
    '/assets/marketplace/russian-course.svg',
    '/assets/marketplace/travel-documents.svg',
    '/assets/marketplace/web-design.svg',
  ],
  'ANN-DEMO-3': [
    '/assets/marketplace/studio-apartment.svg',
    '/assets/marketplace/urban-motorcycle.svg',
    '/assets/marketplace/benin-food.svg',
  ],
  'ANN-DEMO-4': [
    '/assets/marketplace/web-design.svg',
    '/assets/marketplace/smartphone.svg',
    '/assets/marketplace/russian-course.svg',
  ],
  'ANN-DEMO-5': [
    '/assets/marketplace/benin-food.svg',
    '/assets/marketplace/travel-documents.svg',
    '/assets/marketplace/studio-apartment.svg',
  ],
  'ANN-DEMO-6': [
    '/assets/marketplace/urban-motorcycle.svg',
    '/assets/marketplace/smartphone.svg',
    '/assets/marketplace/web-design.svg',
  ],
  'ANN-DEMO-7': [
    '/assets/marketplace/travel-documents.svg',
    '/assets/marketplace/russian-course.svg',
    '/assets/marketplace/benin-food.svg',
  ],
}

export const normalizeListing = (listing) => {
  const normalized = sanitizeListingByType(listing)
  return {
    ...normalized,
    country: listing.country || 'RU',
    currency: listing.currency || 'RUB',
    city: listing.city || 'Moscou',
    address:
      listing.address || `${listing.district || 'Centre'}, ${listing.city || 'Moscou'}, Russie`,
    contact: ensurePhoneCountry(listing.contact, 'RU'),
    whatsapp: listing.whatsapp ? ensurePhoneCountry(listing.whatsapp, 'RU') : '',
    originalPrice: listing.originalPrice ? Number(listing.originalPrice) : null,
    discountPercent: listing.discountPercent ? Number(listing.discountPercent) : null,
    views: Number(listing.views || 0),
    contactCount: Number(listing.contactCount || 0),
    shareCount: Number(listing.shareCount || 0),
    favorites: Array.isArray(listing.favorites) ? listing.favorites : [],
    images:
      Array.isArray(listing.images) && listing.images.length
        ? listing.images
        : demoListingImages[listing.id]
          ? demoListingImages[listing.id]
          : [],
    deliveryOptions: Array.isArray(listing.deliveryOptions) ? listing.deliveryOptions : ['pickup'],
    paymentMethods: Array.isArray(listing.paymentMethods)
      ? listing.paymentMethods
      : ['À convenir dans la messagerie'],
    questions: Array.isArray(listing.questions) ? listing.questions : [],
    history: Array.isArray(listing.history) ? listing.history : [],
    condition: normalized.condition,
    stock: normalized.stock,
  }
}

const marketplaceSlice = createSlice({
  name: 'marketplace',
  initialState: {
    items: storage.read().map(normalizeListing),
    reports: reportsStorage.read(),
    filters: filtersStorage.read({ query: '', type: '', category: '', city: '', min: '', max: '' }),
    draft: draftStorage.read(null),
  },
  reducers: {
    setAll(state, action) {
      Object.assign(state, action.payload)
    },
    createListing: {
      reducer(state, action) {
        state.items.unshift(action.payload)
      },
      prepare(values) {
        const now = new Date().toISOString()
        const sanitizedValues = sanitizeListingByType(values)
        const expiresAt =
          values.expiresAt ||
          new Date(new Date(now).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
        return {
          payload: {
            ...sanitizedValues,
            id: `ANN-${Date.now().toString(36).toUpperCase()}`,
            price: Number(values.price),
            currency: 'RUB',
            country: 'RU',
            city: values.city || 'Moscou',
            address: values.address,
            contact: ensurePhoneCountry(values.contact, 'RU'),
            whatsapp: values.whatsapp ? ensurePhoneCountry(values.whatsapp, 'RU') : '',
            status: values.status || 'active',
            views: 0,
            contactCount: 0,
            shareCount: 0,
            favorites: [],
            images: values.images || [],
            condition: sanitizedValues.condition,
            brand: sanitizedValues.brand,
            model: sanitizedValues.model,
            color: values.color || '',
            stock: sanitizedValues.stock,
            deliveryOptions: sanitizedValues.deliveryOptions,
            deliveryFee: Number(values.deliveryFee || 0),
            deliveryDelay: values.deliveryDelay || 'À confirmer',
            warranty: values.warranty || 'Aucune garantie annoncée',
            returnPolicy: values.returnPolicy || 'À convenir avec le vendeur',
            paymentMethods: values.paymentMethods || ['À convenir dans la messagerie'],
            originalPrice: values.hasDiscount && values.originalPrice ? Number(values.originalPrice) : null,
            discountPercent: values.hasDiscount && values.discountPercent ? Number(values.discountPercent) : null,
            questions: [],
            history: [{ status: values.status || 'active', at: now, actorId: values.ownerId }],
            createdAt: now,
            updatedAt: now,
            expiresAt,
          },
        }
      },
    },
    receiveRemoteListing(state, action) {
      const listing = normalizeListing(action.payload)
      const index = state.items.findIndex((item) => item.id === listing.id)
      if (index === -1) state.items.unshift(listing)
      else state.items[index] = listing
    },
    removeRemoteListing(state, action) {
      state.items = state.items.filter((item) => item.id !== action.payload)
    },
    duplicateListing: {
      reducer(state, action) {
        state.items.unshift(action.payload)
      },
      prepare({ listing, ownerId }) {
        const now = new Date().toISOString()
        return {
          payload: {
            ...listing,
            id: `ANN-${Date.now().toString(36).toUpperCase()}`,
            ownerId,
            title: `Copie de ${listing.title}`,
            status: 'draft',
            views: 0,
            contactCount: 0,
            shareCount: 0,
            favorites: [],
            questions: [],
            history: [{ status: 'draft', at: now, actorId: ownerId }],
            createdAt: now,
            updatedAt: now,
          },
        }
      },
    },
    updateListing(state, action) {
      const listing = state.items.find((item) => item.id === action.payload.id)
      if (!listing || listing.ownerId !== action.payload.ownerId) return
      const protectedFields = {
        id: listing.id,
        ownerId: listing.ownerId,
        businessId: listing.businessId,
        createdAt: listing.createdAt,
        history: listing.history,
        favorites: listing.favorites,
        views: listing.views,
      }
      const sanitizedChanges = sanitizeListingByType({
        ...listing,
        ...action.payload.changes,
      })
      Object.assign(listing, sanitizedChanges, protectedFields, {
        price: Number(sanitizedChanges.price),
        currency: 'RUB',
        country: 'RU',
        city: sanitizedChanges.city || 'Moscou',
        address: sanitizedChanges.address,
        contact: ensurePhoneCountry(sanitizedChanges.contact, 'RU'),
        whatsapp: sanitizedChanges.whatsapp
          ? ensurePhoneCountry(sanitizedChanges.whatsapp, 'RU')
          : '',
        updatedAt: new Date().toISOString(),
      })
    },
    deleteListing(state, action) {
      const listing = state.items.find((item) => item.id === action.payload.id)
      if (!listing || listing.ownerId !== action.payload.ownerId) return
      state.items = state.items.filter((item) => item.id !== action.payload.id)
      state.reports = state.reports.filter((report) => report.listingId !== action.payload.id)
    },
    incrementListingView(state, action) {
      const listing = state.items.find((item) => item.id === action.payload)
      if (!listing) return
      listing.views = Number(listing.views || 0) + 1
    },
    incrementListingContact(state, action) {
      const listing = state.items.find((item) => item.id === action.payload)
      if (listing) listing.contactCount = Number(listing.contactCount || 0) + 1
    },
    incrementListingShare(state, action) {
      const listing = state.items.find((item) => item.id === action.payload)
      if (listing) listing.shareCount = Number(listing.shareCount || 0) + 1
    },
    addListingQuestion: {
      reducer(state, action) {
        const listing = state.items.find((item) => item.id === action.payload.listingId)
        if (!listing) return
        listing.questions ||= []
        listing.questions.unshift(action.payload.question)
        listing.updatedAt = action.payload.question.createdAt
      },
      prepare({ authorId, authorName, listingId, text }) {
        const now = new Date().toISOString()
        return {
          payload: {
            listingId,
            question: {
              id: `QUE-${Date.now().toString(36).toUpperCase()}`,
              listingId,
              authorId,
              authorName,
              text: text.trim(),
              answer: '',
              answeredAt: null,
              createdAt: now,
            },
          },
        }
      },
    },
    answerListingQuestion: {
      reducer(state, action) {
        const listing = state.items.find((item) => item.id === action.payload.listingId)
        if (!listing || listing.ownerId !== action.payload.ownerId) return
        const question = listing.questions?.find((item) => item.id === action.payload.questionId)
        if (!question || question.answer) return
        question.answer = action.payload.answer.trim()
        question.answeredAt = action.payload.answeredAt
        listing.updatedAt = action.payload.answeredAt
      },
      prepare({ answer, listingId, ownerId, questionId }) {
        const answeredAt = new Date().toISOString()
        return {
          payload: {
            listingId,
            questionId,
            ownerId,
            answer,
            answeredAt,
          },
        }
      },
    },
    toggleListingFavorite(state, action) {
      const listing = state.items.find((item) => item.id === action.payload.listingId)
      if (!listing) return
      listing.favorites ||= []
      listing.favorites = listing.favorites.includes(action.payload.userId)
        ? listing.favorites.filter((id) => id !== action.payload.userId)
        : [...listing.favorites, action.payload.userId]
    },
    updateListingStatus(state, action) {
      const listing = state.items.find((item) => item.id === action.payload.id)
      if (!listing) return
      listing.status = action.payload.status
      listing.updatedAt = new Date().toISOString()
      listing.history ||= []
      listing.history.push({
        status: action.payload.status,
        at: listing.updatedAt,
        actorId: action.payload.actorId,
      })
      if (action.payload.status === 'active') {
        listing.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      }
    },
    expireListings(state, action) {
      const now = new Date(action.payload || Date.now())
      state.items.forEach((listing) => {
        if (
          listing.status === 'active' &&
          listing.expiresAt &&
          new Date(listing.expiresAt) <= now
        ) {
          listing.status = 'expired'
          listing.updatedAt = now.toISOString()
          listing.history ||= []
          listing.history.push({ status: 'expired', at: listing.updatedAt, actorId: 'system' })
        }
      })
    },
    reportListing: {
      reducer(state, action) {
        const duplicate = state.reports.some(
          (report) =>
            report.listingId === action.payload.listingId &&
            report.reporterId === action.payload.reporterId &&
            report.status === 'new',
        )
        if (!duplicate) state.reports.unshift(action.payload)
      },
      prepare({ listingId, reason, reporterId }) {
        return {
          payload: {
            id: `REP-${Date.now().toString(36).toUpperCase()}`,
            listingId,
            reporterId,
            reason,
            status: 'new',
            createdAt: new Date().toISOString(),
          },
        }
      },
    },
    updateListingReportStatus(state, action) {
      const report = state.reports.find((item) => item.id === action.payload.id)
      if (report) report.status = action.payload.status
    },
    setMarketplaceFilters(state, action) {
      state.filters = { ...state.filters, ...action.payload }
    },
    resetMarketplaceFilters(state) {
      state.filters = { query: '', type: '', category: '', city: '', min: '', max: '' }
    },
    saveListingDraft(state, action) {
      state.draft = action.payload
    },
    clearListingDraft(state) {
      state.draft = null
    },
  },
})

export const {
  clearListingDraft,
  createListing,
  deleteListing,
  duplicateListing,
  expireListings,
  addListingQuestion,
  answerListingQuestion,
  incrementListingContact,
  incrementListingShare,
  incrementListingView,
  reportListing,
  resetMarketplaceFilters,
  saveListingDraft,
  setMarketplaceFilters,
  toggleListingFavorite,
  updateListing,
  updateListingReportStatus,
  updateListingStatus,
  receiveRemoteListing,
  removeRemoteListing,
  setAll,
} = marketplaceSlice.actions

export const publishListing = createAsyncThunk(
  'marketplace/publishListing',
  async ({ files = [], values }, { dispatch, rejectWithValue }) => {
    try {
      const prepared = createListing({ ...values, images: [] }).payload
      const images = files.length
        ? await storageService.uploadListingImages(prepared.ownerId, prepared.id, files)
        : values.images || []
      const saved = await saveListingRemote({ ...prepared, images })
      dispatch(receiveRemoteListing(saved))
      return saved
    } catch (error) {
      return rejectWithValue(error.message || "L'annonce n'a pas pu être publiée.")
    }
  },
)

export default marketplaceSlice.reducer
