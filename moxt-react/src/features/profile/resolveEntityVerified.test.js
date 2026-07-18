import { describe, expect, it } from 'vitest'
import { resolveEntityVerified } from './resolveEntityVerified'

describe('resolveEntityVerified', () => {
  it('honore le flag explicite', () => {
    expect(resolveEntityVerified({}, { verified: true })).toBe(true)
    expect(resolveEntityVerified({}, { verified: false, userId: 'u1' })).toBe(false)
  })

  it('détecte un utilisateur vérifié via le répertoire', () => {
    const state = {
      profileDirectory: {
        byId: { u1: { id: 'u1', verified: true, status: 'verified' } },
      },
    }
    expect(resolveEntityVerified(state, { userId: 'u1' })).toBe(true)
    expect(resolveEntityVerified(state, { userId: 'u2' })).toBe(false)
  })

  it('détecte l’utilisateur connecté', () => {
    const state = {
      auth: { user: { id: 'me', verified: true } },
      profileDirectory: { byId: {} },
    }
    expect(resolveEntityVerified(state, { userId: 'me' })).toBe(true)
  })

  it('détecte une entreprise vérifiée', () => {
    const state = {
      businesses: { items: [{ id: 'b1', status: 'verified' }] },
    }
    expect(resolveEntityVerified(state, { businessId: 'b1' })).toBe(true)
    expect(
      resolveEntityVerified(
        { businesses: { items: [{ id: 'b1', status: 'pending_review' }] } },
        { businessId: 'b1' },
      ),
    ).toBe(false)
  })

  it('priorise l’entreprise sur l’utilisateur', () => {
    const state = {
      auth: { user: { id: 'u1', verified: false } },
      businesses: { items: [{ id: 'b1', status: 'approved' }] },
    }
    expect(resolveEntityVerified(state, { userId: 'u1', businessId: 'b1' })).toBe(true)
  })
})
