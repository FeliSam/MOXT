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

  it('mappe un tableau de lignes', () => {
    expect(fromRows([{ owner_name: 'Alice' }])).toEqual([{ ownerName: 'Alice' }])
  })
})
