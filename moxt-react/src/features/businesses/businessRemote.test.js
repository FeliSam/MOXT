import { describe, expect, it } from 'vitest'
import { businessFromRemoteRow, businessToRemoteRow } from './businessRemote'

describe('businessRemote', () => {
  it('mappe une entreprise locale vers les colonnes Supabase', () => {
    const row = businessToRemoteRow({
      id: 'BIZ-1',
      ownerId: 'user-1',
      name: 'Test SARL',
      phone: '+79990000000',
      description: 'Description',
      primaryActivity: 'commerce',
      services: ['Transfert'],
      hours: 'Lun-Ven 9h-18h',
      scheduleSummary: 'Semaine',
    })

    expect(row.owner_id).toBe('user-1')
    expect(row.primary_activity).toBe('commerce')
    expect(row.schedule_summary).toBe('Semaine')
    expect(row.payload).toEqual({ hours: 'Lun-Ven 9h-18h' })
    expect(row).not.toHaveProperty('hours')
  })

  it('rehydrate une ligne distante avec payload', () => {
    const business = businessFromRemoteRow({
      id: 'BIZ-1',
      owner_id: 'user-1',
      name: 'Test SARL',
      payload: { hours: 'Week-end' },
      schedule_summary: 'Semaine',
    })

    expect(business.ownerId).toBe('user-1')
    expect(business.hours).toBe('Week-end')
  })
})
