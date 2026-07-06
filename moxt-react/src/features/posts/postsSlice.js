import { createSlice } from '@reduxjs/toolkit'
import { createId } from '../../services/createId'
import { createLocalStorage } from '../../services/createLocalStorage'

const storage = createLocalStorage('moxt-posts-v1')

const postsSlice = createSlice({
  name: 'posts',
  initialState: { items: storage.read() ?? [] },
  reducers: {
    setAll(state, action) {
      Object.assign(state, action.payload)
    },

    createPost: {
      reducer(state, action) {
        state.items.unshift(action.payload)
      },
      prepare(values) {
        const now = new Date().toISOString()
        return {
          payload: {
            ...values,
            id: createId('POST'),
            likes: [],
            comments: [],
            status: 'published',
            lastSharedAt: now,
            createdAt: now,
            updatedAt: now,
          },
        }
      },
    },

    updatePost(state, action) {
      const post = state.items.find((p) => p.id === action.payload.id)
      if (!post) return
      Object.assign(post, action.payload, { updatedAt: new Date().toISOString() })
    },

    deletePost(state, action) {
      state.items = state.items.filter((p) => p.id !== action.payload)
    },

    toggleLike(state, action) {
      const { postId, userId } = action.payload
      const post = state.items.find((p) => p.id === postId)
      if (!post) return
      const idx = post.likes.indexOf(userId)
      if (idx === -1) post.likes.push(userId)
      else post.likes.splice(idx, 1)
      post.updatedAt = new Date().toISOString()
    },

    addComment: {
      reducer(state, action) {
        const post = state.items.find((p) => p.id === action.payload.postId)
        if (!post) return
        post.comments.push(action.payload.comment)
        post.updatedAt = new Date().toISOString()
      },
      prepare({ postId, authorId, authorName, authorAvatarUrl, text }) {
        return {
          payload: {
            postId,
            comment: {
              id: createId('CMT'),
              authorId,
              authorName,
              authorAvatarUrl,
              text,
              createdAt: new Date().toISOString(),
            },
          },
        }
      },
    },

    deleteComment(state, action) {
      const { postId, commentId } = action.payload
      const post = state.items.find((p) => p.id === postId)
      if (!post) return
      post.comments = post.comments.filter((c) => c.id !== commentId)
      post.updatedAt = new Date().toISOString()
    },
  },
})

export const {
  setAll,
  createPost,
  updatePost,
  deletePost,
  toggleLike,
  addComment,
  deleteComment,
} = postsSlice.actions

export default postsSlice.reducer
