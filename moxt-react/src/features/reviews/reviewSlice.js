import { createSlice } from '@reduxjs/toolkit'
import { createId } from '../../services/createId'
import { createLocalStorage } from '../../services/createLocalStorage'
import { mergeRemoteById } from '@moxt/shared/utils/mergeRemoteById.js'

const storage = createLocalStorage('moxt-reviews-v1')

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
        const duplicate = state.items.find(
          (item) =>
            item.authorId === action.payload.authorId &&
            item.targetType === action.payload.targetType &&
            item.targetId === action.payload.targetId,
        )
        if (duplicate) Object.assign(duplicate, action.payload, { id: duplicate.id })
        else state.items.unshift(action.payload)
      },
      prepare(values) {
        return {
          payload: {
            id: createId('REV'),
            targetType: values.targetType,
            targetId: values.targetId,
            authorId: values.authorId,
            authorName: values.authorName,
            rating: Math.min(5, Math.max(1, Number(values.rating))),
            comment: values.comment.trim(),
            status: 'published',
            createdAt: new Date().toISOString(),
          },
        }
      },
    },
    moderateReview(state, action) {
      const review = state.items.find((item) => item.id === action.payload.id)
      if (!review) return
      review.status = action.payload.status
      review.moderatedAt = new Date().toISOString()
      review.moderatedBy = action.payload.moderatedBy
    },
  },
})

export const { createReview, moderateReview, setAll } = reviewSlice.actions
export default reviewSlice.reducer
