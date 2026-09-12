import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { DEFAULT_STORE_LOCALES, normalizeStoreLocalesConfig } from '../../config/storeLocales'
import { createLocalStorage } from '../../services/createLocalStorage'
import { adminUpdateStoreLocales, fetchStoreLocales } from './storeLocalesRemote'

const storage = createLocalStorage('moxt-store-locales-v1')

function readCachedLocales() {
  const saved = storage.read(null)
  if (!saved?.locales) return { ...DEFAULT_STORE_LOCALES }
  return normalizeStoreLocalesConfig(saved.locales)
}

export const loadStoreLocales = createAsyncThunk('storeLocales/load', async (_, { rejectWithValue }) => {
  try {
    return await fetchStoreLocales()
  } catch (error) {
    return rejectWithValue(error?.message || 'load_failed')
  }
})

export const saveStoreLocales = createAsyncThunk(
  'storeLocales/save',
  async (locales, { rejectWithValue }) => {
    try {
      const next = await adminUpdateStoreLocales(locales)
      return { locales: next, updatedAt: new Date().toISOString(), source: 'remote' }
    } catch (error) {
      return rejectWithValue(error?.message || 'save_failed')
    }
  },
)

const storeLocalesSlice = createSlice({
  name: 'storeLocales',
  initialState: {
    locales: readCachedLocales(),
    status: 'idle',
    saveStatus: 'idle',
    updatedAt: null,
    source: 'cache',
    error: null,
  },
  extraReducers(builder) {
    builder
      .addCase(loadStoreLocales.fulfilled, (state, action) => {
        state.status = 'ready'
        state.locales = normalizeStoreLocalesConfig(action.payload.locales)
        state.updatedAt = action.payload.updatedAt || null
        state.source = action.payload.source || 'remote'
        storage.write({ locales: state.locales, updatedAt: state.updatedAt })
      })
      .addCase(loadStoreLocales.rejected, (state, action) => {
        state.status = 'error'
        state.error = action.payload || action.error?.message || 'load_failed'
      })
      .addCase(saveStoreLocales.pending, (state) => {
        state.saveStatus = 'saving'
        state.error = null
      })
      .addCase(saveStoreLocales.fulfilled, (state, action) => {
        state.saveStatus = 'ready'
        state.locales = normalizeStoreLocalesConfig(action.payload.locales)
        state.updatedAt = action.payload.updatedAt || null
        state.source = 'remote'
        storage.write({ locales: state.locales, updatedAt: state.updatedAt })
      })
      .addCase(saveStoreLocales.rejected, (state, action) => {
        state.saveStatus = 'error'
        state.error = action.payload || action.error?.message || 'save_failed'
      })
  },
})

export default storeLocalesSlice.reducer
