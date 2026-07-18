import { createSlice } from '@reduxjs/toolkit'
import { createId } from '../../services/createId'
import { createLocalStorage } from '../../services/createLocalStorage'

const storage = createLocalStorage('moxt-statuses-v1')

const statusesSlice = createSlice({
  name: 'statuses',
  initialState: { items: storage.read() ?? [] },
  reducers: {
    setAll(state, action) {
      Object.assign(state, action.payload)
    },

    createStatus: {
      reducer(state, action) {
        state.items.unshift(action.payload)
      },
      prepare(values) {
        const now = new Date().toISOString()
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        const images = Array.isArray(values.images)
          ? values.images.filter((url) => typeof url === 'string' && url).slice(0, 4)
          : []
        return {
          payload: {
            ...values,
            images,
            id: values.id || createId('STA'),
            caption: values.caption || '',
            isOfficial: values.isOfficial === true,
            viewedBy: [],
            createdAt: now,
            expiresAt: values.expiresAt || expiresAt,
          },
        }
      },
    },

    markStatusViewed(state, action) {
      const { statusId, userId, userName, userAvatarUrl } = action.payload
      const status = state.items.find((s) => s.id === statusId)
      if (!status) return
      status.viewedBy ||= []
      if (!status.viewedBy.includes(userId)) status.viewedBy.push(userId)
      status.viewers ||= {}
      status.viewers[userId] = {
        name: userName || '',
        avatarUrl: userAvatarUrl || null,
        viewedAt: new Date().toISOString(),
      }
    },

    reactToStatus(state, action) {
      const { statusId, userId, emoji } = action.payload
      const status = state.items.find((s) => s.id === statusId)
      if (!status) return
      status.reactions ||= {}
      status.reactions[userId] = emoji
    },

    deleteStatus(state, action) {
      state.items = state.items.filter((s) => s.id !== action.payload)
    },

    /** Purge locale des statuts expirés (le serveur les filtre déjà côté RLS). */
    pruneExpiredStatuses(state) {
      const now = Date.now()
      state.items = state.items.filter((s) => new Date(s.expiresAt).getTime() > now)
    },
  },
})

export const {
  setAll,
  createStatus,
  markStatusViewed,
  reactToStatus,
  deleteStatus,
  pruneExpiredStatuses,
} = statusesSlice.actions

export default statusesSlice.reducer
