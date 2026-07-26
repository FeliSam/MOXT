import { describe, expect, it } from 'vitest'
import { isSourceItemLive, LIVE_SOURCE_STATUSES } from './sourceLiveStatus.js'

describe('isSourceItemLive', () => {
  it('unknown source types are never hidden', () => {
    expect(isSourceItemLive('free', null)).toBe(true)
    expect(isSourceItemLive('post', undefined)).toBe(true)
  })

  it('hides deleted (missing) items for known source types', () => {
    expect(isSourceItemLive('listing', undefined)).toBe(false)
  })

  it('checks the live status set per type', () => {
    expect(isSourceItemLive('listing', { status: 'active' })).toBe(true)
    expect(isSourceItemLive('listing', { status: 'archived' })).toBe(false)
    expect(isSourceItemLive('job', { status: 'active' })).toBe(true)
    expect(isSourceItemLive('job', { status: 'rejected' })).toBe(false)
    expect(isSourceItemLive('event', { status: 'published' })).toBe(true)
    expect(isSourceItemLive('event', { status: 'archived' })).toBe(false)
  })

  it('treats a soft-deleted business as not live', () => {
    expect(isSourceItemLive('business', { status: 'verified' })).toBe(true)
    expect(
      isSourceItemLive('business', { status: 'verified', deletedByUserAt: '2026-07-14T00:00:00Z' }),
    ).toBe(false)
  })

  it('treats a completed or past-departure parcel as not live even if status is active', () => {
    expect(isSourceItemLive('parcel', { status: 'active', departureDate: '2099-01-01' })).toBe(true)
    expect(isSourceItemLive('parcel', { status: 'completed', departureDate: '2099-01-01' })).toBe(false)
    expect(isSourceItemLive('parcel', { status: 'active', departureDate: '2020-01-01' })).toBe(false)
  })

  it('exposes the same live-status sets used by the feed cascade', () => {
    expect(LIVE_SOURCE_STATUSES.listing.has('active')).toBe(true)
    expect(LIVE_SOURCE_STATUSES.parcel.has('full')).toBe(true)
  })
})
