import { describe, expect, it } from 'vitest'
import {
  applySeenLedgerToStatuses,
  mergeStatusViewers,
  mergeViewedByLists,
  rememberSeenStatus,
  statusHasBeenViewedBy,
} from './statusViewUtils'

describe('statusViewUtils', () => {
  it('normalise les ids pour hasBeenViewed', () => {
    expect(statusHasBeenViewedBy({ viewedBy: ['abc'] }, 'abc')).toBe(true)
    expect(statusHasBeenViewedBy({ viewedBy: ['abc'] }, 'xyz')).toBe(false)
    expect(statusHasBeenViewedBy({ viewed_by: ['abc'] }, 'abc')).toBe(true)
  })

  it('fusionne viewedBy sans doublons', () => {
    expect(mergeViewedByLists(['a'], ['a', 'b'], null)).toEqual(['a', 'b'])
  })

  it('conserve la première date de vue', () => {
    const merged = mergeStatusViewers(
      { u1: { name: 'A', viewedAt: '2026-07-29T12:00:00.000Z' } },
      { u1: { name: 'A', viewedAt: '2026-07-28T08:00:00.000Z' } },
    )
    expect(merged.u1.viewedAt).toBe('2026-07-28T08:00:00.000Z')
  })

  it('applique le ledger local des vues', () => {
    rememberSeenStatus('user-1', 'STA-1')
    const items = applySeenLedgerToStatuses([{ id: 'STA-1', viewedBy: [] }, { id: 'STA-2', viewedBy: [] }], 'user-1')
    expect(items[0].viewedBy).toContain('user-1')
    expect(items[1].viewedBy).toEqual([])
  })
})
