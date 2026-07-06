import { describe, expect, it } from 'vitest'
import reducer, { addIdentityProfile } from './identitySlice'

describe('identitySlice', () => {
  it('adds identity profile', () => {
    const state = reducer(undefined, { type: '@@INIT' })
    const next = reducer(
      state,
      addIdentityProfile({
        userId: 'U1',
        ownerType: 'PERSON',
        identity: {
          firstNames: 'A',
          lastName: 'B',
          idType: 'PASSEPORT',
          passportNumber: 'AB1234567',
          issuedBy: 'X',
          issuedAt: '2020-01-01',
          expiresAt: '2030-01-01',
        },
      }),
    )
    expect(next.profiles).toHaveLength(1)
    expect(next.profiles[0].userId).toBe('U1')
  })
})
