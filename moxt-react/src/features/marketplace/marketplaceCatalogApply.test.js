import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('./marketplaceListingsIdb.js', () => ({
  writeListingsToIdb: vi.fn(() => Promise.resolve(true)),
}))

vi.mock('./marketplaceRemote', () => ({
  listingFromRemoteRow: (row) => ({
    id: row.id,
    title: row.title,
    status: row.status || 'active',
    ownerId: row.owner_id,
  }),
}))

vi.mock('./marketplaceSlice', () => {
  const setAll = (payload) => ({ type: 'marketplace/setAll', payload })
  setAll.type = 'marketplace/setAll'
  return { setAll }
})

describe('earlyApplyMarketplaceListings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('dispatch setMarketplace immédiatement et écrit IndexedDB (early apply)', async () => {
    const { earlyApplyMarketplaceListings } = await import('./marketplaceCatalogApply.js')
    const { writeListingsToIdb } = await import('./marketplaceListingsIdb.js')
    const dispatched = []
    const dispatch = (action) => {
      dispatched.push(action)
      return action
    }

    const items = earlyApplyMarketplaceListings(dispatch, [
      { id: 'ANN-1', title: 'A', owner_id: 'u1', status: 'active' },
      { id: 'ANN-2', title: 'B', owner_id: 'u2', status: 'active' },
    ])

    expect(items).toHaveLength(2)
    expect(items[0]).toMatchObject({ id: 'ANN-1', title: 'A', ownerId: 'u1' })
    expect(dispatched).toHaveLength(1)
    expect(dispatched[0]).toEqual({
      type: 'marketplace/setAll',
      payload: { items },
    })

    await vi.waitFor(() => {
      expect(writeListingsToIdb).toHaveBeenCalledTimes(1)
    })
    expect(writeListingsToIdb).toHaveBeenCalledWith(items)
  })
})
