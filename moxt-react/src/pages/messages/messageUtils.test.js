import { describe, expect, it } from 'vitest'
import { conversationPreview } from './messageUtils.js'

describe('conversationPreview', () => {
  it('utilise lastMessageText quand les messages ne sont pas chargés', () => {
    const preview = conversationPreview(
      {
        messages: [],
        messageCount: 3,
        lastMessageText: 'Bonjour, toujours dispo ?',
        lastMessageSenderId: 'peer-1',
      },
      'u1',
    )
    expect(preview).toBe('Bonjour, toujours dispo ?')
  })

  it('prefere le dernier message chargé localement', () => {
    const preview = conversationPreview(
      {
        messages: [{ id: 'm1', senderId: 'u1', text: 'Ma réponse', createdAt: '' }],
        lastMessageText: 'Ancien aperçu',
        lastMessageSenderId: 'peer-1',
      },
      'u1',
    )
    expect(preview).toBe('Vous : Ma réponse')
  })
})
