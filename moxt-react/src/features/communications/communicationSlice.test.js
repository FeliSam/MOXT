import { beforeEach, describe, expect, it } from 'vitest'
import reducer, {
  addNotification,
  archiveNotification,
  archiveConversation,
  createConversation,
  createSupportTicket,
  deleteMessageLocally,
  markAllNotificationsRead,
  markConversationRead,
  mergeConversations,
  mergeMessageBatch,
  normalizeConversation,
  normalizeMessage,
  replySupportTicket,
  reactToMessage,
  restoreConversation,
  resolveHasOlderMessages,
  saveConversationDraft,
  sendMessage,
  setConversationMessages,
  shouldSkipMessageReload,
  toggleConversationBlock,
  toggleConversationMute,
  toggleConversationPin,
} from './communicationSlice'

const emptyState = { conversations: [], support: [], notifications: [] }

describe('communications', () => {
  beforeEach(() => localStorage.clear())

  it('refuse un message venant d un non participant', () => {
    const created = reducer(
      emptyState,
      createConversation({ title: 'Test', participantIds: ['u1', 'u2'], createdBy: 'u1' }),
    )
    const state = reducer(
      created,
      sendMessage({
        conversationId: created.conversations[0].id,
        senderId: 'intrus',
        senderName: 'Intrus',
        text: 'Message',
      }),
    )
    expect(state.conversations[0].messages).toHaveLength(0)
  })

  it('refuse une conversation sans destinataire et gere les non lus', () => {
    const refused = reducer(
      emptyState,
      createConversation({ title: 'Solo', participantIds: ['u1'], createdBy: 'u1' }),
    )
    expect(refused.conversations).toHaveLength(0)

    const created = reducer(
      emptyState,
      createConversation({ title: 'Duo', participantIds: ['u1', 'u2'], createdBy: 'u1' }),
    )
    const messaged = reducer(
      created,
      sendMessage({
        conversationId: created.conversations[0].id,
        senderId: 'u1',
        senderName: 'Amina',
        text: 'Bonjour',
      }),
    )
    expect(messaged.conversations[0].unreadBy.u2).toBe(1)
    const read = reducer(
      messaged,
      markConversationRead({ conversationId: created.conversations[0].id, userId: 'u2' }),
    )
    expect(read.conversations[0].unreadBy.u2).toBe(0)
    const message = read.conversations[0].messages[0]
    expect(message.readBy.map(String)).toContain('u2')
  })

  it('alterne le ticket entre attente agent et attente utilisateur', () => {
    const created = reducer(
      emptyState,
      createSupportTicket({
        userId: 'u1',
        userName: 'Amina',
        subject: 'Aide',
        priority: 'normal',
        message: 'Une demande suffisamment detaillee.',
      }),
    )
    const ticketId = created.support[0].id
    const replied = reducer(
      created,
      replySupportTicket({
        ticketId,
        senderId: 'admin',
        senderName: 'Support',
        role: 'agent',
        text: 'Reponse du support',
      }),
    )
    expect(replied.support[0].status).toBe('waiting_user')
  })

  it('marque uniquement les notifications de l utilisateur cible', () => {
    const first = reducer(emptyState, addNotification({ userId: 'u1', title: 'A', message: 'A' }))
    const second = reducer(first, addNotification({ userId: 'u2', title: 'B', message: 'B' }))
    const state = reducer(second, markAllNotificationsRead('u1'))
    expect(state.notifications.find((item) => item.userId === 'u1').read).toBe(true)
    expect(state.notifications.find((item) => item.userId === 'u2').read).toBe(false)
  })

  it('archive, bloque et conserve les métadonnées de pièce jointe', () => {
    const created = reducer(
      emptyState,
      createConversation({ title: 'Duo', participantIds: ['u1', 'u2'], createdBy: 'u1' }),
    )
    const id = created.conversations[0].id
    const messaged = reducer(
      created,
      sendMessage({
        conversationId: id,
        senderId: 'u1',
        senderName: 'Amina',
        text: 'Document',
        attachment: { name: 'devis.pdf', size: 1200, type: 'application/pdf' },
      }),
    )
    const archived = reducer(messaged, archiveConversation({ id, userId: 'u1' }))
    const blocked = reducer(archived, toggleConversationBlock({ id, userId: 'u1' }))

    expect(blocked.conversations[0].messages[0].attachment.name).toBe('devis.pdf')
    expect(blocked.conversations[0].archivedBy).toContain('u1')
    expect(blocked.conversations[0].blockedBy).toContain('u1')
  })

  it('gère réponse, réaction, suppression locale et restauration', () => {
    const created = reducer(
      emptyState,
      createConversation({
        title: 'Duo',
        participantIds: ['u1', 'u2'],
        createdBy: 'u1',
        initialMessage: 'Bonjour',
      }),
    )
    const conversationId = created.conversations[0].id
    const firstId = created.conversations[0].messages[0].id
    const replied = reducer(
      created,
      sendMessage({
        conversationId,
        senderId: 'u2',
        senderName: 'B',
        text: 'Réponse',
        replyToId: firstId,
      }),
    )
    const reacted = reducer(
      replied,
      reactToMessage({ conversationId, messageId: firstId, reaction: 'like', userId: 'u2' }),
    )
    const deleted = reducer(
      reacted,
      deleteMessageLocally({ conversationId, messageId: firstId, userId: 'u1' }),
    )
    const archived = reducer(deleted, archiveConversation({ id: conversationId, userId: 'u1' }))
    const restored = reducer(archived, restoreConversation({ id: conversationId, userId: 'u1' }))

    expect(replied.conversations[0].messages[1].replyToId).toBe(firstId)
    expect(reacted.conversations[0].messages[0].reactions.like).toContain('u2')
    expect(deleted.conversations[0].messages[0].deletedBy).toContain('u1')
    expect(restored.conversations[0].archivedBy).not.toContain('u1')
  })
  it('conserve brouillon, epinglage et sourdine par utilisateur', () => {
    const created = reducer(
      emptyState,
      createConversation({ title: 'Duo', participantIds: ['u1', 'u2'], createdBy: 'u1' }),
    )
    const id = created.conversations[0].id
    const drafted = reducer(created, saveConversationDraft({ id, userId: 'u1', text: 'A finir' }))
    const pinned = reducer(drafted, toggleConversationPin({ id, userId: 'u1' }))
    const muted = reducer(pinned, toggleConversationMute({ id, userId: 'u1' }))

    expect(muted.conversations[0].drafts.u1).toBe('A finir')
    expect(muted.conversations[0].pinnedBy).toContain('u1')
    expect(muted.conversations[0].mutedBy).toContain('u1')
  })

  it('archive uniquement la notification de son proprietaire', () => {
    const notified = reducer(
      emptyState,
      addNotification({ userId: 'u1', title: 'A', message: 'A' }),
    )
    const id = notified.notifications[0].id
    const refused = reducer(notified, archiveNotification({ id, userId: 'u2' }))
    const archived = reducer(refused, archiveNotification({ id, userId: 'u1' }))

    expect(refused.notifications[0].archived).not.toBe(true)
    expect(archived.notifications[0].archived).toBe(true)
  })

  it('incremente messageCount a chaque envoi', () => {
    const created = reducer(
      emptyState,
      createConversation({ title: 'Duo', participantIds: ['u1', 'u2'], createdBy: 'u1' }),
    )
    const conversationId = created.conversations[0].id
    const messaged = reducer(
      created,
      sendMessage({
        conversationId,
        senderId: 'u1',
        senderName: 'Amina',
        text: 'Bonjour',
      }),
    )
    expect(messaged.conversations[0].messageCount).toBe(1)
    expect(messaged.conversations[0].messages).toHaveLength(1)
  })

  it('marque une conversation vide comme non chargee cote messages', () => {
    const created = reducer(
      emptyState,
      createConversation({ title: 'Duo', participantIds: ['u1', 'u2'], createdBy: 'u1' }),
    )
    expect(created.conversations[0].messagesLoaded).toBe(false)
  })

  it('accepte un message quand participantIds est une chaine JSON', () => {
    const created = reducer(
      emptyState,
      createConversation({ title: 'Duo', participantIds: ['u1', 'u2'], createdBy: 'u1' }),
    )
    const id = created.conversations[0].id
    const withStringIds = {
      ...created,
      conversations: [
        {
          ...created.conversations[0],
          participantIds: JSON.stringify(['u1', 'u2']),
        },
      ],
    }
    const state = reducer(
      withStringIds,
      sendMessage({
        conversationId: id,
        senderId: 'u1',
        senderName: 'Amina',
        text: 'Bonjour',
      }),
    )
    expect(state.conversations[0].messages).toHaveLength(1)
    expect(Array.isArray(state.conversations[0].participantIds)).toBe(true)
  })

  it('met a jour le contexte et le snapshot lors d une seconde annonce', () => {
    const snapshotA = {
      type: 'listing',
      id: 'LST-1',
      title: 'Velo',
      path: '/marketplace/LST-1',
      subtitle: '100 EUR',
    }
    const snapshotB = {
      type: 'listing',
      id: 'LST-2',
      title: 'Table',
      path: '/marketplace/LST-2',
      subtitle: '50 EUR',
    }
    const first = reducer(
      emptyState,
      createConversation({
        title: 'Velo',
        participantIds: ['u1', 'u2'],
        createdBy: 'u1',
        relatedType: 'listing',
        relatedId: 'LST-1',
        relatedPath: '/marketplace/LST-1',
        relatedSnapshot: snapshotA,
      }),
    )
    const second = reducer(
      first,
      createConversation({
        title: 'Table',
        participantIds: ['u1', 'u2'],
        createdBy: 'u1',
        relatedType: 'listing',
        relatedId: 'LST-2',
        relatedPath: '/marketplace/LST-2',
        relatedSnapshot: snapshotB,
      }),
    )
    expect(second.conversations).toHaveLength(1)
    expect(second.conversations[0].relatedId).toBe('LST-2')
    expect(second.conversations[0].relatedSnapshot.title).toBe('Table')
    expect(second.conversations[0].relatedContexts).toHaveLength(2)
    expect(second.conversations[0].relatedContexts[0].relatedSnapshot.title).toBe('Velo')
    expect(second.conversations[0].relatedContexts[1].relatedSnapshot.title).toBe('Table')
  })

  it('converge vers une seule conversation par paire de participants', () => {
    const first = reducer(
      emptyState,
      createConversation({
        title: 'Annonce A',
        participantIds: ['u1', 'u2'],
        createdBy: 'u1',
        relatedType: 'listing',
        relatedId: 'LST-1',
      }),
    )
    const second = reducer(
      first,
      createConversation({
        title: 'Annonce B',
        participantIds: ['u1', 'u2'],
        createdBy: 'u1',
        relatedType: 'listing',
        relatedId: 'LST-2',
      }),
    )
    expect(second.conversations).toHaveLength(1)
    expect(second.conversations[0].relatedId).toBe('LST-2')
  })

  it('conserve les messages locaux lors du chargement distant', () => {
    const created = reducer(
      emptyState,
      createConversation({ title: 'Duo', participantIds: ['u1', 'u2'], createdBy: 'u1' }),
    )
    const conversationId = created.conversations[0].id
    const sent = reducer(
      created,
      sendMessage({
        conversationId,
        senderId: 'u1',
        senderName: 'Amina',
        text: 'Local',
      }),
    )
    const localId = sent.conversations[0].messages[0].id
    const loaded = reducer(
      sent,
      setConversationMessages({
        conversationId,
        messages: [
          {
            id: 'MSG-REMOTE',
            senderId: 'u2',
            senderName: 'Bob',
            text: 'Distant',
            createdAt: '2026-01-02T10:00:00.000Z',
          },
        ],
      }),
    )
    expect(loaded.conversations[0].messages.map((item) => item.id)).toEqual([
      'MSG-REMOTE',
      localId,
    ])
  })

  it('conserve le cache messages lors d une resynchronisation des conversations', () => {
    const local = [
      normalizeConversation({
        id: 'CONV-1',
        participantIds: ['u1', 'u2'],
        messages: [
          {
            id: 'MSG-1',
            senderId: 'u1',
            senderName: 'Amina',
            text: 'Cache local',
            createdAt: '2026-01-02T10:00:00.000Z',
          },
        ],
        messagesLoaded: true,
        messageCount: 1,
        updatedAt: '2026-01-02T10:00:00.000Z',
      }),
    ]
    const remote = [
      normalizeConversation({
        id: 'CONV-1',
        participantIds: ['u1', 'u2'],
        messages: [],
        messagesLoaded: false,
        messageCount: 1,
        updatedAt: '2026-01-02T11:00:00.000Z',
      }),
    ]

    const merged = mergeConversations(local, remote)
    expect(merged).toHaveLength(1)
    expect(merged[0].messages).toHaveLength(1)
    expect(merged[0].messages[0].text).toBe('Cache local')
    expect(merged[0].messagesLoaded).toBe(true)
  })

  it('conserve le brouillon local lors d une resynchronisation inbox', () => {
    const local = [
      normalizeConversation({
        id: 'CONV-1',
        participantIds: ['u1', 'u2'],
        drafts: { u1: 'Message en cours' },
        messages: [],
        updatedAt: '2026-01-02T12:00:00.000Z',
      }),
    ]
    const remote = [
      normalizeConversation({
        id: 'CONV-1',
        participantIds: ['u1', 'u2'],
        messages: [],
        updatedAt: '2026-01-02T12:05:00.000Z',
      }),
    ]

    const merged = mergeConversations(local, remote)
    expect(merged[0].drafts.u1).toBe('Message en cours')
  })

  it('fusionne mergeMessageBatch sans doublons et trie par date', () => {
    const existing = [
      normalizeMessage({
        id: 'MSG-1',
        senderId: 'u1',
        text: 'Ancien',
        createdAt: '2026-01-02T10:00:00.000Z',
      }),
      normalizeMessage({
        id: 'MSG-2',
        senderId: 'u2',
        text: 'Recent',
        createdAt: '2026-01-02T11:00:00.000Z',
      }),
    ]
    const remoteRows = [
      {
        id: 'MSG-2',
        sender_id: 'u2',
        text: 'Recent mis a jour',
        created_at: '2026-01-02T11:00:00.000Z',
      },
      {
        id: 'MSG-3',
        sender_id: 'u1',
        text: 'Nouveau',
        created_at: '2026-01-02T12:00:00.000Z',
      },
    ]
    const merged = mergeMessageBatch(existing, remoteRows)
    expect(merged.map((item) => item.id)).toEqual(['MSG-1', 'MSG-2', 'MSG-3'])
    expect(merged[1].text).toBe('Recent mis a jour')
  })

  it('skip le rechargement quand le cache couvre le compteur distant', () => {
    expect(
      shouldSkipMessageReload({ messagesLoaded: true, expectedCount: 12, loadedCount: 12 }),
    ).toBe(true)
    expect(
      shouldSkipMessageReload({ messagesLoaded: true, expectedCount: 20, loadedCount: 12 }),
    ).toBe(false)
    expect(
      shouldSkipMessageReload({ messagesLoaded: false, expectedCount: 5, loadedCount: 5 }),
    ).toBe(false)
  })

  it('detecte les messages plus anciens a charger', () => {
    expect(
      resolveHasOlderMessages({
        messages: [{ id: '1' }, { id: '2' }],
        messageCount: 5,
        fetchedCount: 2,
        fetchLimit: 200,
      }),
    ).toBe(true)
    expect(
      resolveHasOlderMessages({
        messages: Array.from({ length: 200 }, (_, index) => ({ id: String(index) })),
        messageCount: 200,
        fetchedCount: 200,
        fetchLimit: 200,
      }),
    ).toBe(true)
    expect(
      resolveHasOlderMessages({
        messages: [{ id: '1' }],
        messageCount: 1,
        fetchedCount: 1,
        fetchLimit: 200,
      }),
    ).toBe(false)
  })
})
