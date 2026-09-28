import { describe, expect, it } from 'vitest'
import {
  countAvailableBrowseParcels,
  countBrowseParcelTabs,
  splitBrowseParcels,
  isAvailableBrowseParcel,
  isParcelBrowseArchived,
  readParcelDepartureDate,
} from './parcelRules.js'

const today = '2026-09-28'

describe('parcelRules', () => {
  it('lit la date de départ camelCase ou snake_case', () => {
    expect(readParcelDepartureDate({ departureDate: '2026-10-01' })).toBe('2026-10-01')
    expect(readParcelDepartureDate({ departure_date: '2026-10-02' })).toBe('2026-10-02')
    expect(readParcelDepartureDate(null)).toBeNull()
  })

  it('archive les trajets terminés ou au départ passé (même si status reste active)', () => {
    expect(isParcelBrowseArchived({ status: 'completed', departureDate: '2026-12-01' }, today)).toBe(true)
    expect(isParcelBrowseArchived({ status: 'active', departureDate: '2026-09-27' }, today)).toBe(true)
    expect(isParcelBrowseArchived({ status: 'active', departureDate: today }, today)).toBe(false)
    expect(isParcelBrowseArchived({ status: 'full' }, today)).toBe(false)
  })

  it('compte les onglets Colis comme la page web', () => {
    const parcels = [
      { status: 'active', departureDate: '2026-10-10' },
      { status: 'active', departureDate: '2026-09-01' },
      { status: 'completed', departureDate: '2026-11-01' },
      { status: 'full', departureDate: '2026-10-11' },
    ]
    expect(countBrowseParcelTabs(parcels, today)).toEqual({ active: 2, archived: 2, total: 4 })
  })

  it('ne propose que les trajets actifs avec des kg restants', () => {
    expect(isAvailableBrowseParcel({ status: 'active', remainingKg: 3, departureDate: '2026-10-01' }, today)).toBe(true)
    expect(isAvailableBrowseParcel({ status: 'active', remainingKg: 0, departureDate: '2026-10-01' }, today)).toBe(false)
    expect(isAvailableBrowseParcel({ status: 'full', remainingKg: 5, departureDate: '2026-10-01' }, today)).toBe(false)
    expect(countAvailableBrowseParcels([{ status: 'active', capacityKg: 2 }, {}], today)).toBe(1)
  })

  it('sépare actifs (pays + statut) et archives (tout le catalogue) comme ParcelsPage', () => {
    const parcels = [
      { id: 'a', status: 'active', departureDate: '2026-10-10', fromCountry: 'RU', toCountry: 'BJ' },
      { id: 'b', status: 'active', departureDate: '2026-10-10', fromCountry: 'FR', toCountry: 'SN' },
      { id: 'c', status: 'full', departureDate: '2026-10-10', fromCountry: 'RU' },
      { id: 'd', status: 'active', departureDate: '2026-09-01', fromCountry: 'FR' },
    ]
    const { active, archived } = splitBrowseParcels(parcels, { countryCode: 'RU', today })
    expect(active.map((p) => p.id)).toEqual(['a'])
    expect(archived.map((p) => p.id)).toEqual(['d'])
  })
})
