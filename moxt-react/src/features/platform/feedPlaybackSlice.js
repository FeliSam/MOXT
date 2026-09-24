import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { DEFAULT_FEED_PLAYBACK, normalizeFeedPlaybackConfig } from '../../config/feedPlayback'
import { createLocalStorage } from '../../services/createLocalStorage'
import { applyFeedPlaybackDefaults } from '../videos/videoFeedAudio'
import { adminUpdateFeedPlayback, fetchFeedPlayback } from './feedPlaybackRemote'

const storage = createLocalStorage('moxt-feed-playback-v1')

function readCachedConfig() {
  const saved = storage.read(null)
  if (!saved?.config) return { ...DEFAULT_FEED_PLAYBACK }
  return normalizeFeedPlaybackConfig(saved.config)
}

export const loadFeedPlayback = createAsyncThunk('feedPlayback/load', async (_, { rejectWithValue }) => {
  try {
    return await fetchFeedPlayback()
  } catch (error) {
    return rejectWithValue(error?.message || 'load_failed')
  }
})

export const saveFeedPlayback = createAsyncThunk(
  'feedPlayback/save',
  async (config, { rejectWithValue }) => {
    try {
      const next = await adminUpdateFeedPlayback(config)
      return { config: next, updatedAt: new Date().toISOString(), source: 'remote' }
    } catch (error) {
      return rejectWithValue(error?.message || 'save_failed')
    }
  },
)

const feedPlaybackSlice = createSlice({
  name: 'feedPlayback',
  initialState: {
    config: readCachedConfig(),
    status: 'idle',
    saveStatus: 'idle',
    updatedAt: null,
    source: 'cache',
    error: null,
  },
  extraReducers(builder) {
    builder
      .addCase(loadFeedPlayback.fulfilled, (state, action) => {
        state.status = 'ready'
        state.config = normalizeFeedPlaybackConfig(action.payload.config)
        state.updatedAt = action.payload.updatedAt || null
        state.source = action.payload.source || 'remote'
        storage.write({ config: state.config, updatedAt: state.updatedAt })
        applyFeedPlaybackDefaults(state.config)
      })
      .addCase(loadFeedPlayback.rejected, (state, action) => {
        state.status = 'error'
        state.error = action.payload || action.error?.message || 'load_failed'
        applyFeedPlaybackDefaults(state.config)
      })
      .addCase(saveFeedPlayback.pending, (state) => {
        state.saveStatus = 'saving'
        state.error = null
      })
      .addCase(saveFeedPlayback.fulfilled, (state, action) => {
        state.saveStatus = 'ready'
        state.config = normalizeFeedPlaybackConfig(action.payload.config)
        state.updatedAt = action.payload.updatedAt || null
        state.source = 'remote'
        storage.write({ config: state.config, updatedAt: state.updatedAt })
        applyFeedPlaybackDefaults(state.config)
      })
      .addCase(saveFeedPlayback.rejected, (state, action) => {
        state.saveStatus = 'error'
        state.error = action.payload || action.error?.message || 'save_failed'
      })
  },
})

applyFeedPlaybackDefaults(readCachedConfig())

export default feedPlaybackSlice.reducer
