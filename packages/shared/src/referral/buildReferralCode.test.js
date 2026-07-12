import { describe, expect, it } from 'vitest'
import { buildReferralCode } from './buildReferralCode.js'

describe('buildReferralCode', () => {
  it('produit un code MOXT stable pour un identifiant donné', () => {
    const user = { id: '550e8400-e29b-41d4-a716-446655440000' }
    expect(buildReferralCode(user)).toBe('MOXT-SE4KP9')
    expect(buildReferralCode(user)).toBe(buildReferralCode(user))
  })

  it('utilise un suffixe de 6 caractères', () => {
    const code = buildReferralCode({ id: '123e4567-e89b-12d3-a456-426614174000' })
    expect(code).toMatch(/^MOXT-[0-9A-Z]{6}$/)
  })
})
