import { describe, expect, it } from 'vitest'
import { conversationMatchesQuery, conversationPreview, messageReadLabel } from './messageUtils.js'

describe('messageReadLabel', () => {
  it('affiche Lu quand le correspondant a lu', () => {
    expect(
      messageReadLabel({ senderId: 'u1', readBy: ['u1', 'u2'], deliveredTo: ['u2'] }, 'u1'),
    ).toBe('· Lu')
  })

  it('affiche Distribué avant lecture', () => {
    expect(messageReadLabel({ senderId: 'u1', readBy: ['u1'], deliveredTo: ['u2'] }, 'u1')).toBe(
      '· Distribué',
    )
  })

  it('affiche Envoyé tant que le correspondant n a pas recu', () => {
    expect(messageReadLabel({ senderId: 'u1', readBy: ['u1'], deliveredTo: [] }, 'u1')).toBe(
      '· Envoyé',
    )
  })
})

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

describe('conversationMatchesQuery', () => {
  it('trouve un match dans le texte des messages', () => {
    const conversation = {
      participantIds: ['u1', 'u2'],
      participants: { u2: { name: 'Alex' } },
      messages: [{ id: 'm1', text: 'Dispo pour la livraison demain', attachment: null }],
      lastMessageText: '',
    }
    expect(conversationMatchesQuery(conversation, 'u1', 'livraison')).toBe(true)
    expect(conversationMatchesQuery(conversation, 'u1', 'absent')).toBe(false)
  })

  it('trouve un match dans le nom de pièce jointe', () => {
    const conversation = {
      participantIds: ['u1', 'u2'],
      participants: { u2: { name: 'Alex' } },
      messages: [
        {
          id: 'm1',
          text: '',
          attachment: { name: 'facture-mars.pdf', type: 'application/pdf' },
        },
      ],
    }
    expect(conversationMatchesQuery(conversation, 'u1', 'facture')).toBe(true)
  })
})
