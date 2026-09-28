import { describe, expect, it } from 'vitest'
import {
  conversationFromRemoteRow,
  countUnreadMessages,
  fetchParticipantProfiles,
  formatProfileName,
  getOtherParticipantId,
  isEmptyConversation,
  mergeParticipantProfiles,
  resolveConversationPeer,
  selectInboxConversations,
} from './conversationRules.js'
import { createFakeClient } from '../services/testClient.js'

const me = '11111111-1111-4111-8111-111111111111'
const other = '22222222-2222-4222-8222-222222222222'

describe('conversationRules', () => {
  it('normalise une ligne RPC (json en texte compris)', () => {
    const conv = conversationFromRemoteRow({
      id: 'c1',
      participant_ids: JSON.stringify([me, other]),
      participant_profiles: { [other]: { firstName: 'Awa', lastName: 'K.' } },
      unread_by: '{"' + me + '":2}',
      archived_by: [],
      message_count: 3,
      last_message_at: '2026-09-01T10:00:00Z',
    })
    expect(conv.participantIds).toEqual([me, other])
    expect(conv.unreadBy[me]).toBe(2)
    expect(conv.messageCount).toBe(3)
  })

  it('résout l’interlocuteur comme le web : profil, puis titre, puis repli', () => {
    const conv = { participantIds: [me, other], participantProfiles: { [other]: { firstName: 'Awa', lastName: 'Koné', avatarUrl: 'a.png', status: 'verified' } } }
    expect(getOtherParticipantId(conv, me)).toBe(other)
    expect(resolveConversationPeer(conv, me)).toMatchObject({ id: other, name: 'Awa Koné', avatarUrl: 'a.png', verified: true })
    expect(resolveConversationPeer({ participantIds: [me, other], title: 'Annonce vélo' }, me).name).toBe('Annonce vélo')
    expect(resolveConversationPeer({ participantIds: [me, other] }, me).name).toBe('Utilisateur')
    expect(formatProfileName({ name: 'Boutique' })).toBe('Boutique')
  })

  it('liste : masque vides et archivées, épinglées d’abord, sans dédoublonnage', () => {
    const base = { participantIds: [me, other], messageCount: 1 }
    const list = selectInboxConversations(
      [
        { ...base, id: 'old', lastMessageAt: '2026-01-01' },
        { ...base, id: 'new', lastMessageAt: '2026-09-01' },
        { ...base, id: 'pinned', lastMessageAt: '2025-01-01', pinnedBy: [me] },
        { ...base, id: 'archived', lastMessageAt: '2026-09-02', archivedBy: [me] },
        { participantIds: [me, other], id: 'empty', messageCount: 0 },
        { ...base, id: 'foreign', participantIds: [other], lastMessageAt: '2026-09-03' },
      ],
      me,
    )
    expect(list.map((item) => item.id)).toEqual(['pinned', 'new', 'old'])
    expect(isEmptyConversation({ lastMessageText: 'x' }, me)).toBe(false)
  })

  it('compte les messages non lus via unread_by', () => {
    expect(countUnreadMessages([{ unreadBy: { [me]: 2 } }, { unreadBy: { [me]: 1, [other]: 5 } }], me)).toBe(3)
  })

  it('charge les profils depuis profiles (UUID valides seulement) et fusionne', async () => {
    const client = createFakeClient({ profiles: [{ id: other, first_name: 'Awa', last_name: 'Koné', avatar_url: 'a.png', status: '' }] })
    const profiles = await fetchParticipantProfiles(client, [other, 'support', other, me])
    expect(profiles[other]).toMatchObject({ firstName: 'Awa', avatarUrl: 'a.png' })
    const inCall = client.calls[0].ops.find(([op]) => op === 'in')
    expect(inCall[2]).toEqual([other, me])
    expect(mergeParticipantProfiles({ [other]: { firstName: 'A' } }, profiles)[other].lastName).toBe('Koné')
  })
})
