import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { createLocalStorage } from '../../services/createLocalStorage'
import {
  adminStarsOverview,
  consumeStars,
  createStarsPurchase,
  fetchFeedBoosts,
  expireFeedBoosts,
  fetchStarsBalance,
  fetchStarsPackages,
  fetchStarsPurchases,
  giftStarsToPublisher as giftStarsToPublisherRemote,
  listStarsTransactions,
  quoteStarsAction,
} from './starsRemote'

const feedBoostsStorage = createLocalStorage('moxt-feed-boosts-v1')
const FEED_BOOSTS_TTL_MS = 20 * 60 * 1000
const FEED_BOOSTS_META_KEY = 'moxt-feed-boosts-meta-v1'

function readFeedBoostsMeta() {
  if (typeof localStorage === 'undefined') return null
  try {
    return JSON.parse(localStorage.getItem(FEED_BOOSTS_META_KEY) || 'null')
  } catch {
    return null
  }
}

function isFeedBoostsCacheFresh() {
  const meta = readFeedBoostsMeta()
  if (!meta?.at) return false
  return Date.now() - Date.parse(meta.at) < FEED_BOOSTS_TTL_MS
}

function markFeedBoostsSynced() {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(FEED_BOOSTS_META_KEY, JSON.stringify({ at: new Date().toISOString() }))
  } catch {
    // ignore
  }
}

const initialState = {
  balance: null,
  transactions: [],
  packages: [],
  purchases: [],
  overview: null,
  feedBoosts: feedBoostsStorage.read([]) ?? [],
  status: 'idle',
  error: null,
}

export const loadStarsBalance = createAsyncThunk(
  'stars/loadBalance',
  async (args = {}, { rejectWithValue }) => {
    try {
      return await fetchStarsBalance(args)
    } catch (error) {
      return rejectWithValue(error.message || 'offline')
    }
  },
)

export const loadStarsHistory = createAsyncThunk(
  'stars/loadHistory',
  async (args = {}, { rejectWithValue }) => {
    try {
      return await listStarsTransactions(args)
    } catch (error) {
      return rejectWithValue(error.message || 'offline')
    }
  },
)

export const loadStarsCatalog = createAsyncThunk(
  'stars/loadCatalog',
  async (_, { rejectWithValue }) => {
    try {
        const [packages, purchases] = await Promise.all([
          fetchStarsPackages().catch(() => []),
          fetchStarsPurchases().catch(() => []),
        ])
      return { packages, purchases }
    } catch (error) {
      return rejectWithValue(error.message || 'offline')
    }
  },
)

export const loadFeedBoosts = createAsyncThunk(
  'stars/loadFeedBoosts',
  async (_, { rejectWithValue }) => {
    try {
      await expireFeedBoosts()
      const boosts = await fetchFeedBoosts()
      feedBoostsStorage.write(boosts)
      markFeedBoostsSynced()
      return boosts
    } catch (error) {
      return rejectWithValue(error.message || 'offline')
    }
  },
  {
    condition: () => !isFeedBoostsCacheFresh(),
  },
)

export const loadStarsOverview = createAsyncThunk(
  'stars/loadOverview',
  async (_, { rejectWithValue }) => {
    try {
      return await adminStarsOverview()
    } catch (error) {
      return rejectWithValue(error.message || 'offline')
    }
  },
)

export const requestStarsQuote = createAsyncThunk('stars/quote', async (args, { rejectWithValue }) => {
  try {
    return await quoteStarsAction(args)
  } catch (error) {
    return rejectWithValue(error.message || 'offline')
  }
})

export const requestStarsConsume = createAsyncThunk(
  'stars/consume',
  async (args, { rejectWithValue }) => {
    try {
      return await consumeStars(args)
    } catch (error) {
      return rejectWithValue(error.message || 'offline')
    }
  },
)

export const requestStarsPurchase = createAsyncThunk(
  'stars/purchase',
  async (args, { rejectWithValue }) => {
    try {
      return await createStarsPurchase(args)
    } catch (error) {
      return rejectWithValue(error.message || 'offline')
    }
  },
)

export const giftStarsToPublisher = createAsyncThunk(
  'stars/giftToPublisher',
  async (args, { rejectWithValue }) => {
    try {
      return await giftStarsToPublisherRemote(args)
    } catch (error) {
      return rejectWithValue(error.message || 'offline')
    }
  },
)

const starsSlice = createSlice({
  name: 'stars',
  initialState,
  reducers: {
    clearStarsError(state) {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadStarsBalance.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(loadStarsBalance.fulfilled, (state, action) => {
        state.status = 'ready'
        state.balance = action.payload
      })
      .addCase(loadStarsBalance.rejected, (state, action) => {
        state.status = 'error'
        state.error = action.payload || 'error'
      })
      .addCase(loadStarsHistory.fulfilled, (state, action) => {
        state.transactions = action.payload || []
      })
      .addCase(loadStarsCatalog.fulfilled, (state, action) => {
        state.packages = action.payload?.packages || []
        state.purchases = action.payload?.purchases || []
      })
      .addCase(loadFeedBoosts.fulfilled, (state, action) => {
        state.feedBoosts = action.payload || []
      })
      .addCase(loadFeedBoosts.rejected, () => {
        // Conserver les boosts préchargés depuis le cache local.
      })
      .addCase(loadStarsOverview.fulfilled, (state, action) => {
        state.overview = action.payload
      })
      .addCase(requestStarsPurchase.fulfilled, (state, action) => {
        if (action.payload) {
          state.purchases = [action.payload, ...state.purchases]
        }
      })
      .addCase(giftStarsToPublisher.fulfilled, (state, action) => {
        if (state.balance && action.payload?.remainingPaid != null) {
          state.balance = {
            ...state.balance,
            paid_balance: action.payload.remainingPaid,
            paidBalance: action.payload.remainingPaid,
          }
        }
      })
  },
})

export const { clearStarsError } = starsSlice.actions
export default starsSlice.reducer
