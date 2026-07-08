import { createSlice } from '@reduxjs/toolkit'
import { createId } from '../../services/createId'
import { createLocalStorage } from '../../services/createLocalStorage'
import { mergeRemoteById } from '@moxt/shared/utils/mergeRemoteById.js'
import { REVIEW_DISPUTE_STATUS } from '@moxt/shared/utils/reviewUtils.js'

const storage = createLocalStorage('moxt-reviews-v1')

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
  initialState: { items: storage.read() },
  reducers: {
    setAll(state, action) {
      if (action.payload.items) {
        state.items = mergeRemoteById(state.items, action.payload.items)
      }
    },
    createReview: {
      reducer(state, action) {
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
  },
})

export const { createReview, replyToReview, contestReview, moderateReview, setAll } =
  reviewSlice.actions
export default reviewSlice.reducer
