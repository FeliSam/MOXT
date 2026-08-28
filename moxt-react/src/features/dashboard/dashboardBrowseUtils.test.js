import { describe, expect, it } from 'vitest'
import {
  selectDashboardEvents,
  selectDashboardJobs,
  selectDashboardListings,
  selectDashboardP2POffers,
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

  it('keeps recent active P2P offers for the user currencies', () => {
    expect(
      selectDashboardP2POffers(
        [
          { id: 'o1', status: 'active', fromCurrency: 'RUB', toCurrency: 'XOF', createdAt: '2026-08-02' },
          { id: 'o2', status: 'archived', fromCurrency: 'RUB', toCurrency: 'XOF', createdAt: '2026-08-03' },
          { id: 'o3', status: 'active', fromCurrency: 'EUR', toCurrency: 'USD', createdAt: '2026-08-04' },
          { id: 'o4', status: 'active', fromCurrency: 'RUB', toCurrency: 'XOF', createdAt: '2026-08-01' },
        ],
        { currencies: ['RUB', 'XOF'], limit: 8 },
      ).map((o) => o.id),
    ).toEqual(['o1', 'o4'])
  })
})
