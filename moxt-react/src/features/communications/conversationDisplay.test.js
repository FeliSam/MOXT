import { describe, expect, it } from 'vitest'
import {
  buildParticipantProfilesMap,
  formatProfileName,
  getConversationPeer,
  mergeParticipantProfiles,
  resolveContactProfileFromEntity,
} from './conversationDisplay'

describe('conversationDisplay', () => {
  it('formate le nom du profil', () => {
    expect(formatProfileName({ firstName: 'Jean', lastName: 'Dupont' })).toBe('Jean Dupont')
  })

  it('résout le contact depuis une annonce', () => {
    expect(resolveContactProfileFromEntity({ sellerName: 'Marie Martin' })).toEqual({
      firstName: 'Marie',
      lastName: 'Martin',
      avatarUrl: null,
    })
  })

  it('affiche le nom du co-participant plutôt que le titre de conversation', () => {
    const conversation = {
      title: 'iPhone 15 Pro',
      participantIds: ['me', 'peer'],
      participantProfiles: {
        peer: { firstName: 'Alice', lastName: 'Kouassi', avatarUrl: 'https://example.com/a.jpg' },
      },
    }
    expect(getConversationPeer(conversation, 'me')).toEqual({
      id: 'peer',
      name: 'Alice Kouassi',
      avatarUrl: 'https://example.com/a.jpg',
    })
  })

  it('construit les profils participants avec repli local', () => {
    const profiles = buildParticipantProfilesMap({
      participantIds: ['u1', 'u2'],
      remoteProfiles: { u2: { firstName: 'Bob', lastName: 'Lee', avatarUrl: null } },
      currentUser: { id: 'u1', firstName: 'Moi', lastName: 'Test', avatarUrl: null },
      ownerId: 'u2',
      contactProfile: null,
    })
    expect(profiles.u1.firstName).toBe('Moi')
    expect(profiles.u2.firstName).toBe('Bob')
  })

  it('fusionne les profils sans écraser les champs existants vides', () => {
    expect(
      mergeParticipantProfiles(
        { u1: { firstName: 'Jean', lastName: 'Dupont', avatarUrl: null } },
        { u1: { avatarUrl: 'https://example.com/j.jpg' } },
      ),
    ).toEqual({
      u1: { firstName: 'Jean', lastName: 'Dupont', avatarUrl: 'https://example.com/j.jpg' },
    })
  })
})
