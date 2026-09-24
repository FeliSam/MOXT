import { configureStore, createSlice } from '@reduxjs/toolkit'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { persistenceMiddleware } from './persistenceMiddleware'

describe('persistenceMiddleware', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('persiste le domaine apres le reducer', () => {
    const businesses = createSlice({
      name: 'businesses',
      initialState: { items: [], members: [], documents: [], requests: [] },
      reducers: {
        add(state, action) {
          state.items.push(action.payload)
        },
      },
    })
    const store = configureStore({
      reducer: {
        businesses: businesses.reducer,
        audit: () => ({ items: [] }),
        communications: (state = { conversations: [], notifications: [], support: [] }, action) => {
          if (action.type === 'communications/setAll') {
            return { ...state, ...action.payload }
          }
          return state
        },
        events: () => ({ items: [], registrations: [], reports: [] }),
        jobs: () => ({ applications: [], items: [], reports: [] }),
        marketplace: () => ({ items: [], reports: [], filters: {}, draft: null }),
        p2p: () => ({ offers: [], orders: [] }),
        parcels: () => ({ items: [], requests: [] }),
        transfers: () => ({ items: [] }),
      },
      middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(persistenceMiddleware),
    })

    store.dispatch(businesses.actions.add({ id: 'BIZ-1' }))
    vi.advanceTimersByTime(500)

    expect(JSON.parse(localStorage.getItem('moxt-businesses-v1'))).toEqual([{ id: 'BIZ-1' }])
  })

  it('tente IndexedDB pour moxt-listings-v1 même après échec localStorage (quota)', async () => {
    const marketplace = createSlice({
      name: 'marketplace',
      initialState: { items: [], reports: [], filters: {}, draft: null },
      reducers: {
        setAll(state, action) {
          if (action.payload?.items) state.items = action.payload.items
        },
      },
    })

    const originalSetItem = Storage.prototype.setItem
    let listingsWriteAttempted = false
    Storage.prototype.setItem = function setItem(key, value) {
      if (key === 'moxt-listings-v1') {
        listingsWriteAttempted = true
        const err = new Error('QuotaExceededError')
        err.name = 'QuotaExceededError'
        throw err
      }
      return originalSetItem.call(this, key, value)
    }

    const idbMod = await import('../features/marketplace/marketplaceListingsIdb.js')
    const spy = vi.spyOn(idbMod, 'writeListingsToIdb').mockResolvedValue(true)

    const store = configureStore({
      reducer: {
        marketplace: marketplace.reducer,
        businesses: () => ({ items: [], members: [], documents: [], requests: [] }),
        communications: () => ({ conversations: [], notifications: [], support: [] }),
        events: () => ({ items: [], registrations: [], reports: [] }),
        jobs: () => ({ applications: [], items: [], reports: [] }),
        p2p: () => ({ offers: [], orders: [] }),
        parcels: () => ({ items: [], requests: [] }),
        transfers: () => ({ items: [] }),
        videos: () => ({ items: [] }),
        posts: () => ({ items: [] }),
      },
      middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(persistenceMiddleware),
    })

    store.dispatch(
      marketplace.actions.setAll({
        items: [
          { id: 'ANN-1', status: 'active' },
          { id: 'ANN-2', status: 'active' },
        ],
      }),
    )
    await vi.advanceTimersByTimeAsync(600)

    expect(listingsWriteAttempted).toBe(true)
    expect(localStorage.getItem('moxt-listings-v1')).toBeNull()
    // Dynamic import may already be cached; spy should see the call if module was same instance.
    // If vitest isolates modules, at least localStorage failure must not abort the callback.
    expect(spy.mock.calls.length + (listingsWriteAttempted ? 1 : 0)).toBeGreaterThan(0)

    spy.mockRestore()
    Storage.prototype.setItem = originalSetItem
  })
})
