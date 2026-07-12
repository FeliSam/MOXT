import { describe, expect, it } from 'vitest'
import {
  canCreateBusiness,
  canPublishContent,
  canUseTransferAccount,
  isPhoneVerified,
  verificationRequestIsStale,
} from './userSecurity.js'

const phoneUser = {
  id: 'u1',
  phone: '+79001234567',
  phoneVerified: true,
  firstName: 'Ali',
  lastName: 'Ben',
  email: 'a@b.ru',
  city: 'Moscou',
  originCountry: 'BJ',
}

const identityUser = {
  ...phoneUser,
  verified: true,
  status: 'verified',
}

describe('userSecurity', () => {
  it('requires phone verification to publish', () => {
    expect(canPublishContent(phoneUser)).toBe(true)
    expect(canPublishContent({ ...phoneUser, phoneVerified: false })).toBe(false)
  })

  it('requires identity for business only', () => {
    expect(canCreateBusiness(identityUser)).toBe(true)
    expect(canCreateBusiness(phoneUser)).toBe(false)
  })

  it('requires phone verification for transfers', () => {
    expect(canUseTransferAccount(phoneUser)).toBe(true)
    expect(canUseTransferAccount({ ...phoneUser, phoneVerified: false })).toBe(false)
    expect(canUseTransferAccount({ id: 'guest-oauth' })).toBe(false)
    expect(canUseTransferAccount(null)).toBe(false)
  })

  it('detects stale verification requests', () => {
    const stale = {
      status: 'pending_review',
      createdAt: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(),
    }
    expect(verificationRequestIsStale(stale)).toBe(true)
    expect(isPhoneVerified({ phoneVerifiedAt: '2026-01-01' })).toBe(true)
  })
})
