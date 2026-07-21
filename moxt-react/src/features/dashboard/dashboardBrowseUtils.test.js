import { describe, expect, it } from 'vitest'
import {
  selectDashboardEvents,
  selectDashboardJobs,
  selectDashboardListings,
  selectDashboardParcels,
} from './dashboardBrowseUtils'

describe('dashboardBrowseUtils', () => {
  it('keeps only active non-archived parcels', () => {
    const today = new Date().toISOString().slice(0, 10)
    const items = [
      { id: '1', status: 'active', departureDate: '2099-01-01' },
      { id: '2', status: 'full', departureDate: '2099-01-01' },
      { id: '3', status: 'completed', departureDate: '2099-01-01' },
      { id: '4', status: 'active', departureDate: '2020-01-01' },
      { id: '5', status: 'active', departureDate: today },
    ]
    expect(selectDashboardParcels(items).map((p) => p.id)).toEqual(['1', '5'])
  })

  it('keeps only active jobs and published events', () => {
    expect(
      selectDashboardJobs([
        { id: 'a', status: 'active' },
        { id: 'b', status: 'expired' },
      ]).map((j) => j.id),
    ).toEqual(['a'])
    expect(
      selectDashboardEvents([
        { id: 'e1', status: 'published' },
        { id: 'e2', status: 'archived' },
      ]).map((e) => e.id),
    ).toEqual(['e1'])
  })

  it('keeps only active marketplace listings', () => {
    expect(
      selectDashboardListings([
        { id: 'l1', status: 'active' },
        { id: 'l2', status: 'sold' },
      ]).map((l) => l.id),
    ).toEqual(['l1'])
  })
})
