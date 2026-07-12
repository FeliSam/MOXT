import { describe, expect, it } from 'vitest'
import { canViewBusinessActivity, canViewUserActivity } from './activityVisibility'

describe('activityVisibility', () => {
  const conversations = [
    { participantIds: ['alice', 'bob'] },
    { participantIds: ['alice', 'carol'] },
  ]

  it('autorise le propriétaire', () => {
    expect(
      canViewUserActivity({
        viewerId: 'alice',
        ownerId: 'alice',
        visibility: 'private',
        conversations,
      }),
    ).toBe(true)
  })

  it('bloque le profil privé', () => {
    expect(
      canViewUserActivity({
        viewerId: 'bob',
        ownerId: 'alice',
        visibility: 'private',
        conversations,
      }),
    ).toBe(false)
  })

  it('autorise les contacts en conversation', () => {
    expect(
      canViewUserActivity({
        viewerId: 'bob',
        ownerId: 'alice',
        visibility: 'contacts',
        conversations,
      }),
    ).toBe(true)
    expect(
      canViewUserActivity({
        viewerId: 'dave',
        ownerId: 'alice',
        visibility: 'contacts',
        conversations,
      }),
    ).toBe(false)
  })

  it('autorise tout le monde en public', () => {
    expect(
      canViewUserActivity({
        viewerId: 'dave',
        ownerId: 'alice',
        visibility: 'public',
        conversations,
      }),
    ).toBe(true)
  })

  it('autorise les visiteurs sans compte sur un profil public', () => {
    expect(
      canViewUserActivity({
        viewerId: null,
        ownerId: 'alice',
        visibility: 'public',
        conversations,
      }),
    ).toBe(true)
    expect(
      canViewUserActivity({
        viewerId: null,
        ownerId: 'alice',
        visibility: 'private',
        conversations,
      }),
    ).toBe(false)
  })
})

describe('canViewBusinessActivity', () => {
  const business = { ownerId: 'alice', activityVisibility: 'contacts' }
  const conversations = [{ participantIds: ['alice', 'bob'] }]

  it('réutilise les règles de visibilité du propriétaire', () => {
    expect(
      canViewBusinessActivity({ viewerId: 'bob', business, conversations }),
    ).toBe(true)
    expect(
      canViewBusinessActivity({ viewerId: 'dave', business, conversations }),
    ).toBe(false)
  })
})
