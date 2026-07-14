import { describe, expect, it } from 'vitest'
import {
  collectCascadeArchiveTargets,
  shouldArchiveLinkedPosts,
} from './archiveLinkedPosts'

describe('shouldArchiveLinkedPosts', () => {
  it('archives when leaving live statuses', () => {
    expect(shouldArchiveLinkedPosts('listing', 'archived')).toBe(true)
    expect(shouldArchiveLinkedPosts('listing', 'sold')).toBe(true)
    expect(shouldArchiveLinkedPosts('listing', 'active')).toBe(false)
    expect(shouldArchiveLinkedPosts('parcel', 'completed')).toBe(true)
    expect(shouldArchiveLinkedPosts('parcel', 'full')).toBe(false)
    expect(shouldArchiveLinkedPosts('job', 'rejected')).toBe(true)
    expect(shouldArchiveLinkedPosts('event', 'archived')).toBe(true)
    expect(shouldArchiveLinkedPosts('event', 'published')).toBe(false)
  })

  it('archives soft-deleted businesses', () => {
    expect(shouldArchiveLinkedPosts('business', 'verified')).toBe(false)
    expect(
      shouldArchiveLinkedPosts('business', 'verified', { deletedByUserAt: '2026-07-14T00:00:00Z' }),
    ).toBe(true)
    expect(shouldArchiveLinkedPosts('business', 'rejected')).toBe(true)
  })
})

describe('collectCascadeArchiveTargets', () => {
  it('collects targets from status updates and deletes', () => {
    expect(
      collectCascadeArchiveTargets(
        { type: 'marketplace/updateListingStatus', payload: { id: 'L1', status: 'archived' } },
        {},
        {},
      ),
    ).toEqual([{ sourceType: 'listing', sourceId: 'L1' }])

    expect(
      collectCascadeArchiveTargets(
        { type: 'marketplace/updateListingStatus', payload: { id: 'L1', status: 'active' } },
        {},
        {},
      ),
    ).toEqual([])

    expect(
      collectCascadeArchiveTargets(
        { type: 'marketplace/deleteListing', payload: { id: 'L2' } },
        {},
        {},
      ),
    ).toEqual([{ sourceType: 'listing', sourceId: 'L2' }])

    expect(
      collectCascadeArchiveTargets(
        { type: 'businesses/deleteBusinessByUser', payload: { id: 'B1' } },
        {},
        {},
      ),
    ).toEqual([{ sourceType: 'business', sourceId: 'B1' }])
  })

  it('collects expired items that left a live status', () => {
    const before = {
      marketplace: {
        items: [
          { id: 'L1', status: 'active' },
          { id: 'L2', status: 'active' },
        ],
      },
    }
    const after = {
      marketplace: {
        items: [
          { id: 'L1', status: 'expired' },
          { id: 'L2', status: 'active' },
        ],
      },
    }
    expect(
      collectCascadeArchiveTargets({ type: 'marketplace/expireListings', payload: '' }, before, after),
    ).toEqual([{ sourceType: 'listing', sourceId: 'L1' }])
  })
})
