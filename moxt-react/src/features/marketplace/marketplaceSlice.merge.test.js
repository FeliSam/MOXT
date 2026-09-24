import { describe, expect, it, beforeEach } from 'vitest'
import { configureStore } from '@reduxjs/toolkit'
import marketplaceReducer, { setAll } from './marketplaceSlice.js'

function makeStore(items) {
  return configureStore({
    reducer: { marketplace: marketplaceReducer },
    preloadedState: {
      marketplace: {
        items,
        reports: [],
        filters: { query: '', type: '', category: '', city: '', min: '', max: '' },
        draft: null,
      },
    },
  })
}

describe('marketplace setAll merge guard (public pages)', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('mode merge keeps local-only listings', () => {
    const store = makeStore([
      { id: 'a', status: 'active', createdAt: '2026-09-01T00:00:00.000Z', price: 1, images: [], questions: [], history: [], paymentMethods: [], shippingCarriers: [] },
      { id: 'b', status: 'active', createdAt: '2026-09-02T00:00:00.000Z', price: 1, images: [], questions: [], history: [], paymentMethods: [], shippingCarriers: [] },
    ])
    store.dispatch(
      setAll({
        mode: 'merge',
        items: [
          { id: 'a', status: 'active', createdAt: '2026-09-01T00:00:00.000Z', title: 'updated', price: 2 },
        ],
      }),
    )
    const ids = store.getState().marketplace.items.map((x) => x.id).sort()
    expect(ids).toEqual(['a', 'b'])
  })

  it('thin shrink without mode still merge-only under page limit', () => {
    const local = Array.from({ length: 20 }, (_, i) => ({
      id: `L${i}`,
      status: 'active',
      createdAt: `2026-09-${String((i % 28) + 1).padStart(2, '0')}T00:00:00.000Z`,
      price: 1,
      images: [],
      questions: [],
      history: [],
      paymentMethods: [],
      shippingCarriers: [],
    }))
    const store = makeStore(local)
    store.dispatch(
      setAll({
        items: local.slice(0, 8).map((row) => ({ ...row, title: 'x' })),
      }),
    )
    expect(store.getState().marketplace.items.length).toBe(20)
  })
})
