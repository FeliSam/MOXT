import { describe, expect, it } from 'vitest'
import {
  appendRelatedContext,
  buildConversationTimeline,
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

  it('reconstruit une preview depuis relatedPath sans snapshot.path', () => {
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

    expect(timeline).toHaveLength(1)
    expect(timeline[0].kind).toBe('related')
    expect(timeline[0].preview.path).toBe('/marketplace/LST-1')
    expect(timeline[0].preview.title).toBe('Velo')
  })

  it('ordonne annonces et messages dans le fil', () => {
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

    expect(timeline.map((item) => item.kind)).toEqual(['related', 'message', 'related'])
    expect(timeline[1].message.text).toBe('Bonjour')
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
