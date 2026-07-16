import { describe, expect, it } from 'vitest'
import {
  canCreateBusiness,
  canPublishContent,
  canPublishP2POffer,
  canUseTransferAccount,
  initialCatalogStatus,
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

const publishReadyUser = {
  ...phoneUser,
  emailVerified: true,
  emailVerifiedAt: '2026-01-01',
}

const identityUser = {
  ...publishReadyUser,
  verified: true,
  status: 'verified',
}

describe('userSecurity', () => {
  it('requires phone and email verification to publish', () => {
    expect(canPublishContent(publishReadyUser)).toBe(true)
    expect(canPublishContent(phoneUser)).toBe(false)
    expect(canPublishContent({ ...publishReadyUser, phoneVerified: false })).toBe(false)
    expect(canPublishContent({ ...publishReadyUser, emailVerified: false, emailVerifiedAt: null })).toBe(
      false,
    )
  })

  it('publishes live only when identity is verified', () => {
    expect(initialCatalogStatus(phoneUser)).toBe('pending_review')
    expect(initialCatalogStatus(identityUser)).toBe('active')
    expect(initialCatalogStatus(identityUser, { live: 'published' })).toBe('published')
  })

  it('requires identity and email to publish P2P offers', () => {
    expect(canPublishP2POffer(phoneUser)).toBe(false)
    expect(canPublishP2POffer(publishReadyUser)).toBe(false)
    expect(canPublishP2POffer({ ...identityUser, emailVerified: false, emailVerifiedAt: null })).toBe(
      false,
    )
    expect(canPublishP2POffer(identityUser)).toBe(true)
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
