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

  it('stores verificationPhase for choose/otp resume', () => {
    savePendingRegistration({
      method: 'email',
      verificationPhase: 'choose',
      phone: '+79000000010',
      email: 'a@example.com',
      firstName: 'Nova',
    })
    expect(loadPendingRegistration()).toMatchObject({
      method: 'email',
      verificationPhase: 'choose',
      firstName: 'Nova',
    })
    savePendingRegistration({
      method: 'phone',
      verificationPhase: 'otp',
      phone: '+79000000010',
      email: 'a@example.com',
    })
    expect(loadPendingRegistration()?.verificationPhase).toBe('otp')
  })
})
