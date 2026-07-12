import { describe, expect, it } from 'vitest'
import { isBusinessOwnedBy, matchUserId, selectActiveBusinessForOwner } from './businessVisibility'

describe('businessVisibility', () => {
  it('compare les identifiants utilisateur en chaine', () => {
    expect(matchUserId('abc-123', 'abc-123')).toBe(true)
    expect(matchUserId('abc-123', 'ABC-123')).toBe(false)
  })

  it('detecte la propriete d une entreprise', () => {
    expect(isBusinessOwnedBy({ ownerId: 'user-1' }, 'user-1')).toBe(true)
    expect(isBusinessOwnedBy({ ownerId: 'user-1' }, 'user-2')).toBe(false)
  })

  it('retourne l entreprise active du proprietaire', () => {
    const businesses = [
      { id: 'BIZ-1', ownerId: 'user-1', name: 'Active' },
      { id: 'BIZ-2', ownerId: 'user-1', name: 'Supprimee', deletedByUserAt: '2026-01-01' },
    ]

    expect(selectActiveBusinessForOwner(businesses, 'user-1')).toEqual(businesses[0])
  })
})
