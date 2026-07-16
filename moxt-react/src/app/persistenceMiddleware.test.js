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
})
