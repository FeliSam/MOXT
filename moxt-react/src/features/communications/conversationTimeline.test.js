import { describe, expect, it } from 'vitest'
import {
  appendRelatedContext,
  buildConversationTimeline,
  contextHasMessages,
  findRelatedContext,
  findRelatedContextById,
  hasRelatedContext,
  normalizeRelatedContexts,
} from './conversationTimeline'

describe('conversationTimeline', () => {
  const snapshotA = {
    type: 'listing',
    id: 'LST-1',
    title: 'Velo',
    path: '/marketplace/LST-1',
  }
  const snapshotB = {
    type: 'listing',
    id: 'LST-2',
    title: 'Table',
    path: '/marketplace/LST-2',
  }

  it('reconstruit les contextes depuis relatedSnapshot legacy', () => {
    expect(
      normalizeRelatedContexts({
        relatedType: 'listing',
        relatedId: 'LST-1',
        relatedSnapshot: snapshotA,
        createdAt: '2026-07-07T10:00:00.000Z',
      }),
    ).toHaveLength(1)
  })

  it('ajoute un nouveau produit sans dupliquer', () => {
    const first = appendRelatedContext(
      { relatedContexts: [] },
      {
        relatedType: 'listing',
        relatedId: 'LST-1',
        relatedSnapshot: snapshotA,
      },
    )
    const second = appendRelatedContext(first, {
      relatedType: 'listing',
      relatedId: 'LST-1',
      relatedSnapshot: snapshotA,
    })
    const third = appendRelatedContext(second, {
      relatedType: 'listing',
      relatedId: 'LST-2',
      relatedSnapshot: snapshotB,
    })

    expect(second.relatedContexts).toHaveLength(1)
    expect(third.relatedContexts).toHaveLength(2)
  })

  it('reconstruit une preview depuis relatedPath sans snapshot.path, si un message existe', () => {
    const timeline = buildConversationTimeline(
      {
        relatedType: 'listing',
        relatedId: 'LST-1',
        relatedPath: '/marketplace/LST-1',
        relatedSnapshot: { type: 'listing', id: 'LST-1', title: 'Velo' },
        createdAt: '2026-07-07T10:00:00.000Z',
        messages: [
          { id: 'MSG-1', senderId: 'u1', text: 'Bonjour', createdAt: '2026-07-07T10:30:00.000Z' },
        ],
      },
      'u1',
    )

    expect(timeline).toHaveLength(2)
    expect(timeline[0].kind).toBe('related')
    expect(timeline[0].preview.path).toBe('/marketplace/LST-1')
    expect(timeline[0].preview.title).toBe('Velo')
  })

  it("n'affiche pas le contexte tant qu'aucun message n'a été échangé (clic sur Contacter sans écrire)", () => {
    const timeline = buildConversationTimeline(
      {
        relatedType: 'listing',
        relatedId: 'LST-1',
        relatedPath: '/marketplace/LST-1',
        relatedSnapshot: { type: 'listing', id: 'LST-1', title: 'Velo' },
        createdAt: '2026-07-07T10:00:00.000Z',
        messages: [],
      },
      'u1',
    )

    expect(timeline).toHaveLength(0)
  })

  it('ordonne annonces et messages dans le fil, uniquement pour les contextes ayant un message', () => {
    const timeline = buildConversationTimeline(
      {
        relatedContexts: [
          {
            id: 'CTX-1',
            introducedAt: '2026-07-07T10:00:00.000Z',
            relatedSnapshot: snapshotA,
          },
          {
            id: 'CTX-2',
            introducedAt: '2026-07-07T12:00:00.000Z',
            relatedSnapshot: snapshotB,
          },
        ],
        messages: [
          {
            id: 'MSG-1',
            senderId: 'u1',
            text: 'Bonjour',
            createdAt: '2026-07-07T11:00:00.000Z',
          },
        ],
      },
      'u1',
    )

    // Le message à 11h tombe dans la fenêtre de CTX-1 (10h-12h) mais pas de
    // CTX-2 (12h-...) : seul CTX-1 apparaît, CTX-2 n'a suscité aucun message.
    expect(timeline.map((item) => item.kind)).toEqual(['related', 'message'])
    expect(timeline[0].preview.title).toBe('Velo')
    expect(timeline[1].message.text).toBe('Bonjour')
  })

  it('affiche un second contexte dès qu’un message est envoyé après son introduction', () => {
    const timeline = buildConversationTimeline(
      {
        relatedContexts: [
          {
            id: 'CTX-1',
            introducedAt: '2026-07-07T10:00:00.000Z',
            relatedSnapshot: snapshotA,
          },
          {
            id: 'CTX-2',
            introducedAt: '2026-07-07T12:00:00.000Z',
            relatedSnapshot: snapshotB,
          },
        ],
        messages: [
          { id: 'MSG-1', senderId: 'u1', text: 'Bonjour', createdAt: '2026-07-07T11:00:00.000Z' },
          { id: 'MSG-2', senderId: 'u1', text: 'Et la table ?', createdAt: '2026-07-07T12:30:00.000Z' },
        ],
      },
      'u1',
    )

    expect(timeline.map((item) => item.kind)).toEqual(['related', 'message', 'related', 'message'])
  })

  describe('contextHasMessages', () => {
    const context = { id: 'CTX-1', introducedAt: '2026-07-07T10:00:00.000Z' }
    const conversation = {
      relatedContexts: [{ id: 'CTX-1', introducedAt: '2026-07-07T10:00:00.000Z' }],
    }

    it('faux sans aucun message', () => {
      expect(contextHasMessages(context, { ...conversation, messages: [] })).toBe(false)
    })

    it('vrai si un message est explicitement lié au contexte (réponse depuis la carte)', () => {
      expect(
        contextHasMessages(context, {
          ...conversation,
          messages: [
            {
              id: 'MSG-1',
              relatedContextId: 'CTX-1',
              createdAt: '2026-07-01T00:00:00.000Z', // même hors fenêtre temporelle
            },
          ],
        }),
      ).toBe(true)
    })

    it('vrai si un message ordinaire est envoyé pendant la fenêtre du contexte', () => {
      expect(
        contextHasMessages(context, {
          ...conversation,
          messages: [{ id: 'MSG-1', createdAt: '2026-07-07T10:30:00.000Z' }],
        }),
      ).toBe(true)
    })

    it("faux si le message n'est explicitement lié qu'à un autre contexte", () => {
      expect(
        contextHasMessages(context, {
          ...conversation,
          messages: [
            { id: 'MSG-1', relatedContextId: 'CTX-2', createdAt: '2026-07-07T10:30:00.000Z' },
          ],
        }),
      ).toBe(false)
    })
  })

  it('retrouve un contexte existant par type et id', () => {
    const conversation = {
      relatedContexts: [
        {
          id: 'CTX-1',
          relatedType: 'listing',
          relatedId: 'LST-1',
          relatedSnapshot: snapshotA,
        },
      ],
    }

    expect(hasRelatedContext(conversation, 'listing', 'LST-1')).toBe(true)
    expect(hasRelatedContext(conversation, 'listing', 'LST-2')).toBe(false)
    expect(findRelatedContext(conversation, 'listing', 'LST-1')?.id).toBe('CTX-1')
    expect(findRelatedContextById(conversation, 'CTX-1')?.relatedId).toBe('LST-1')
  })
})
