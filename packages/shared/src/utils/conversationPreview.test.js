import { describe, expect, it } from 'vitest'
import { resolveConversationPreviewMessage } from './conversationPreview.js'

describe('resolveConversationPreviewMessage', () => {
  it('uses lastMessageText when messages are empty', () => {
    const result = resolveConversationPreviewMessage(
      {
        messages: [],
        lastMessageText: 'Bonjour',
        lastMessageSenderId: 'peer-1',
        lastMessageAt: '2026-01-02T00:00:00.000Z',
      },
      'u1',
    )
    expect(result).toMatchObject({
      text: 'Bonjour',
      senderId: 'peer-1',
      source: 'meta',
    })
  })

  it('prefers newer meta over stale loaded messages', () => {
    const result = resolveConversationPreviewMessage(
      {
        messages: [
          {
            id: 'm1',
            senderId: 'u1',
            text: 'Ancien',
            createdAt: '2026-01-01T10:00:00.000Z',
          },
        ],
        lastMessageText: 'Nouveau distant',
        lastMessageSenderId: 'peer-1',
        lastMessageAt: '2026-01-02T12:00:00.000Z',
      },
      'u1',
    )
    expect(result?.text).toBe('Nouveau distant')
    expect(result?.source).toBe('meta')
  })

  it('prefers loaded message when meta has no timestamp', () => {
    const result = resolveConversationPreviewMessage(
      {
        messages: [{ id: 'm1', senderId: 'u1', text: 'Local', createdAt: '' }],
        lastMessageText: 'Ancien aperçu',
        lastMessageSenderId: 'peer-1',
      },
      'u1',
    )
    expect(result?.text).toBe('Local')
    expect(result?.source).toBe('message')
  })

  it('skips soft-deleted messages for the current user', () => {
    const result = resolveConversationPreviewMessage(
      {
        messages: [
          {
            id: 'm1',
            senderId: 'peer-1',
            text: 'Toujours visible',
            createdAt: '2026-01-01T10:00:00.000Z',
          },
          {
            id: 'm2',
            senderId: 'peer-1',
            text: 'Supprimé',
            createdAt: '2026-01-02T10:00:00.000Z',
            deletedBy: ['u1'],
          },
        ],
        lastMessageText: 'Supprimé',
        lastMessageSenderId: 'peer-1',
        lastMessageAt: '2026-01-02T10:00:00.000Z',
      },
      'u1',
    )
    expect(result?.text).toBe('Toujours visible')
    expect(result?.source).toBe('message')
  })
})
