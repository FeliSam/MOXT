import { describe, expect, it } from 'vitest'

import { fromRow, fromRows } from './remoteRowMapper.js'

describe('remoteRowMapper', () => {
  it('convertit les clés snake_case en camelCase', () => {
    expect(
      fromRow({
        user_id: 'u1',
        created_at: '2026-01-01',
        departure_date: '2026-02-01',
      }),
    ).toEqual({
      userId: 'u1',
      createdAt: '2026-01-01',
      departureDate: '2026-02-01',
    })
  })

  it('mappe les champs messagerie', () => {
    expect(
      fromRow({
        related_snapshot: { title: 'Velo', path: '/marketplace/L1' },
        related_contexts: [{ related_snapshot: { title: 'Table', path: '/x' } }],
        participant_profiles: { u1: { name: 'Alice' } },
        message_count: 3,
        sender_id: 'u1',
      }),
    ).toEqual({
      relatedSnapshot: { title: 'Velo', path: '/marketplace/L1' },
      relatedContexts: [{ related_snapshot: { title: 'Table', path: '/x' } }],
      participantProfiles: { u1: { name: 'Alice' } },
      messageCount: 3,
      senderId: 'u1',
    })
  })

  it('mappe un tableau de lignes', () => {
    expect(fromRows([{ owner_name: 'Alice' }])).toEqual([{ ownerName: 'Alice' }])
  })
})
