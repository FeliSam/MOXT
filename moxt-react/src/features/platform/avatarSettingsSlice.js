import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { DEFAULT_AVATAR_SETTINGS, normalizeAvatarSettings } from '../../config/avatarSettings'
import { createLocalStorage } from '../../services/createLocalStorage'
import { adminUpdateAvatarSettings, fetchAvatarSettings } from './avatarSettingsRemote'

const storage = createLocalStorage('moxt-avatar-settings-v1')

function readCachedConfig() {
  const saved = storage.read(null)
  if (!saved?.config) return { ...DEFAULT_AVATAR_SETTINGS }
  return normalizeAvatarSettings(saved.config)
}

export const loadAvatarSettings = createAsyncThunk(
  'avatarSettings/load',
  async (_, { rejectWithValue }) => {
    try {
      return await fetchAvatarSettings()
    } catch (error) {
      return rejectWithValue(error?.message || 'load_failed')
    }
  },
)

export const saveAvatarSettings = createAsyncThunk(
  'avatarSettings/save',
  async (config, { rejectWithValue }) => {
    try {
      const next = await adminUpdateAvatarSettings(config)
      return { config: next, updatedAt: new Date().toISOString(), source: 'remote' }
    } catch (error) {
      return rejectWithValue(error?.message || 'save_failed')
    }
  },
)

const avatarSettingsSlice = createSlice({
  name: 'avatarSettings',
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
      .addCase(loadAvatarSettings.fulfilled, (state, action) => {
        state.status = 'ready'
        state.config = normalizeAvatarSettings(action.payload.config)
        state.updatedAt = action.payload.updatedAt || null
        state.source = action.payload.source || 'remote'
        storage.write({ config: state.config, updatedAt: state.updatedAt })
      })
      .addCase(loadAvatarSettings.rejected, (state, action) => {
        state.status = 'error'
        state.error = action.payload || action.error?.message || 'load_failed'
      })
      .addCase(saveAvatarSettings.pending, (state) => {
        state.saveStatus = 'saving'
        state.error = null
      })
      .addCase(saveAvatarSettings.fulfilled, (state, action) => {
        state.saveStatus = 'ready'
        state.config = normalizeAvatarSettings(action.payload.config)
        state.updatedAt = action.payload.updatedAt || null
        state.source = 'remote'
        storage.write({ config: state.config, updatedAt: state.updatedAt })
      })
      .addCase(saveAvatarSettings.rejected, (state, action) => {
        state.saveStatus = 'error'
        state.error = action.payload || action.error?.message || 'save_failed'
      })
  },
})

export default avatarSettingsSlice.reducer
