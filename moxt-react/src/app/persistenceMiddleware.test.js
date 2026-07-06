import { configureStore, createSlice } from '@reduxjs/toolkit'
import { beforeEach, describe, expect, it } from 'vitest'
import { persistenceMiddleware } from './persistenceMiddleware'

describe('persistenceMiddleware', () => {
  beforeEach(() => localStorage.clear())

  it('persiste le domaine apres le reducer', () => {
    const businesses = createSlice({
      name: 'businesses',
      initialState: { items: [] },
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
        communications: () => ({ conversations: [], notifications: [], support: [] }),
        events: () => ({ items: [], registrations: [] }),
        jobs: () => ({ applications: [], items: [] }),
        marketplace: () => ({ items: [] }),
        p2p: () => ({ offers: [], orders: [] }),
        parcels: () => ({ items: [] }),
        transfers: () => ({ items: [] }),
      },
      middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(persistenceMiddleware),
    })

    store.dispatch(businesses.actions.add({ id: 'BIZ-1' }))

    expect(JSON.parse(localStorage.getItem('moxt-businesses-v1'))).toEqual([{ id: 'BIZ-1' }])
  })
})
