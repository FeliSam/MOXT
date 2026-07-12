import { describe, expect, it } from 'vitest'
import { isProfileVerified } from './userProfileUtils'

describe('userProfileUtils', () => {
  it('détecte un profil vérifié', () => {
    expect(isProfileVerified({ verified: true })).toBe(true)
    expect(isProfileVerified({ status: 'verified' })).toBe(true)
    expect(isProfileVerified({ status: 'active' })).toBe(false)
    expect(isProfileVerified(null)).toBe(false)
  })
})
