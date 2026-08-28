import { describe, expect, it } from 'vitest'
import {
  consolidatePoolGrants,
  historyEntryMeta,
  isLegacyCategoryMonthlyGrant,
  isMonthlyBonusGrant,
  normalizeStarsHistory,
} from './starsHistoryUtils'

describe('starsHistoryUtils', () => {
  it('detects monthly bonus grants', () => {
    expect(
      isMonthlyBonusGrant({
        kind: 'credit',
        star_type: 'bonus',
        ref_type: 'monthly_grant',
        category: 'pool',
      }),
    ).toBe(true)
    expect(
      isMonthlyBonusGrant({
        kind: 'credit',
        star_type: 'bonus',
        reason: 'Quota bonus du mois',
        category: 'jobs',
      }),
    ).toBe(true)
    expect(
      isMonthlyBonusGrant({
        kind: 'debit',
        star_type: 'bonus',
        ref_type: 'monthly_grant',
      }),
    ).toBe(false)
  })

  it('flags legacy per-category monthly grants', () => {
    expect(
      isLegacyCategoryMonthlyGrant({
        kind: 'credit',
        star_type: 'bonus',
        ref_type: 'monthly_grant',
        category: 'marketplace',
      }),
    ).toBe(true)
    expect(
      isLegacyCategoryMonthlyGrant({
        kind: 'credit',
        star_type: 'bonus',
        ref_type: 'monthly_grant',
        category: 'pool',
      }),
    ).toBe(false)
  })

  it('filters legacy category grants from history', () => {
    const rows = normalizeStarsHistory([
      { id: '1', kind: 'credit', star_type: 'bonus', ref_type: 'monthly_grant', category: 'pool', amount: 3, created_at: '2026-08-28T06:46:00Z' },
      { id: '2', kind: 'credit', star_type: 'bonus', ref_type: 'monthly_grant', category: 'jobs' },
      { id: '3', kind: 'debit', star_type: 'bonus', category: 'marketplace', amount: 20, created_at: '2026-08-28T08:00:00Z' },
    ])
    expect(rows.map((row) => row.id)).toEqual(['3', '1'])
  })

  it('merges pool grants from the same month', () => {
    const rows = consolidatePoolGrants([
      { id: 'a', kind: 'credit', star_type: 'bonus', category: 'pool', ref_type: 'monthly_grant', amount: 3, created_at: '2026-08-28T06:46:00Z' },
      { id: 'b', kind: 'credit', star_type: 'bonus', category: 'pool', ref_type: 'rollout_topup', amount: 27, created_at: '2026-08-28T07:16:00Z' },
      { id: 'c', kind: 'credit', star_type: 'paid', ref_type: 'purchase', amount: 50, created_at: '2026-08-28T06:51:00Z' },
    ])
    expect(rows.find((row) => row.id === 'a')?.amount).toBe(30)
    expect(rows.filter((row) => row.category === 'pool')).toHaveLength(1)
  })

  it('labels spend and purchase rows', () => {
    const t = (key, vars) => {
      if (key === 'stars.historySpendPublish') return `Publication ${vars.category}`
      const map = {
        'stars.historyPurchase': 'Achat de Stars',
        'stars.historySpendBoost': 'Boost publication',
        'stars.categories.marketplace': 'Marketplace',
        'stars.bonusPoolShort': 'Bonus pool',
        'stars.paidBalance': 'Paid Stars',
      }
      return map[key] || key
    }

    expect(
      historyEntryMeta(
        { kind: 'debit', star_type: 'bonus', category: 'marketplace', amount: 20 },
        t,
      ).headline,
    ).toBe('Publication Marketplace')

    expect(
      historyEntryMeta(
        { kind: 'credit', star_type: 'paid', ref_type: 'purchase', amount: 50, reason: 'Achat pack pack-50' },
        t,
        [{ id: 'pack-50', title: 'Pack 50 Stars' }],
      ).detail,
    ).toBe('Pack 50 Stars')
  })
})
