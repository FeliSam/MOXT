import { describe, expect, it } from 'vitest'
import {
  buildMessageSuggestions,
  filterAlreadySentSuggestions,
  resolveConversationRole,
} from './messageSuggestions'

describe('messageSuggestions', () => {
  const conversation = {
    id: 'CONV-1',
    createdBy: 'buyer',
    participantIds: ['buyer', 'seller'],
    relatedType: 'listing',
    relatedContexts: [
      {
        id: 'CTX-1',
        relatedSnapshot: {
          type: 'listing',
          id: 'LST-1',
          title: 'Vélo électrique',
          subtitle: '350 EUR',
        },
      },
    ],
  }

  it('distingue le contact de l annonceur', () => {
    expect(resolveConversationRole(conversation, 'buyer')).toBe('contact')
    expect(resolveConversationRole(conversation, 'seller')).toBe('owner')
  })

  it('propose des messages différents selon le rôle', () => {
    const buyer = buildMessageSuggestions({
      conversation,
      userId: 'buyer',
      relatedPreview: conversation.relatedContexts[0].relatedSnapshot,
      peerName: 'Marie',
    })
    const seller = buildMessageSuggestions({
      conversation,
      userId: 'seller',
      relatedPreview: conversation.relatedContexts[0].relatedSnapshot,
      peerName: 'Jean',
    })

    expect(buyer[0]).toMatch(/Vélo électrique/i)
    expect(seller[0]).toMatch(/merci pour votre intérêt/i)
    expect(buyer).not.toEqual(seller)
  })

  it('personnalise selon le type d annonce', () => {
    const jobConversation = {
      ...conversation,
      createdBy: 'candidate',
      participantIds: ['candidate', 'recruiter'],
      relatedType: 'job',
    }
    const suggestions = buildMessageSuggestions({
      conversation: jobConversation,
      userId: 'candidate',
      relatedPreview: {
        type: 'job',
        title: 'Développeur React',
        subtitle: 'Tech',
      },
      peerName: 'Paul',
    })

    expect(suggestions[0]).toMatch(/Développeur React/i)
    expect(suggestions.some((item) => /postuler|candidature|recrutement/i.test(item))).toBe(true)
  })

  it('retire les suggestions déjà envoyées et propose les suivantes', () => {
    const pool = [
      'Bonjour, est-ce encore disponible ?',
      'Quel est le prix final ?',
      'Pouvez-vous confirmer la localisation ?',
      'Merci pour votre retour.',
    ]
    const remaining = filterAlreadySentSuggestions(pool, [
      'Bonjour, est-ce encore disponible ?',
    ])
    expect(remaining).not.toContain('Bonjour, est-ce encore disponible ?')
    expect(remaining.length).toBeGreaterThan(0)
    expect(remaining[0]).toMatch(/prix|localisation|retour/i)
  })

  it('adapte les suggestions après envoi dans la conversation', () => {
    const conversationWithMessage = {
      id: 'CONV-1',
      createdBy: 'buyer',
      participantIds: ['buyer', 'seller'],
      relatedType: 'listing',
      relatedContexts: [
        {
          id: 'CTX-1',
          relatedSnapshot: {
            type: 'listing',
            id: 'LST-1',
            title: 'Vélo électrique',
            subtitle: '350 EUR',
          },
        },
      ],
      messages: [
        {
          senderId: 'buyer',
          text: 'Bonjour, « Vélo électrique » est-il encore disponible ?',
        },
      ],
    }
    const first = buildMessageSuggestions({
      conversation: conversationWithMessage,
      userId: 'buyer',
      relatedPreview: conversationWithMessage.relatedContexts[0].relatedSnapshot,
      peerName: 'Marie',
      sentTexts: [],
    })
    const next = buildMessageSuggestions({
      conversation: conversationWithMessage,
      userId: 'buyer',
      relatedPreview: conversationWithMessage.relatedContexts[0].relatedSnapshot,
      peerName: 'Marie',
      sentTexts: [conversationWithMessage.messages[0].text],
    })
    expect(first[0]).toMatch(/encore disponible/i)
    expect(next[0]).not.toMatch(/encore disponible/i)
  })
})
