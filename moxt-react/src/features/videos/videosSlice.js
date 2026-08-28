import { createSlice } from '@reduxjs/toolkit'
import { createId } from '../../services/createId'
import { createLocalStorage } from '../../services/createLocalStorage'
import { mergeRemoteById } from '@moxt/shared/utils/mergeRemoteById.js'

const videosStorage = createLocalStorage('moxt-videos-v1')

function asIdArray(value) {
  if (Array.isArray(value)) return value.map(String).filter(Boolean)
  return []
}

function asCommentArray(value) {
  if (!Array.isArray(value)) return []
  return value
    .filter((item) => item && typeof item === 'object')
    .map((item) => ({
      id: item.id || createId('CMT'),
      authorId: item.authorId || item.author_id || '',
      authorName: item.authorName || item.author_name || '',
      authorAvatarUrl: item.authorAvatarUrl || item.author_avatar_url || '',
      text: String(item.text || '').trim(),
      createdAt: item.createdAt || item.created_at || new Date().toISOString(),
    }))
    .filter((item) => item.text)
}

function normalizeVideo(video) {
  if (!video || typeof video !== 'object') return video
  return {
    ...video,
    likes: asIdArray(video.likes),
    comments: asCommentArray(video.comments),
    shareCount: Number(video.shareCount) || 0,
    viewCount: Number(video.viewCount) || 0,
  }
}

const videosSlice = createSlice({
  name: 'videos',
  initialState: {
    items: (videosStorage.read() || []).map(normalizeVideo),
  },
  reducers: {
    setAll(state, action) {
      const { items } = action.payload || {}
      if (items) {
        state.items = mergeRemoteById(state.items, items.map(normalizeVideo))
      }
    },
    createVideo: {
      reducer(state, action) {
        state.items.unshift(normalizeVideo(action.payload))
      },
      prepare(values) {
        const now = new Date().toISOString()
        return {
          payload: {
            ...values,
            id: values.id || `VID-${Date.now().toString(36).toUpperCase()}`,
            title: values.title || '',
            caption: values.caption || '',
            videoUrl: values.videoUrl || '',
            thumbnailUrl: values.thumbnailUrl || '',
            objectKey: values.objectKey || '',
            durationMs: Number(values.durationMs) || 0,
            viewCount: Number(values.viewCount) || 0,
            shareCount: Number(values.shareCount) || 0,
            likes: asIdArray(values.likes),
            comments: asCommentArray(values.comments),
            status: values.status || 'active',
            createdAt: values.createdAt || now,
            updatedAt: values.updatedAt || now,
          },
        }
      },
    },
    updateVideo(state, action) {
      const video = state.items.find((item) => item.id === action.payload.id)
      if (!video || video.ownerId !== action.payload.ownerId) return
      const { id: _id, ownerId: _o, createdAt: _c, ...changes } = action.payload
      Object.assign(video, changes, { updatedAt: new Date().toISOString() })
      Object.assign(video, normalizeVideo(video))
    },
    duplicateVideo: {
      reducer(state, action) {
        state.items.unshift(normalizeVideo(action.payload))
      },
      prepare({ video, ownerId }) {
        const now = new Date().toISOString()
        const baseTitle = String(video?.title || '').trim()
        return {
          payload: {
            ...video,
            id: `VID-${Date.now().toString(36).toUpperCase()}`,
            ownerId,
            title: baseTitle ? `Copie de ${baseTitle}` : 'Copie',
            status: 'active',
            viewCount: 0,
            shareCount: 0,
            likes: [],
            comments: [],
            createdAt: now,
            updatedAt: now,
          },
        }
      },
    },
    moderateVideo(state, action) {
      const video = state.items.find((item) => item.id === action.payload.id)
      if (!video) return
      video.status = action.payload.status
      video.updatedAt = new Date().toISOString()
    },
    deleteVideo(state, action) {
      const video = state.items.find((item) => item.id === action.payload.id)
      if (!video || video.ownerId !== action.payload.ownerId) return
      state.items = state.items.filter((item) => item.id !== action.payload.id)
    },
    incrementVideoView(state, action) {
      const video = state.items.find((item) => item.id === action.payload.id)
      if (!video) return
      video.viewCount = (Number(video.viewCount) || 0) + 1
    },
    toggleVideoLike(state, action) {
      const { videoId, userId } = action.payload
      const video = state.items.find((item) => item.id === videoId)
      if (!video || !userId) return
      if (!Array.isArray(video.likes)) video.likes = []
      const idx = video.likes.indexOf(userId)
      if (idx === -1) video.likes.push(userId)
      else video.likes.splice(idx, 1)
      video.updatedAt = new Date().toISOString()
    },
    addVideoComment: {
      reducer(state, action) {
        const video = state.items.find((item) => item.id === action.payload.videoId)
        if (!video) return
        if (!Array.isArray(video.comments)) video.comments = []
        video.comments.push(action.payload.comment)
        video.updatedAt = new Date().toISOString()
      },
      prepare({ videoId, authorId, authorName, authorAvatarUrl, text }) {
        return {
          payload: {
            videoId,
            comment: {
              id: createId('CMT'),
              authorId,
              authorName,
              authorAvatarUrl: authorAvatarUrl || '',
              text: String(text || '').trim(),
              createdAt: new Date().toISOString(),
            },
          },
        }
      },
    },
    deleteVideoComment(state, action) {
      const { videoId, commentId } = action.payload
      const video = state.items.find((item) => item.id === videoId)
      if (!video || !commentId) return
      video.comments = (video.comments || []).filter((c) => c.id !== commentId)
      video.updatedAt = new Date().toISOString()
    },
    incrementVideoShare(state, action) {
      const video = state.items.find((item) => item.id === action.payload.id)
      if (!video) return
      video.shareCount = (Number(video.shareCount) || 0) + 1
    },
  },
})

export const {
  setAll,
  createVideo,
  updateVideo,
  duplicateVideo,
  moderateVideo,
  deleteVideo,
  incrementVideoView,
  toggleVideoLike,
  addVideoComment,
  deleteVideoComment,
  incrementVideoShare,
} = videosSlice.actions

export default videosSlice.reducer
