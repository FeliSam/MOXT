import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { DEFAULT_DEV_MODULE_FLAGS, normalizeDevModuleFlags } from '../../config/devModules'
import { createLocalStorage } from '../../services/createLocalStorage'
import { adminUpdateAppModuleFlags, fetchAppModuleFlags } from './platformModulesRemote'

const storage = createLocalStorage('moxt-platform-modules-v1')

function readCachedFlags() {
  const saved = storage.read(null)
  if (!saved?.flags) return { ...DEFAULT_DEV_MODULE_FLAGS }
  return normalizeDevModuleFlags(saved.flags)
}

export const loadPlatformModules = createAsyncThunk(
  'platformModules/load',
  async (_, { rejectWithValue }) => {
    try {
      return await fetchAppModuleFlags()
    } catch (error) {
      return rejectWithValue(error?.message || 'load_failed')
    }
  },
)

export const savePlatformModules = createAsyncThunk(
  'platformModules/save',
  async (flags, { rejectWithValue }) => {
    try {
      const next = await adminUpdateAppModuleFlags(flags)
      return { flags: next, updatedAt: new Date().toISOString(), source: 'remote' }
    } catch (error) {
      return rejectWithValue(error?.message || 'save_failed')
    }
  },
)

const platformModulesSlice = createSlice({
  name: 'platformModules',
  initialState: {
    flags: readCachedFlags(),
    status: 'idle',
    saveStatus: 'idle',
    updatedAt: null,
    source: 'cache',
    error: null,
  },
  reducers: {
    hydratePlatformModules(state, action) {
      state.flags = normalizeDevModuleFlags(action.payload?.flags)
      state.updatedAt = action.payload?.updatedAt || null
      state.source = action.payload?.source || 'cache'
    },
  },
  extraReducers(builder) {
    builder
      .addCase(loadPlatformModules.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(loadPlatformModules.fulfilled, (state, action) => {
        state.status = 'ready'
        state.flags = normalizeDevModuleFlags(action.payload.flags)
        state.updatedAt = action.payload.updatedAt || null
        state.source = action.payload.source || 'remote'
        storage.write({ flags: state.flags, updatedAt: state.updatedAt })
      })
      .addCase(loadPlatformModules.rejected, (state, action) => {
        state.status = 'error'
        state.error = action.payload || action.error?.message || 'load_failed'
      })
      .addCase(savePlatformModules.pending, (state) => {
        state.saveStatus = 'saving'
        state.error = null
      })
      .addCase(savePlatformModules.fulfilled, (state, action) => {
        state.saveStatus = 'ready'
        state.flags = normalizeDevModuleFlags(action.payload.flags)
        state.updatedAt = action.payload.updatedAt || null
        state.source = action.payload.source || 'remote'
        storage.write({ flags: state.flags, updatedAt: state.updatedAt })
      })
      .addCase(savePlatformModules.rejected, (state, action) => {
        state.saveStatus = 'error'
        state.error = action.payload || action.error?.message || 'save_failed'
      })
  },
})

export const { hydratePlatformModules } = platformModulesSlice.actions
export default platformModulesSlice.reducer
