import { describe, expect, it, beforeEach, afterEach } from 'vitest'
import {
  savePendingRegistration,
  loadPendingRegistration,
  clearPendingRegistration,
} from './pendingRegistration.js'

describe('pendingRegistration', () => {
  beforeEach(() => {
    clearPendingRegistration()
  })

  afterEach(() => {
    clearPendingRegistration()
  })

  it('stores signup fields without a password and restores them', () => {
    savePendingRegistration({
      method: 'phone',
      phone: '+79000000010',
      email: 'Personne@Example.com',
      firstName: 'Nouvelle',
      lastName: 'Personne',
      originCountry: 'BJ',
      residenceCity: 'Moscou',
      pendingUserId: 'user-1',
      step: 4,
      password: 'must-not-persist',
    })

    const loaded = loadPendingRegistration()
    expect(loaded).toMatchObject({
      method: 'phone',
      phone: '+79000000010',
      email: 'personne@example.com',
      firstName: 'Nouvelle',
      lastName: 'Personne',
      pendingUserId: 'user-1',
      step: 4,
    })
    expect(loaded).not.toHaveProperty('password')
  })

  it('clears pending state on abandon', () => {
    savePendingRegistration({
      method: 'phone',
      phone: '+79000000010',
      email: 'a@example.com',
    })
    clearPendingRegistration()
    expect(loadPendingRegistration()).toBeNull()
  })

  it('does not wipe when saving again with the same profile (resend)', () => {
    savePendingRegistration({
      method: 'phone',
      phone: '+79000000010',
      email: 'a@example.com',
      firstName: 'Nova',
      lastName: 'Test',
    })
    savePendingRegistration({
      method: 'phone',
      phone: '+79000000010',
      email: 'a@example.com',
      firstName: 'Nova',
      lastName: 'Test',
    })
    expect(loadPendingRegistration()?.firstName).toBe('Nova')
  })
})
