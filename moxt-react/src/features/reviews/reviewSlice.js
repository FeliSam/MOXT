import { createSlice } from '@reduxjs/toolkit'
import { createId } from '../../services/createId'
import { createLocalStorage } from '../../services/createLocalStorage'
import { mergeRemoteById } from '@moxt/shared/utils/mergeRemoteById.js'
import { REVIEW_DISPUTE_STATUS } from '@moxt/shared/utils/reviewUtils.js'

const storage = createLocalStorage('moxt-reviews-v1')
const MAX_TOMBSTONES = 500

function reviewIdentityKey(review) {
  if (!review?.authorId || !review?.targetType || !review?.targetId) return null
  return `${review.authorId}:${review.targetType}:${review.targetId}`
}

function readPersistedReviewsState() {
  const raw = storage.read(null)
  if (Array.isArray(raw)) {
    return { items: raw, deletedIds: [], deletedKeys: [] }
  }
  if (raw && typeof raw === 'object') {
    return {
      items: Array.isArray(raw.items) ? raw.items : [],
      deletedIds: Array.isArray(raw.deletedIds) ? raw.deletedIds : [],
      deletedKeys: Array.isArray(raw.deletedKeys) ? raw.deletedKeys : [],
    }
  }
  return { items: [], deletedIds: [], deletedKeys: [] }
}

function pushTombstone(list, value) {
  if (!value || list.includes(value)) return
  list.push(value)
  if (list.length > MAX_TOMBSTONES) {
    list.splice(0, list.length - MAX_TOMBSTONES)
  }
}

function applyDeletedFilters(items, deletedIds, deletedKeys) {
  const idSet = new Set(deletedIds)
  const keySet = new Set(deletedKeys)
  return (items || []).filter((item) => {
    if (!item?.id) return false
    if (idSet.has(item.id)) return false
    const key = reviewIdentityKey(item)
    if (key && keySet.has(key)) return false
    return true
  })
}

function clearReviewTombstones(state, review) {
  if (!review) return
  state.deletedIds = state.deletedIds.filter((id) => id !== review.id)
  const key = reviewIdentityKey(review)
  if (key) {
    state.deletedKeys = state.deletedKeys.filter((entry) => entry !== key)
  }
}

function findReviewIndex(items, { authorId, targetType, targetId }) {
  return items.findIndex(
    (item) =>
      item.authorId === authorId &&
      item.targetType === targetType &&
      item.targetId === targetId,
  )
}

const reviewSlice = createSlice({
  name: 'reviews',
  initialState: readPersistedReviewsState(),
  reducers: {
    setAll(state, action) {
      if (action.payload.items) {
        const filteredLocal = applyDeletedFilters(
          state.items,
          state.deletedIds,
          state.deletedKeys,
        )
        const filteredRemote = applyDeletedFilters(
          action.payload.items,
          state.deletedIds,
          state.deletedKeys,
        )
        state.items = mergeRemoteById(filteredLocal, filteredRemote)
      }
    },
    createReview: {
      reducer(state, action) {
        clearReviewTombstones(state, action.payload)
        const index = findReviewIndex(state.items, action.payload)
        if (index >= 0) {
          state.items[index] = {
            ...state.items[index],
            ...action.payload,
            id: state.items[index].id,
            updatedAt: action.payload.updatedAt,
          }
        } else {
          state.items.unshift(action.payload)
        }
      },
      prepare(values) {
        const now = new Date().toISOString()
        return {
          payload: {
            id: values.id || createId('REV'),
            targetType: values.targetType,
            targetId: values.targetId,
            authorId: values.authorId,
            authorName: values.authorName,
            rating: Math.min(5, Math.max(1, Number(values.rating))),
            comment: values.comment.trim(),
            status: values.status || 'published',
            replyText: values.replyText || '',
            replyAt: values.replyAt || null,
            replyBy: values.replyBy || null,
            disputeStatus: values.disputeStatus || REVIEW_DISPUTE_STATUS.NONE,
            disputeReason: values.disputeReason || '',
            disputedAt: values.disputedAt || null,
            createdAt: values.createdAt || now,
            updatedAt: now,
          },
        }
      },
    },
    replyToReview(state, action) {
      const review = state.items.find((item) => item.id === action.payload.id)
      if (!review) return
      review.replyText = action.payload.replyText.trim()
      review.replyAt = action.payload.replyAt
      review.replyBy = action.payload.replyBy
      review.updatedAt = action.payload.replyAt
    },
    contestReview(state, action) {
      const review = state.items.find((item) => item.id === action.payload.id)
      if (!review) return
      review.disputeStatus = REVIEW_DISPUTE_STATUS.PENDING
      review.disputeReason = action.payload.disputeReason.trim()
      review.disputedAt = action.payload.disputedAt
      review.updatedAt = action.payload.disputedAt
    },
    moderateReview(state, action) {
      const review = state.items.find((item) => item.id === action.payload.id)
      if (!review) return
      review.status = action.payload.status
      review.moderatedAt = new Date().toISOString()
      review.moderatedBy = action.payload.moderatedBy
      if (action.payload.disputeStatus) {
        review.disputeStatus = action.payload.disputeStatus
      }
      review.updatedAt = review.moderatedAt
    },
    deleteReview(state, action) {
      const review = state.items.find((item) => item.id === action.payload)
      state.items = state.items.filter((item) => item.id !== action.payload)
      pushTombstone(state.deletedIds, action.payload)
      const key = reviewIdentityKey(review)
      if (key) pushTombstone(state.deletedKeys, key)
    },
    restoreReviewDeleted(state, action) {
      const review = action.payload?.review
      if (!review?.id) return
      clearReviewTombstones(state, review)
      const index = findReviewIndex(state.items, review)
      if (index >= 0) {
        state.items[index] = { ...state.items[index], ...review }
      } else {
        state.items.unshift(review)
      }
    },
    reconcileReviewId(state, action) {
      const { localId, remoteId } = action.payload || {}
      if (!localId || !remoteId || localId === remoteId) return
      if (state.deletedIds.includes(localId)) {
        state.deletedIds = state.deletedIds.map((id) => (id === localId ? remoteId : id))
      }
      const index = state.items.findIndex((item) => item.id === localId)
      if (index < 0) return
      const duplicate = state.items.findIndex((item) => item.id === remoteId)
      if (duplicate >= 0 && duplicate !== index) {
        state.items.splice(index, 1)
        return
      }
      state.items[index].id = remoteId
    },
  },
})

export const {
  createReview,
  replyToReview,
  contestReview,
  moderateReview,
  deleteReview,
  restoreReviewDeleted,
  setAll,
} = reviewSlice.actions
export default reviewSlice.reducer
