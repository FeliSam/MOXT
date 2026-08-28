import { beforeEach, describe, expect, it } from 'vitest'
import {
  classifyStarsNotify,
  starsNotifyCopy,
  starsNotifyId,
  takeUnseenStarsTransactions,
  writeStarsSeenIds,
} from './starsNotify'

describe('starsNotify', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('classifies purchase, referral, gift and spend', () => {
    expect(classifyStarsNotify({ kind: 'credit', ref_type: 'purchase' })).toBe('purchase')
    expect(classifyStarsNotify({ kind: 'credit', ref_type: 'referral' })).toBe('referral')
    expect(classifyStarsNotify({ kind: 'credit', ref_type: 'gift' })).toBe('giftReceived')
    expect(classifyStarsNotify({ kind: 'debit', category: 'gift' })).toBe('giftSent')
    expect(classifyStarsNotify({ kind: 'debit', category: 'marketplace' })).toBe('spend')
  })

  it('builds a stable notification id from idempotency then id', () => {
    expect(starsNotifyId({ id: 'abc', idempotency_key: 'purchase:1' })).toBe('NOT-STARS-purchase:1')
    expect(starsNotifyId({ id: 'abc' })).toBe('NOT-STARS-abc')
  })

  it('seeds the first history load without notifying', () => {
    const rows = [
      { id: '1', kind: 'credit', ref_type: 'referral', amount: 5 },
      { id: '2', kind: 'credit', ref_type: 'purchase', amount: 50 },
    ]
    const first = takeUnseenStarsTransactions(rows, [])
    expect(first.mode).toBe('seed')
    expect(first.items).toEqual([])
    expect(first.markIds).toEqual(['NOT-STARS-1', 'NOT-STARS-2'])

    writeStarsSeenIds('u1', first.markIds)
    const later = takeUnseenStarsTransactions(
      [...rows, { id: '3', kind: 'credit', ref_type: 'purchase', amount: 20 }],
      ['NOT-STARS-1', 'NOT-STARS-2'],
    )
    expect(later.mode).toBe('notify')
    expect(later.items.map((item) => item.id)).toEqual(['3'])
  })

  it('uses i18n copy for purchase credits', () => {
    const t = (key, vars) => `${key}:${vars?.n ?? ''}`
    expect(starsNotifyCopy('purchase', 50, t)).toEqual({
      title: 'notificationsFeed.starsPurchase:',
      message: 'notificationsFeed.starsPurchaseBody:50',
      priority: 'high',
    })
  })
})
