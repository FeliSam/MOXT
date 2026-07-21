import { describe, expect, it } from 'vitest'
import {
  isTransferRelevantToUser,
  ownedBusinessIdsForUser,
  shouldAcceptRealtimeListing,
  userParticipatesInConversation,
} from './realtimeFilterUtils.js'

describe('isTransferRelevantToUser', () => {
  it('accepte l’expéditeur et le propriétaire business', () => {
    expect(
      isTransferRelevantToUser({ userId: 'u1', businessOwnerId: 'b1', businessId: 'biz' }, 'u1'),
    ).toBe(true)
    expect(
      isTransferRelevantToUser({ userId: 'u1', businessOwnerId: 'b1', businessId: 'biz' }, 'b1'),
    ).toBe(true)
  })

  it('accepte via businessId possédé', () => {
    expect(
      isTransferRelevantToUser(
        { userId: 'x', businessOwnerId: 'y', businessId: 'biz-1' },
        'me',
        ['biz-1'],
      ),
    ).toBe(true)
    expect(
      isTransferRelevantToUser(
        { userId: 'x', businessOwnerId: 'y', businessId: 'biz-1' },
        'me',
        ['other'],
      ),
    ).toBe(false)
  })
})

describe('shouldAcceptRealtimeListing', () => {
  it('accepte les annonces actives publiques', () => {
    expect(shouldAcceptRealtimeListing({ id: '1', status: 'active', ownerId: 'o' }, 'me')).toBe(
      true,
    )
  })

  it('ignore les brouillons des autres', () => {
    expect(shouldAcceptRealtimeListing({ id: '1', status: 'draft', ownerId: 'o' }, 'me')).toBe(
      false,
    )
  })

  it('accepte les brouillons du propriétaire', () => {
    expect(shouldAcceptRealtimeListing({ id: '1', status: 'draft', ownerId: 'me' }, 'me')).toBe(
      true,
    )
  })
})

describe('userParticipatesInConversation', () => {
  it('vérifie participantIds', () => {
    expect(
      userParticipatesInConversation({ participantIds: ['a', 'b'] }, 'b'),
    ).toBe(true)
    expect(userParticipatesInConversation({ participantIds: ['a'] }, 'z')).toBe(false)
  })
})

describe('ownedBusinessIdsForUser', () => {
  it('filtre les entreprises du propriétaire', () => {
    expect(
      ownedBusinessIdsForUser(
        [
          { id: '1', ownerId: 'me' },
          { id: '2', ownerId: 'other' },
        ],
        'me',
      ),
    ).toEqual(['1'])
  })
})
