import { describe, expect, it } from 'vitest'
import {
  buildBusinessTransferRollups,
  countBusinessActivity,
  matchesTransferStatusFilter,
} from './adminData'

describe('matchesTransferStatusFilter', () => {
  it('treats pending as in-pipeline statuses', () => {
    expect(matchesTransferStatusFilter('processing', 'pending')).toBe(true)
    expect(matchesTransferStatusFilter('completed', 'pending')).toBe(false)
    expect(matchesTransferStatusFilter('cancelled', 'pending')).toBe(false)
  })
})

describe('buildBusinessTransferRollups', () => {
  it('groups transfers by business', () => {
    const rollups = buildBusinessTransferRollups(
      [
        { id: 't1', businessId: 'b1', status: 'processing', amountSent: 100, exchanger: { name: 'A' } },
        { id: 't2', businessId: 'b1', status: 'completed', amountSent: 200, exchanger: { name: 'A' } },
        { id: 't3', businessId: 'b2', status: 'completed', amountSent: 50, exchanger: { name: 'B' } },
      ],
      [{ id: 'b1', name: 'Biz One' }, { id: 'b2', name: 'Biz Two' }],
    )
    expect(rollups).toHaveLength(2)
    expect(rollups[0]).toMatchObject({ businessId: 'b1', name: 'Biz One', count: 2, pending: 1 })
  })
})

describe('countBusinessActivity', () => {
  it('counts items linked to businessId', () => {
    const counts = countBusinessActivity(
      {
        transfers: { items: [{ businessId: 'b1' }, { businessId: 'b2' }] },
        marketplace: { items: [{ businessId: 'b1' }] },
        parcels: { items: [] },
        jobs: { items: [] },
        events: { items: [] },
        posts: { items: [{ publisherType: 'business', publisherId: 'b1' }] },
      },
      'b1',
    )
    expect(counts).toEqual({
      transfers: 1,
      listings: 1,
      parcels: 0,
      jobs: 0,
      events: 0,
      posts: 1,
    })
  })
})
