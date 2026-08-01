import { createSlice } from '@reduxjs/toolkit'
import { createId } from '../../services/createId'
import {
  mergeStatusViewers,
  mergeViewedByLists,
  rememberSeenStatus,
  statusHasBeenViewedBy,
} from './statusViewUtils'

const statusesSlice = createSlice({
  name: 'statuses',
  initialState: { items: [] },
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
            viewers: {},
            createdAt: now,
            expiresAt: values.expiresAt || expiresAt,
          },
        }
      },
    },

    markStatusViewed(state, action) {
      const { statusId, userId, userName, userAvatarUrl } = action.payload
      const status = state.items.find((s) => s.id === statusId)
      if (!status || !userId) return
      if (String(status.authorId) === String(userId)) return

      rememberSeenStatus(userId, statusId)

      const already = statusHasBeenViewedBy(status, userId)
      status.viewedBy = mergeViewedByLists(status.viewedBy, [userId])
      status.viewers ||= {}
      if (already && status.viewers[userId]?.viewedAt) {
        status.viewers[userId] = {
          ...status.viewers[userId],
          name: userName || status.viewers[userId].name || '',
          avatarUrl: userAvatarUrl ?? status.viewers[userId].avatarUrl ?? null,
        }
        return
      }
      status.viewers[userId] = {
        name: userName || '',
        avatarUrl: userAvatarUrl || null,
        viewedAt: status.viewers[userId]?.viewedAt || new Date().toISOString(),
      }
    },

    /** Réactions par image : reactions[imageKey][userId] = emoji. `emoji` falsy retire la réaction. */
    reactToStatus(state, action) {
      const { statusId, imageKey, userId, emoji } = action.payload
      const status = state.items.find((s) => s.id === statusId)
      if (!status || !imageKey) return
      status.reactions ||= {}
      status.reactions[imageKey] ||= {}
      if (emoji) {
        status.reactions[imageKey][userId] = emoji
      } else {
        delete status.reactions[imageKey][userId]
      }
    },

    deleteStatus(state, action) {
      state.items = state.items.filter((s) => s.id !== action.payload)
    },

    /**
     * Retire une seule image d'un statut multi-images (les réactions des images
     * suivantes sont réindexées). Le statut entier est supprimé quand il ne
     * reste plus aucune image.
     */
    removeStatusImage(state, action) {
      const { statusId, imageIndex } = action.payload
      const status = state.items.find((s) => s.id === statusId)
      if (!status) return
      if (!Array.isArray(status.images) || status.images.length <= 1) {
        state.items = state.items.filter((s) => s.id !== statusId)
        return
      }
      status.images.splice(imageIndex, 1)
      if (status.reactions) {
        const nextReactions = {}
        for (const [key, value] of Object.entries(status.reactions)) {
          const [id, indexStr] = key.split(':')
          if (id !== statusId) {
            nextReactions[key] = value
            continue
          }
          const index = Number(indexStr)
          if (index === imageIndex) continue
          const nextIndex = index > imageIndex ? index - 1 : index
          nextReactions[`${id}:${nextIndex}`] = value
        }
        status.reactions = nextReactions
      }
    },

    /** Purge locale des statuts expirés (le serveur les filtre déjà côté RLS). */
    pruneExpiredStatuses(state) {
      const now = Date.now()
      state.items = state.items.filter((s) => new Date(s.expiresAt).getTime() > now)
    },

    receiveRemoteStatus(state, action) {
      const remote = action.payload
      if (!remote?.id) return
      const index = state.items.findIndex((item) => item.id === remote.id)
      if (index === -1) {
        state.items.unshift(remote)
        return
      }
      const local = state.items[index]
      state.items[index] = {
        ...local,
        ...remote,
        viewedBy: mergeViewedByLists(remote.viewedBy, local.viewedBy),
        viewers: mergeStatusViewers(remote.viewers, local.viewers),
        reactions: remote.reactions || local.reactions || {},
      }
    },

    removeRemoteStatus(state, action) {
      state.items = state.items.filter((item) => item.id !== action.payload)
    },
  },
})

export const {
  setAll,
  createStatus,
  markStatusViewed,
  reactToStatus,
  deleteStatus,
  removeStatusImage,
  pruneExpiredStatuses,
  receiveRemoteStatus,
  removeRemoteStatus,
} = statusesSlice.actions

export default statusesSlice.reducer
